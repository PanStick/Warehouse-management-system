import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import TaskCard from "../components/TaskCard";

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
        setTasks((prev) => prev.filter((task) => task.taskId !== taskId));
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to complete the task.");
      });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Assigned Tasks</Typography>
      {tasks.length === 0 ? (
        <Typography>No tasks assigned.</Typography>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.taskId} task={task} onComplete={handleFinish} />
        ))
      )}
    </Box>
  );
}
