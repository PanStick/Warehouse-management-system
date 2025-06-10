package main

import (
	"log"
	"net/http"
	"strings"
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
	mux.HandleFunc("/api/purchase", middleware.WithCORS(handlers.CreatePurchaseRequest))
	mux.HandleFunc("/api/purchase-requests", middleware.WithCORS(handlers.GetAllPurchaseRequests))
	mux.HandleFunc("/api/purchase-requests/user/", middleware.WithCORS(handlers.GetPurchaseRequestsByUser))
	mux.HandleFunc("/api/worker/rapports", middleware.WithCORS(handlers.GetWorkerRapports))

	mux.HandleFunc("/api/products/", middleware.WithCORS(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/image") {
			handlers.GetProductImageHandler(w, r)
		}
		handlers.GetBatchesForProduct(w, r)
	}))

	mux.HandleFunc("/api/products", middleware.WithCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetProductsBySupplier(w, r)
		case http.MethodPost:
			handlers.CreateProduct(w, r)
		default:
			http.NotFound(w, r)
		}
	}))
	mux.Handle("/api/rapports", middleware.WithCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handlers.GetAllRapports(w, r)
		case "POST":
			handlers.CreateRapport(w, r)
		default:
			http.NotFound(w, r)
		}
	})))

	mux.Handle("/api/rapports/", middleware.WithCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		switch {
		case strings.HasSuffix(r.URL.Path, "/status") && r.Method == "POST":
			handlers.UpdateRapportStatus(w, r)
		case strings.HasSuffix(r.URL.Path, "/respond") && r.Method == "POST":
			handlers.RespondRapport(w, r)
		default:
			http.NotFound(w, r)
		}
	})))

	mux.HandleFunc("/api/purchase-requests/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/accept") || strings.HasSuffix(r.URL.Path, "/deny") {
			middleware.WithCORS(handlers.HandleRequestStatus)(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/assign-batches") {
			middleware.WithCORS(handlers.AssignBatches)(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/details") {
			middleware.WithCORS(handlers.GetPurchaseRequestDetails)(w, r)
			return
		}

		if r.Method == "GET" {
			middleware.WithCORS(handlers.GetPurchaseRequestByID)(w, r)
			return
		}

		http.NotFound(w, r)
	})

	mux.HandleFunc("/api/worker/tasks", middleware.WithCORS(handlers.GetWorkerTasks))
	mux.HandleFunc("/api/worker/tasks/", middleware.WithCORS(handlers.CompleteWorkerTask))

	mux.HandleFunc("/api/ordered-products/", middleware.WithCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handlers.DeleteOrderedProduct(w, r)
			return
		}
		http.NotFound(w, r)
	})))

	mux.HandleFunc("/api/ordered-products", middleware.WithCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetAllOrderedProducts(w, r)
		case http.MethodPost:
			handlers.CreateOrderedProduct(w, r)
		default:
			http.NotFound(w, r)
		}
	}))

	mux.HandleFunc("/api/suppliers", middleware.WithCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetSuppliers(w, r)
		case http.MethodPost:
			handlers.CreateSupplier(w, r)
		default:
			http.NotFound(w, r)
		}
	}))

	// mux.HandleFunc("/api/verify", middleware.WithCORS(handlers.VerifyHandler))

	mux.HandleFunc("/api/tasks", middleware.WithCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.CreateTask(w, r)
			return
		}
		http.NotFound(w, r)
	})))

	mux.HandleFunc("/api/users", middleware.WithCORS(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetAllUsers(w, r) // optional
		case http.MethodPost:
			handlers.CreateUser(w, r)
		default:
			http.NotFound(w, r)
		}
	}))

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
