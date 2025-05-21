package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/db"
)

// CreateOrderedProduct handles POST /api/ordered-products
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
	type Order struct {
		ID             int     `json:"id"`
		ProductID      int     `json:"productID"`
		Quantity       float64 `json:"quantity"`
		ExpirationDate *string `json:"expirationDate"`
		CreatedAt      string  `json:"created_at"`
	}

	rows, err := db.DB.Query(`
        SELECT id, productID, quantity, expirationDate, created_at
        FROM orderedProducts
        ORDER BY id DESC
    `)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		var exp sql.NullString
		var created time.Time

		if err := rows.Scan(&o.ID, &o.ProductID, &o.Quantity, &exp, &created); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}

		// Handle optional expirationDate
		if exp.Valid {
			o.ExpirationDate = &exp.String
		}
		o.CreatedAt = created.Format(time.RFC3339)

		orders = append(orders, o)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}
