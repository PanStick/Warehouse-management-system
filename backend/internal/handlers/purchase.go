package handlers

import (
	"backend/internal/db"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
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
		SELECT r.id, r.userID, u.email, r.status, r.created_at, i.productID, i.quantity, p.productName
		FROM purchase_requests r
		JOIN users u ON r.userID = u.id
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
		Email     string `json:"email"`
		Status    string `json:"status"`
		CreatedAt string `json:"created_at"`
		Items     []Item `json:"items"`
	}

	requestsMap := make(map[int]*Request)

	for rows.Next() {
		var rid, uid, pid, qty int
		var email, status, createdAt, pname string
		if err := rows.Scan(&rid, &uid, &email, &status, &createdAt, &pid, &qty, &pname); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		req, exists := requestsMap[rid]
		if !exists {
			req = &Request{ID: rid, UserID: uid, Email: email, Status: status, CreatedAt: createdAt}
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

// GET /api/purchase-requests/user/{userID}
func GetPurchaseRequestsByUser(w http.ResponseWriter, r *http.Request) {

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "User ID missing", http.StatusBadRequest)
		return
	}
	userID := parts[len(parts)-1]

	rows, err := db.DB.Query(`
        SELECT r.id, r.userID, u.email, r.status, r.created_at,
               i.productID, i.quantity, p.productName
        FROM purchase_requests r
        JOIN users u ON r.userID = u.id
        JOIN purchase_items i ON r.id = i.requestID
        JOIN products p ON i.productID = p.id
        WHERE r.userID = ?
        ORDER BY r.id DESC
    `, userID)
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
		Email     string `json:"email"`
		Status    string `json:"status"`
		CreatedAt string `json:"created_at"`
		Items     []Item `json:"items"`
	}

	requestsMap := make(map[int]*Request)

	for rows.Next() {
		var rid, uid, pid, qty int
		var email, status, createdAt, pname string
		if err := rows.Scan(&rid, &uid, &email, &status, &createdAt, &pid, &qty, &pname); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		req, exists := requestsMap[rid]
		if !exists {
			req = &Request{
				ID:        rid,
				UserID:    uid,
				Email:     email,
				Status:    status,
				CreatedAt: createdAt,
			}
			requestsMap[rid] = req
		}
		req.Items = append(req.Items, Item{
			ProductID:   pid,
			ProductName: pname,
			Quantity:    qty,
		})
	}

	var userRequests []Request
	for _, req := range requestsMap {
		userRequests = append(userRequests, *req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userRequests)
}

// GET /api/purchase-requests/{id}
func GetPurchaseRequestByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/purchase-requests/")
	idStr = strings.TrimSuffix(idStr, "/") // optional trailing slash
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	rows, err := db.DB.Query(`
		SELECT r.id, r.userID, r.status, r.created_at, i.productID, i.quantity, p.productName
		FROM purchase_requests r
		JOIN purchase_items i ON r.id = i.requestID
		JOIN products p ON i.productID = p.id
		WHERE r.id = ?
	`, id)
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

	var req *Request

	for rows.Next() {
		var rid, uid, pid, qty int
		var status, createdAt, pname string
		if err := rows.Scan(&rid, &uid, &status, &createdAt, &pid, &qty, &pname); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		if req == nil {
			req = &Request{
				ID:        rid,
				UserID:    uid,
				Status:    status,
				CreatedAt: createdAt,
			}
		}
		req.Items = append(req.Items, Item{ProductID: pid, ProductName: pname, Quantity: qty})
	}

	if req == nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(req)
}

// POST /api/purchase-requests/{id}/accept or /deny
func HandleRequestStatus(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/purchase-requests/")
	id = strings.TrimSuffix(id, "/accept")
	id = strings.TrimSuffix(id, "/deny")
	status := "accepted"
	if strings.HasSuffix(r.URL.Path, "/accept") {
		ok, err := validateFullAssignment(id)
		if err != nil {
			http.Error(w, "Failed to validate assignment", http.StatusInternalServerError)
			return
		}
		if !ok {
			http.Error(w, "Incomplete or invalid batch assignment", http.StatusBadRequest)
			return
		}

		var exists int
		err = db.DB.QueryRow(`SELECT COUNT(*) FROM tasks WHERE requestID = ?`, id).Scan(&exists)
		if err != nil {
			http.Error(w, "Failed to check existing task", http.StatusInternalServerError)
			return
		}
		if exists == 0 {
			_, err = db.DB.Exec(`INSERT INTO tasks (requestID, workerID) VALUES (?, ?)`, id, 1)
			if err != nil {
				http.Error(w, "Failed to assign task", http.StatusInternalServerError)
				return
			}
		}
	}

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

func validateFullAssignment(requestID string) (bool, error) {
	query := `
		SELECT pi.id, pi.quantity, IFNULL(SUM(ab.quantity), 0)
		FROM purchase_items pi
		LEFT JOIN assigned_batches ab ON ab.itemID = pi.id
		WHERE pi.requestID = ?
		GROUP BY pi.id
	`
	rows, err := db.DB.Query(query, requestID)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var itemID int
		var required, assigned float64
		if err := rows.Scan(&itemID, &required, &assigned); err != nil {
			return false, err
		}
		if assigned != required {
			return false, nil // Not fully assigned
		}
	}
	return true, nil
}

