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

// POST api/suppliers
func CreateSupplier(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		SupplierName string `json:"supplierName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.SupplierName == "" {
		http.Error(w, "Supplier name required", http.StatusBadRequest)
		return
	}

	result, err := db.DB.Exec(
		`INSERT INTO suppliers (supplierName) VALUES (?)`,
		req.SupplierName,
	)
	if err != nil {
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}
	id, _ := result.LastInsertId()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":           id,
		"supplierName": req.SupplierName,
	})
}
