package main

import (
	"log"
	"net/http"
	"time"

	"backend/internal/db"
	"backend/internal/handlers"

	"backend/internal/middleware"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	db.InitDB()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/login", middleware.WithCORS(handlers.LoginHandler))
	mux.HandleFunc("/api/register", middleware.WithCORS(handlers.RegisterHandler))
	mux.HandleFunc("/api/products/with-stock", middleware.WithCORS(handlers.GetProductsWithStock))
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets"))))

	// mux.HandleFunc("/api/verify", middleware.WithCORS(handlers.VerifyHandler))

	fs := http.FileServer(http.Dir("./frontend/build"))
	mux.Handle("/static/", fs)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, "./frontend/build/index.html")
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Println("Server running on http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}
