package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type userPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// POST api/users
func CreateUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var p userPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if p.Email == "" || p.Password == "" || p.Role == "" {
		http.Error(w, "Missing fields", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	res, err := db.DB.Exec(
		`INSERT INTO users (email, password, verified, role) VALUES (?, ?, TRUE, ?)`,
		p.Email, string(hash), p.Role,
	)
	if err != nil {
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}
	id, _ := res.LastInsertId()

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":    id,
		"email": p.Email,
		"role":  p.Role,
	})
}

// GET api/users
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	rows, err := db.DB.Query(`SELECT id, email, role, verified FROM users`)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type u struct {
		ID       int    `json:"id"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		Verified bool   `json:"verified"`
	}
	var us []u
	for rows.Next() {
		var x u
		if err := rows.Scan(&x.ID, &x.Email, &x.Role, &x.Verified); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		us = append(us, x)
	}
	json.NewEncoder(w).Encode(us)
}
