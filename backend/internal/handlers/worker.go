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
	workerID := 1 //hardcoded for now

	type TaskItem struct {
		ProductName string  `json:"productName"`
		BatchID     int     `json:"batchId"`
		Quantity    float64 `json:"quantity"`
	}

	type Task struct {
		TaskID int        `json:"taskId"`
		Items  []TaskItem `json:"items"`
	}

	rows, err := db.DB.Query(`
		SELECT 
			t.id AS taskId,
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
		ORDER BY t.id`, workerID)
	if err != nil {
		http.Error(w, "DB error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasksMap := make(map[int][]TaskItem)

	for rows.Next() {
		var taskID, batchID int
		var productName string
		var quantity float64

		if err := rows.Scan(&taskID, &productName, &batchID, &quantity); err != nil {
			http.Error(w, "Row scan error", http.StatusInternalServerError)
			return
		}

		tasksMap[taskID] = append(tasksMap[taskID], TaskItem{
			ProductName: productName,
			BatchID:     batchID,
			Quantity:    quantity,
		})
	}

	var tasks []Task
	for id, items := range tasksMap {
		tasks = append(tasks, Task{
			TaskID: id,
			Items:  items,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

// POST /api/worker/tasks/{taskId}/complete
func CompleteWorkerTask(w http.ResponseWriter, r *http.Request) {
	taskIdStr := strings.TrimPrefix(r.URL.Path, "/api/worker/tasks/")
	taskIdStr = strings.TrimSuffix(taskIdStr, "/complete")

	_, err := db.DB.Exec(`UPDATE tasks SET status = 'completed' WHERE id = ?`, taskIdStr)
	if err != nil {
		http.Error(w, "Failed to update task status", http.StatusInternalServerError)
		return
	}

	log.Printf("Task %s marked as completed", taskIdStr)
	w.Write([]byte("OK"))
}
