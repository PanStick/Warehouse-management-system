import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import TaskCard from "../components/TaskCard";

export default function HomeWorker() {
  const [tasks, setTasks] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");

  // Fetch tasks and rapports on mount
  useEffect(() => {
    fetch("http://localhost:8080/api/worker/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, []);

  //task
  const handleFinish = (taskId) => {
    fetch(`http://localhost:8080/api/worker/tasks/${taskId}/complete`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to complete task");
        setTasks((prev) => prev.filter((task) => task.taskId !== taskId));
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to complete the task.");
      });
  };

  const openReport = () => setReportOpen(true);
  const closeReport = () => {
    setReportOpen(false);
    setReportContent("");
  };

  const submitReport = () => {
    fetch("http://localhost:8080/api/rapports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", content: reportContent }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to submit rapport");
        return res.json();
      })
      .then(() => {
        return fetch("http://localhost:8080/api/worker/rapports");
      })
      .then((res) => res.json())
      .catch((err) => {
        console.error(err);
        alert("Failed to create rapport.");
      })
      .finally(closeReport);
  };

  const hasTasks = Array.isArray(tasks) && tasks.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assigned Tasks
      </Typography>
      {!hasTasks ? (
        <Typography>No tasks assigned.</Typography>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.taskId} task={task} onComplete={handleFinish} />
        ))
      )}

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={openReport}
      >
        Create Rapport
      </Button>

      <Dialog open={reportOpen} onClose={closeReport} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Text Rapport</DialogTitle>
        <DialogContent>
          <TextField
            label="Content"
            multiline
            rows={4}
            fullWidth
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReport}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitReport}
            disabled={!reportContent.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
