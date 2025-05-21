package handlers

import (
	"backend/internal/db"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// GET /api/worker/tasks
func GetWorkerTasks(w http.ResponseWriter, r *http.Request) {
	workerID := 1 // hardcoded for now

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

	rows, err := db.DB.Query(`
        SELECT 
            t.id AS taskId,
            t.type AS taskType,
            p.productName,
            ab.batchID,
            ab.quantity
        FROM tasks t
        JOIN purchase_requests pr ON pr.id = t.requestID
        JOIN purchase_items pi ON pi.requestID = pr.id
        JOIN assigned_batches ab ON ab.itemID = pi.id
        JOIN stock s ON s.batchID = ab.batchID
        JOIN products p ON p.id = s.productID
        WHERE 
            t.workerID = ?
            AND t.status = 'pending'
            AND ab.quantity > 0
        ORDER BY t.id
    `, workerID)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Map of taskID to its type + items
	type taskAccumulator struct {
		taskType string
		items    []TaskItem
	}
	accum := make(map[int]*taskAccumulator)

	for rows.Next() {
		var taskID, batchID int
		var taskType, productName string
		var quantity float64

		if err := rows.Scan(&taskID, &taskType, &productName, &batchID, &quantity); err != nil {
			http.Error(w, "Row scan error", http.StatusInternalServerError)
			return
		}

		if _, exists := accum[taskID]; !exists {
			accum[taskID] = &taskAccumulator{taskType: taskType}
		}
		accum[taskID].items = append(accum[taskID].items, TaskItem{
			ProductName: productName,
			BatchID:     batchID,
			Quantity:    quantity,
		})
	}

	var tasks []Task
	for id, acc := range accum {
		tasks = append(tasks, Task{
			TaskID: id,
			Type:   acc.taskType,
			Items:  acc.items,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
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
		`UPDATE tasks SET status = 'completed' WHERE id = ?`, taskIdStr,
	); err != nil {
		http.Error(w, "Failed to update task status", http.StatusInternalServerError)
		return
	}

	var requestID int
	err = tx.QueryRow(
		`SELECT requestID FROM tasks WHERE id = ?`, taskIdStr,
	).Scan(&requestID)
	if err != nil {
		http.Error(w, "Failed to find associated request", http.StatusInternalServerError)
		return
	}

	if _, err := tx.Exec(
		`UPDATE purchase_requests SET status = 'shipped' WHERE id = ?`, requestID,
	); err != nil {
		http.Error(w, "Failed to update request status", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	log.Printf("Task %s marked as completed and request %d set to shipped", taskIdStr, requestID)
	w.Write([]byte("OK"))
}
