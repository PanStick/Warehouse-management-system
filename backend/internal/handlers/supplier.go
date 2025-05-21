package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/db"
)

// GET /api/suppliers
func GetSuppliers(w http.ResponseWriter, r *http.Request) {
	type Supplier struct {
		ID           int    `json:"id"`
		SupplierName string `json:"supplierName"`
	}

	rows, err := db.DB.Query(`
        SELECT id, supplierName
        FROM suppliers
        ORDER BY supplierName
    `)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var suppliers []Supplier
	for rows.Next() {
		var s Supplier
		if err := rows.Scan(&s.ID, &s.SupplierName); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		suppliers = append(suppliers, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suppliers)
}