// GET /api/purchase-requests/{id}/details
func GetPurchaseRequestDetails(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/purchase-requests/")
	idStr = strings.TrimSuffix(idStr, "/details")
	requestID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	type Batch struct {
		BatchID        int     `json:"batchID"`
		Quantity       float64 `json:"quantity"`
		ExpirationDate *string `json:"expirationDate"`
	}

	type ItemDetail struct {
		ItemID      int     `json:"itemID"`
		ProductID   int     `json:"productID"`
		ProductName string  `json:"productName"`
		Quantity    float64 `json:"quantity"`
		Batches     []Batch `json:"batches"`
	}

	var items []ItemDetail

	itemRows, err := db.DB.Query(`
		SELECT i.id, i.productID, p.productName, i.quantity
		FROM purchase_items i
		JOIN products p ON i.productID = p.id
		WHERE i.requestID = ?
	`, requestID)
	if err != nil {
		http.Error(w, "Failed to fetch items", http.StatusInternalServerError)
		return
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var item ItemDetail
		err := itemRows.Scan(&item.ItemID, &item.ProductID, &item.ProductName, &item.Quantity)
		if err != nil {
			http.Error(w, "Failed to scan item", http.StatusInternalServerError)
			return
		}

		batchRows, err := db.DB.Query(`
			SELECT batchID, quantity, expirationDate
			FROM stock
			WHERE productID = ?
			ORDER BY (expirationDate IS NULL), expirationDate
		`, item.ProductID)
		if err != nil {
			http.Error(w, "Failed to fetch batches", http.StatusInternalServerError)
			return
		}
		for batchRows.Next() {
			var b Batch
			var expRaw sql.NullString
			if err := batchRows.Scan(&b.BatchID, &b.Quantity, &expRaw); err != nil {
				log.Println("Failed to scan batch:", err)
				http.Error(w, "Failed to scan batch", http.StatusInternalServerError)
				return
			}
			if expRaw.Valid {
				// Parse the string manually
				t, err := time.Parse("2006-01-02", expRaw.String)
				if err == nil {
					str := t.Format("2006-01-02")
					b.ExpirationDate = &str
				}
			}

			item.Batches = append(item.Batches, b)
		}

		batchRows.Close()

		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": items,
	})
}

// POST /api/purchase-requests/{id}/assign-batches
func AssignBatches(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/purchase-requests/")
	idStr = strings.TrimSuffix(idStr, "/assign-batches")

	type BatchAssignment struct {
		ItemID   int     `json:"itemID"`
		BatchID  int     `json:"batchID"`
		Quantity float64 `json:"quantity"`
	}
	var payload struct {
		Batches []BatchAssignment `json:"batches"`
	}
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

	// Clear previous assignments for the request
	_, err = tx.Exec(`DELETE ab FROM assigned_batches ab
		JOIN purchase_items pi ON ab.itemID = pi.id
		WHERE pi.requestID = ?`, idStr)
	if err != nil {
		http.Error(w, "Failed to clear previous assignments", http.StatusInternalServerError)
		return
	}

	for _, b := range payload.Batches {
		_, err := tx.Exec(`INSERT INTO assigned_batches (itemID, batchID, quantity) VALUES (?, ?, ?)`,
			b.ItemID, b.BatchID, b.Quantity)
		if err != nil {
			http.Error(w, "Failed to assign batch", http.StatusInternalServerError)
			return
		}
		_, err = tx.Exec(`UPDATE stock SET quantity = quantity - ? WHERE batchID = ?`, b.Quantity, b.BatchID)
		if err != nil {
			http.Error(w, "Failed to update stock", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit assignments", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Assignments saved"))
}
