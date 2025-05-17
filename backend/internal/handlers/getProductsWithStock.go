package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"net/http"
)

func GetProductsWithStock(w http.ResponseWriter, r *http.Request) {
	type ProductWithStock struct {
		ID       int    `json:"id"`
		Name     string `json:"productName"`
		Image    string `json:"image"`
		Quantity int    `json:"quantity"`
	}

	rows, err := db.DB.Query(`
		SELECT 
			p.id, p.productName, p.image, 
			COALESCE(SUM(s.quantity), 0) as quantity
		FROM products p
		LEFT JOIN stock s ON p.id = s.productID
		GROUP BY p.id, p.productName, p.image
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []ProductWithStock
	for rows.Next() {
		var p ProductWithStock
		if err := rows.Scan(&p.ID, &p.Name, &p.Image, &p.Quantity); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}
