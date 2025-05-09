package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	_ "github.com/go-sql-driver/mysql"
)

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Response struct {
	Message string `json:"message"`
}

var db *sql.DB

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var hashedPassword string
	var verified bool
	err := db.QueryRow("SELECT password, verified FROM users WHERE email = ?", creds.Email).Scan(&hashedPassword, &verified)
	if err != nil {
		http.Error(w, "Invalid email", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(creds.Password)); err != nil {
		http.Error(w, "Incorrect password", http.StatusUnauthorized)
		return
	}

	if !verified {
		http.Error(w, "Email not verified", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Login successful"})
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	token := uuid.New().String()

	if err := sendVerificationEmail(creds.Email, token); err != nil {
		log.Fatalf("SMTP test failed: %v", err)
		http.Error(w, "Failed to send verification email", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)",
		creds.Email, hashedPassword, token)
	if err != nil {
		http.Error(w, "User already exists or DB error", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Registration successful. Check your email to verify your account."})
}

func verifyHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	res, err := db.Exec("UPDATE users SET verified = TRUE WHERE verification_token = ?", token)
	if err != nil {
		http.Error(w, "Verification failed", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Email verified successfully"})
}

func sendVerificationEmail(toEmail, token string) error {
	from := os.Getenv("EMAIL_FROM")         // e.g. your Gmail
	password := os.Getenv("EMAIL_PASSWORD") // App-specific password

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	auth := smtp.PlainAuth("", from, password, smtpHost)

	verificationLink := fmt.Sprintf("http://localhost:8080/api/verify?token=%s", token)
	subject := "Subject: Verify your account\n"
	body := fmt.Sprintf("Click the following link to verify your email:\n\n%s", verificationLink)
	msg := []byte(subject + "\n" + body)

	return smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, msg)
}

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	var err error

	// Use environment variables or defaults
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "password")
	dbHost := getEnv("DB_HOST", "localhost")
	dbName := getEnv("DB_NAME", "auth_demo")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s", dbUser, dbPass, dbHost, dbName)

	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("DB unreachable: %v", err)
	}

	http.HandleFunc("/api/login", withCORS(loginHandler))
	http.HandleFunc("/api/register", withCORS(registerHandler))
	http.HandleFunc("/api/verify", withCORS(verifyHandler))

	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
