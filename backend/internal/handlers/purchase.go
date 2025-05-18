package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// POST /api/purchase
func CreatePurchaseRequest(w http.ResponseWriter, r *http.Request) {
	type Item struct {
		ProductID int `json:"productID"`
		Quantity  int `json:"quantity"`
	}
	type PurchasePayload struct {
		UserID int    `json:"userID"`
		Items  []Item `json:"items"`
	}

	var payload PurchasePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Transaction error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	//log.Printf("Creating purchase request for userID: %d", payload.UserID)
	res, err := tx.Exec("INSERT INTO purchase_requests (userID) VALUES (?)", payload.UserID)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	requestID, _ := res.LastInsertId()

	stmt, err := tx.Prepare("INSERT INTO purchase_items (requestID, productID, quantity) VALUES (?, ?, ?)")
	if err != nil {
		http.Error(w, "Statement error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	for _, item := range payload.Items {
		_, err := stmt.Exec(requestID, item.ProductID, item.Quantity)
		if err != nil {
			http.Error(w, "Insert item error", http.StatusInternalServerError)
			return
		}
	}
	tx.Commit()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Purchase request submitted",
	})
}

// GET /api/purchase-requests
func GetAllPurchaseRequests(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT r.id, r.userID, r.status, r.created_at, i.productID, i.quantity, p.productName
		FROM purchase_requests r
		JOIN purchase_items i ON r.id = i.requestID
		JOIN products p ON i.productID = p.id
		ORDER BY r.id DESC
	`)
	if err != nil {
		http.Error(w, "Query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Item struct {
		ProductID   int    `json:"productID"`
		ProductName string `json:"productName"`
		Quantity    int    `json:"quantity"`
	}
	type Request struct {
		ID        int    `json:"id"`
		UserID    int    `json:"userID"`
		Status    string `json:"status"`
		CreatedAt string `json:"created_at"`
		Items     []Item `json:"items"`
	}

	requestsMap := make(map[int]*Request)

	for rows.Next() {
		var rid, uid, pid, qty int
		var status, createdAt, pname string
		if err := rows.Scan(&rid, &uid, &status, &createdAt, &pid, &qty, &pname); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		req, exists := requestsMap[rid]
		if !exists {
			req = &Request{ID: rid, UserID: uid, Status: status, CreatedAt: createdAt}
			requestsMap[rid] = req
		}
		req.Items = append(req.Items, Item{ProductID: pid, ProductName: pname, Quantity: qty})
	}

	var allRequests []Request
	for _, req := range requestsMap {
		allRequests = append(allRequests, *req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allRequests)
}

// POST /api/purchase-requests/{id}/accept or /deny
func HandleRequestStatus(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/purchase-requests/")
	id = strings.TrimSuffix(id, "/accept")
	id = strings.TrimSuffix(id, "/deny")
	status := "accepted"
	if strings.HasSuffix(r.URL.Path, "/deny") {
		status = "denied"
	}
	_, err := db.DB.Exec("UPDATE purchase_requests SET status = ? WHERE id = ?", status, id)
	if err != nil {
		http.Error(w, "Failed to update request", http.StatusInternalServerError)
		return
	}
	log.Printf("Request %s marked as %s", id, status)
	w.Write([]byte("OK"))
}
