package handlers

import (
	"backend/internal/db"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// GET /api/worker/tasks
func GetWorkerTasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	q := r.URL.Query().Get("workerId")
	workerID, err := strconv.Atoi(q)
	if err != nil || workerID <= 0 {
		http.Error(w, "Invalid or missing workerId", http.StatusBadRequest)
		return
	}

	type TaskItem struct {
		ProductName string  `json:"productName"`
		BatchID     int     `json:"batchId"`
		Quantity    float64 `json:"quantity"`
	}

	type Task struct {
		TaskID int        `json:"taskId"`
		Type   string     `json:"type"`
		Items  []TaskItem `json:"items"`
	}

	tasksMap := make(map[int]*Task)

	unloadRows, err := db.DB.Query(`
        SELECT t.id, t.type, p.productName, op.quantity
        FROM tasks t
        JOIN orderedProducts op ON op.id = t.orderID
        JOIN products p ON p.id = op.productID
        WHERE t.workerID = ? AND t.status = 'pending' AND t.type = 'unload'
    `, workerID)
	if err != nil {
		http.Error(w, "DB error (unload)", http.StatusInternalServerError)
		return
	}
	defer unloadRows.Close()

	for unloadRows.Next() {
		var taskID int
		var taskType, productName string
		var qty float64
		if err := unloadRows.Scan(&taskID, &taskType, &productName, &qty); err != nil {
			http.Error(w, "Scan error (unload)", http.StatusInternalServerError)
			return
		}
		tasksMap[taskID] = &Task{
			TaskID: taskID,
			Type:   taskType,
			Items: []TaskItem{
				{ProductName: productName, BatchID: 0, Quantity: qty},
			},
		}
	}

	prepareRows, err := db.DB.Query(`
        SELECT t.id, t.type, p.productName, ab.batchID, ab.quantity
        FROM tasks t
        JOIN purchase_requests pr ON pr.id = t.requestID
        JOIN purchase_items pi ON pi.requestID = pr.id
        JOIN assigned_batches ab ON ab.itemID = pi.id
        JOIN stock s ON s.batchID = ab.batchID
        JOIN products p ON p.id = s.productID
        WHERE t.workerID = ? AND t.status = 'pending' AND t.type = 'prepare' AND ab.quantity > 0
        ORDER BY t.id
    `, workerID)
	if err != nil {
		http.Error(w, "DB error (other)", http.StatusInternalServerError)
		return
	}
	defer prepareRows.Close()

	for prepareRows.Next() {
		var taskID, batchID int
		var taskType, productName string
		var qty float64

		if err := prepareRows.Scan(&taskID, &taskType, &productName, &batchID, &qty); err != nil {
			http.Error(w, "Scan error (other)", http.StatusInternalServerError)
			return
		}
		acc, exists := tasksMap[taskID]
		if !exists {
			acc = &Task{TaskID: taskID, Type: taskType}
			tasksMap[taskID] = acc
		}
		acc.Items = append(acc.Items, TaskItem{
			ProductName: productName,
			BatchID:     batchID,
			Quantity:    qty,
		})
	}

	var out []Task
	for _, t := range tasksMap {
		out = append(out, *t)
	}

	json.NewEncoder(w).Encode(out)
}

// POST /api/worker/tasks/{taskId}/complete
func CompleteWorkerTask(w http.ResponseWriter, r *http.Request) {
	taskIdStr := strings.TrimPrefix(r.URL.Path, "/api/worker/tasks/")
	taskIdStr = strings.TrimSuffix(taskIdStr, "/complete")

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		`UPDATE tasks SET status = 'completed' WHERE id = ?`,
		taskIdStr,
	); err != nil {
		http.Error(w, "Failed to update task status", http.StatusInternalServerError)
		return
	}

	var taskType string
	var requestID, orderID sql.NullInt64
	err = tx.QueryRow(
		`SELECT requestID, orderID, type FROM tasks WHERE id = ?`,
		taskIdStr,
	).Scan(&requestID, &orderID, &taskType)
	if err != nil {
		http.Error(w, "Failed to load task info", http.StatusInternalServerError)
		return
	}

	switch taskType {
	case "unload":
		var productID int
		var qty float64
		var expRaw sql.NullTime
		if err := tx.QueryRow(
			`SELECT productID, quantity, expirationDate
               FROM orderedProducts
              WHERE id = ?`,
			orderID.Int64,
		).Scan(&productID, &qty, &expRaw); err != nil {
			http.Error(w, "Failed to load delivery info", http.StatusInternalServerError)
			return
		}

		var expVal interface{}
		if expRaw.Valid {
			expVal = expRaw.Time
		} else {
			expVal = nil
		}
		if _, err := tx.Exec(
			`INSERT INTO stock (productID, quantity, expirationDate)
             VALUES (?, ?, ?)`,
			productID, qty, expVal,
		); err != nil {
			http.Error(w, "Failed to create stock batch", http.StatusInternalServerError)
			return
		}

		if _, err := tx.Exec(
			`DELETE FROM orderedProducts WHERE id = ?`,
			orderID.Int64,
		); err != nil {
			http.Error(w, "Failed to remove delivery", http.StatusInternalServerError)
			return
		}

	default:
		if !requestID.Valid {
			http.Error(w, "No requestID for prepare/dispose task", http.StatusBadRequest)
			return
		}
		if _, err := tx.Exec(
			`UPDATE purchase_requests SET status = 'shipped' WHERE id = ?`,
			requestID.Int64,
		); err != nil {
			http.Error(w, "Failed to update request status", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	log.Printf("Task %s completed (type=%s)", taskIdStr, taskType)
	w.Write([]byte("OK"))
}
