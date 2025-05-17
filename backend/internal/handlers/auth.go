package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"backend/internal/db"
	"backend/internal/mail"
	"backend/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds models.Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var hash string
	var verified bool
	err := db.DB.QueryRow("SELECT password, verified FROM users WHERE email = ?", creds.Email).Scan(&hash, &verified)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid email", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)); err != nil {
		http.Error(w, "Incorrect password", http.StatusUnauthorized)
		return
	}

	if !verified {
		http.Error(w, "Email not verified", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(models.Response{Message: "Login successful"})
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds models.Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Hashing failed", http.StatusInternalServerError)
		return
	}

	token := uuid.New().String()
	if err := mail.SendVerificationEmail(creds.Email, token); err != nil {
		log.Printf("Email failed: %v", err)
		http.Error(w, "Failed to send verification", http.StatusInternalServerError)
		return
	}

	_, err = db.DB.Exec("INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)",
		creds.Email, hash, token)
	if err != nil {
		http.Error(w, "User exists or DB error", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(models.Response{Message: "Check your email to verify your account."})
}
