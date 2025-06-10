package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"log"
	"net/http"
)

// POST /api/tasks
func CreateTask(w http.ResponseWriter, r *http.Request) {
	log.Printf("Create task called")
	w.Header().Set("Content-Type", "application/json")

	// Decode a payload that might have either requestId or orderId
	var req struct {
		Type      string `json:"type"`                // "unload", "prepare", or "dispose"
		RequestID *int   `json:"requestId,omitempty"` // for prepare/dispose
		OrderID   *int   `json:"orderId,omitempty"`   // for unload
		WorkerID  int    `json:"workerId"`            // who gets the task
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.Type != "unload" && req.Type != "prepare" && req.Type != "dispose" {
		http.Error(w, "Invalid type", http.StatusBadRequest)
		return
	}
	if req.WorkerID == 0 {
		http.Error(w, "Missing workerId", http.StatusBadRequest)
		return
	}

	// Build the INSERT depending on the task type
	var (
		sqlStmt string
		arg     interface{}
	)
	switch req.Type {
	case "unload":
		if req.OrderID == nil {
			http.Error(w, "Missing orderId for unload task", http.StatusBadRequest)
			return
		}
		sqlStmt = `INSERT INTO tasks (orderID, workerID, type) VALUES (?, ?, ?)`
		arg = *req.OrderID
	case "prepare", "dispose":
		if req.RequestID == nil {
			http.Error(w, "Missing requestId for "+req.Type+" task", http.StatusBadRequest)
			return
		}
		sqlStmt = `INSERT INTO tasks (requestID, workerID, type) VALUES (?, ?, ?)`
		arg = *req.RequestID
	}

	// Execute
	if _, err := db.DB.Exec(sqlStmt, arg, req.WorkerID, req.Type); err != nil {
		log.Printf("CreateTask insert error: %v", err)
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
