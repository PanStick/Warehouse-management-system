package handlers

import (
	"backend/internal/db"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// POST /api/rapports
func CreateRapport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Type       string  `json:"type"`
		Content    *string `json:"content"`
		DeliveryID *int    `json:"deliveryId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if req.Type != "text" && req.Type != "delivery" {
		http.Error(w, "Invalid type", http.StatusBadRequest)
		return
	}
	if req.Type == "text" && (req.Content == nil || *req.Content == "") {
		http.Error(w, "Content required", http.StatusBadRequest)
		return
	}
	if req.Type == "delivery" && req.DeliveryID == nil {
		http.Error(w, "Delivery ID required", http.StatusBadRequest)
		return
	}

	// hardcoded for now
	workerID := 1

	var contentVal string
	if req.Type == "delivery" {
		contentVal = strconv.Itoa(*req.DeliveryID)
	} else {
		contentVal = *req.Content
	}

	if _, err := db.DB.Exec(
		`INSERT INTO rapports (workerID, type, content) VALUES (?, ?, ?)`,
		workerID, req.Type, contentVal,
	); err != nil {
		http.Error(w, "Insert failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// GET /api/worker/rapports
func GetWorkerRapports(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	workerID := 1 // hard-coded for now

	rows, err := db.DB.Query(`
      SELECT id, type, content, status, response, created_at
      FROM rapports
      WHERE workerID = ?
      ORDER BY created_at DESC
    `, workerID)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Report struct {
		ID        int     `json:"id"`
		Type      string  `json:"type"`
		Content   *string `json:"content"`
		Status    string  `json:"status"`
		Response  *string `json:"response"`
		CreatedAt string  `json:"created_at"`
	}

	var reports []Report
	rowNum := 0
	for rows.Next() {
		rowNum++

		var rec Report
		var contentNS, responseNS sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&rec.ID,     // 1) id
			&rec.Type,   // 2) type
			&contentNS,  // 3) content
			&rec.Status, // 4) status
			&responseNS, // 5) response
			&createdAt,  // 6) created_at
		)
		if err != nil {
			log.Printf("Scan error on row %d: %v", rowNum, err)
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}

		if contentNS.Valid {
			rec.Content = &contentNS.String
		}
		if responseNS.Valid {
			rec.Response = &responseNS.String
		}
		rec.CreatedAt = createdAt.Format(time.RFC3339)

		reports = append(reports, rec)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Rows iteration error: %v", err)
		http.Error(w, "Iteration error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(reports)
}

// GET /api/rapports
func GetAllRapports(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.DB.Query(`
	  SELECT r.id, r.workerID, u.email, r.type,
			 r.content, r.status, r.response, r.created_at
	  FROM rapports r
	  JOIN users u ON r.workerID = u.id
	  ORDER BY r.created_at DESC
	`)
	if err != nil {
		http.Error(w, "DB err", 500)
		return
	}
	defer rows.Close()

	type R struct {
		ID        int     `json:"id"`
		WorkerID  int     `json:"workerId"`
		Email     string  `json:"email"`
		Type      string  `json:"type"`
		Content   *string `json:"content"`
		Status    string  `json:"status"`
		Response  *string `json:"response"`
		CreatedAt string  `json:"created_at"`
	}
	var out []R
	for rows.Next() {
		var (
			r          R
			contentNS  sql.NullString
			responseNS sql.NullString
			createdAt  time.Time
		)

		if err := rows.Scan(
			&r.ID,
			&r.WorkerID,
			&r.Email,
			&r.Type,
			&contentNS,
			&r.Status,
			&responseNS,
			&createdAt,
		); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}

		if contentNS.Valid {
			r.Content = &contentNS.String
		}
		if responseNS.Valid {
			r.Response = &responseNS.String
		}
		r.CreatedAt = createdAt.Format(time.RFC3339)
		out = append(out, r)
	}
	json.NewEncoder(w).Encode(out)
}

// POST /api/rapports/{id}/status
func UpdateRapportStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	id := strings.TrimPrefix(r.URL.Path, "/api/rapports/")
	id = strings.TrimSuffix(id, "/status")

	// decode & validate
	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	if payload.Status != "accepted" && payload.Status != "denied" {
		http.Error(w, "Invalid status value", http.StatusBadRequest)
		return
	}

	_, err := db.DB.Exec(
		`UPDATE rapports 
           SET status = ?, updated_at = NOW() 
         WHERE id = ?`,
		payload.Status, id,
	)
	if err != nil {
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// POST /api/rapports/{id}/respond
func RespondRapport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// extract the {id} from the path
	id := strings.TrimPrefix(r.URL.Path, "/api/rapports/")
	id = strings.TrimSuffix(id, "/respond")

	// decode & validate
	var payload struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(payload.Response) == "" {
		http.Error(w, "Response cannot be empty", http.StatusBadRequest)
		return
	}

	// update both the response text and bump status to "responded"
	_, err := db.DB.Exec(
		`UPDATE rapports 
           SET response   = ?,
               status     = 'responded',
               updated_at = NOW()
         WHERE id = ?`,
		payload.Response, id,
	)
	if err != nil {
		http.Error(w, "Failed to save response", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
