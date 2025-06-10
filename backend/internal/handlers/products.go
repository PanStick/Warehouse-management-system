package handlers

import (
	"backend/internal/db"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// GET /api/products/with-stock
func GetProductsWithStock(w http.ResponseWriter, r *http.Request) {
	type ProductWithStock struct {
		ID       int     `json:"id"`
		Name     string  `json:"productName"`
		Image    string  `json:"image"`
		Quantity int     `json:"quantity"`
		Price    float64 `json:"price"`
	}

	rows, err := db.DB.Query(`
		SELECT p.id, p.productName, p.image, p.price, COALESCE(SUM(s.quantity), 0) as quantity
		FROM products p
		LEFT JOIN stock s ON p.id = s.productID
		GROUP BY p.id, p.productName, p.image, p.price
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []ProductWithStock
	for rows.Next() {
		var p ProductWithStock
		if err := rows.Scan(&p.ID, &p.Name, &p.Image, &p.Price, &p.Quantity); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GET /api/products?supplierId={id}
func GetProductsBySupplier(w http.ResponseWriter, r *http.Request) {
	supplierIDStr := r.URL.Query().Get("supplierId")
	if supplierIDStr == "" {
		http.Error(w, "Missing supplierId parameter", http.StatusBadRequest)
		return
	}
	supplierID, err := strconv.Atoi(supplierIDStr)
	if err != nil {
		http.Error(w, "Invalid supplierId", http.StatusBadRequest)
		return
	}

	type Product struct {
		ID          int     `json:"id"`
		ProductName string  `json:"productName"`
		UnitType    string  `json:"unitType"`
		Image       string  `json:"image"`
		Price       float64 `json:"price"`
	}

	rows, err := db.DB.Query(`
        SELECT id, productName, unitType, image, price
        FROM products
        WHERE supplierID = ?
        ORDER BY productName
    `, supplierID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.ProductName, &p.UnitType, &p.Image, &p.Price); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		products = append(products, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GET /api/products/{id}/batches
func GetBatchesForProduct(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	idStr = strings.TrimSuffix(idStr, "/batches")
	id, _ := strconv.Atoi(idStr)

	rows, err := db.DB.Query("SELECT batchID, quantity, expirationDate FROM stock WHERE productID = ? ORDER BY (expirationDate IS NULL), expirationDate", id)
	if err != nil {
		http.Error(w, "Failed to fetch batches", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var batchID int
		var qty float64
		var exp sql.NullTime
		_ = rows.Scan(&batchID, &qty, &exp)
		item := map[string]interface{}{
			"batchID":  batchID,
			"quantity": qty,
		}
		if exp.Valid {
			item["expirationDate"] = exp.Time.Format("2006-01-02")
		}
		result = append(result, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GET /api/products/${product.id}/image
func GetProductImageHandler(w http.ResponseWriter, r *http.Request) {

	// parts := strings.Split(r.URL.Path, "/")
	// if len(parts) < 4 {
	// 	http.Error(w, "Invalid URL", http.StatusBadRequest)
	// 	return
	// }
	// productID := parts[3]
	// /api/products/5/image -> ["", "api", "products", "5", "image"]

	idStr := strings.TrimPrefix(r.URL.Path, "/api/products/")
	idStr = strings.TrimSuffix(idStr, "/image")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var imagePath sql.NullString
	err = db.DB.QueryRow("SELECT image FROM products WHERE id = ?", id).Scan(&imagePath)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var fullPath string
	p := imagePath.String
	if strings.HasPrefix(p, "assets"+string(os.PathSeparator)) || strings.HasPrefix(p, "assets/") {
		fullPath = p
	} else {
		fullPath = filepath.Join("assets", p)
	}
	file, err := os.Open(fullPath)
	if err != nil {
		http.Error(w, "Image not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	buffer := make([]byte, 512)
	_, _ = file.Read(buffer)
	contentType := http.DetectContentType(buffer)
	file.Seek(0, io.SeekStart)

	w.Header().Set("Content-Type", contentType)
	io.Copy(w, file)
}

// POST api/products
func CreateProduct(w http.ResponseWriter, r *http.Request) {

	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "Could not parse form", http.StatusBadRequest)
		return
	}

	supplierID, _ := strconv.Atoi(r.FormValue("supplierId"))
	name := r.FormValue("productName")
	unitType := r.FormValue("unitType") //default: unit
	price, _ := strconv.ParseFloat(r.FormValue("price"), 64)

	imagePath := ""
	file, header, err := r.FormFile("image")

	if err == nil {
		defer file.Close()
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".jpg", ".jpeg", ".png", ".gif":
		default:
			http.Error(w, "Unsupported image type", http.StatusBadRequest)
			return
		}

		dir := "./assets/images/products"
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "Could not create image dir", http.StatusInternalServerError)
			return
		}
		filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
		fullPath := filepath.Join(dir, filename)

		out, err := os.Create(fullPath)
		if err != nil {
			http.Error(w, "Could not save image", http.StatusInternalServerError)
			return
		}
		defer out.Close()
		io.Copy(out, file)

		imagePath = "images/products/" + filename
	}

	_, err = db.DB.Exec(
		`INSERT INTO products 
       (productName, unitType, supplierID, shortExpirationDate, image, price)
     VALUES (?, ?, ?, NULL, ?, ?)`,
		name, unitType, supplierID, imagePath, price,
	)
	if err != nil {
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
