import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

export default function HomeWorker() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/worker/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Failed to fetch tasks:", err));
  }, []);

  const handleFinish = (taskId) => {
    fetch(`http://localhost:8080/api/worker/tasks/${taskId}/complete`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to complete task");
        // Remove the completed task from the list
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.taskId !== taskId)
        );
        console.log(`Task ${taskId} marked as completed.`);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to complete the task.");
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assigned Tasks
      </Typography>
      {tasks === null || tasks.length === 0 ? (
        <Typography>No tasks assigned.</Typography>
      ) : (
        tasks.map((task) => (
          <Paper key={task.taskId} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Task ID: {task.taskId}</Typography>
            <List dense>
              {task.items.map((item, idx) => (
                <ListItem key={`${task.taskId}-${item.batchId}`}>
                  <ListItemText
                    primary={`Product: ${item.productName}`}
                    secondary={`Batch ID: ${item.batchId} | Quantity: ${item.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleFinish(task.taskId)}
            >
              Finish Task
            </Button>
          </Paper>
        ))
      )}
    </Box>
  );
}
