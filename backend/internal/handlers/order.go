package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/db"
)

// POST /api/ordered-products
func CreateOrderedProduct(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		ProductID      int     `json:"productID"`
		Quantity       float64 `json:"quantity"`
		ExpirationDate *string `json:"expirationDate"` // optional, in "YYYY-MM-DD"
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err := db.DB.Exec(
		`INSERT INTO orderedProducts (productID, quantity, expirationDate)
         VALUES (?, ?, ?)`,
		payload.ProductID,
		payload.Quantity,
		payload.ExpirationDate,
	)
	if err != nil {
		http.Error(w, "Failed to insert order", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"status":"ok"}`))
}

// GET /api/ordered-products
func GetAllOrderedProducts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type Order struct {
		ID             int     `json:"id"`
		ProductID      int     `json:"productID"`
		ProductName    string  `json:"productName"`
		Quantity       float64 `json:"quantity"`
		ExpirationDate *string `json:"expirationDate"`
		CreatedAt      string  `json:"created_at"`
	}

	rows, err := db.DB.Query(`
        SELECT
            op.id,
            op.productID,
            p.productName,
            op.quantity,
            op.expirationDate,
            op.created_at
        FROM orderedProducts op
        JOIN products p ON p.id = op.productID
        ORDER BY op.id DESC
    `)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var exp sql.NullTime
		var created time.Time

		if err := rows.Scan(
			&o.ID,
			&o.ProductID,
			&o.ProductName,
			&o.Quantity,
			&exp,
			&created,
		); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}

		if exp.Valid {
			str := exp.Time.Format("2006-01-02")
			o.ExpirationDate = &str
		}
		o.CreatedAt = created.Format(time.RFC3339)
		orders = append(orders, o)
	}

	json.NewEncoder(w).Encode(orders)
}

// DELETE /api/ordered-products/{id}
func DeleteOrderedProduct(w http.ResponseWriter, r *http.Request) {
	log.Printf("Order delete called")
	w.Header().Set("Content-Type", "application/json")
	idStr := strings.TrimPrefix(r.URL.Path, "/api/ordered-products/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	if _, err := db.DB.Exec(`DELETE FROM orderedProducts WHERE id = ?`, id); err != nil {
		http.Error(w, "Delete failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
