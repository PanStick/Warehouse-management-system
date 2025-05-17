package handlers

import (
	"database/sql"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"backend/internal/db"
)

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

	var imagePath string
	err = db.DB.QueryRow("SELECT image FROM products WHERE id = ?", id).Scan(&imagePath)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	fullPath := filepath.Join("assets", imagePath)
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
