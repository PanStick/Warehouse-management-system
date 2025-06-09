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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Toolbar,
} from "@mui/material";
import TaskCard from "../components/TaskCard";

export default function HomeWorker() {
  const [tasks, setTasks] = useState([]);

  // dialog state
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryId, setDeliveryId] = useState("");

  // initial data load
  useEffect(() => {
    fetch("/api/worker/tasks")
      .then((res) => {
        if (!res.ok) {
          console.error("Fetch tasks failed:", res.status, res.statusText);
          return [];
        }
        return res.json();
      })
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Unexpected error:", err);
        setTasks([]);
      });
  }, []);

  // when dialog opens and type=delivery, load deliveries
  useEffect(() => {
    if (open && type === "delivery") {
      fetch("/api/ordered-products")
        .then((res) => {
          if (!res.ok) {
            console.error("Backend error:", res.status, res.statusText);
            return [];
          }
          return res.json();
        })
        .then((data) => setDeliveries(Array.isArray(data) ? data : []))
        .catch((err) => {
          console.error("Fetch error:", err);
          setDeliveries([]);
        });
    }
  }, [open, type]);

  const handleSubmit = () => {
    const payload =
      type === "text"
        ? { type, content: textContent }
        : { type, deliveryId: parseInt(deliveryId, 10) };

    fetch("/api/rapports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .catch(() => alert("Failed"))
      .finally(() => {
        setOpen(false);
        setTextContent("");
        setDeliveryId("");
      });
  };

  return (
    <>
      <Toolbar />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setOpen(true)}
          >
            Create Rapport
          </Button>
        </Box>
        <Typography variant="h4" gutterBottom>
          Assigned Tasks
        </Typography>
        {tasks.length === 0 ? (
          <Typography>No tasks assigned.</Typography>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.taskId}
              task={t}
              onComplete={(id) => {
                fetch(`/api/worker/tasks/${id}/complete`, { method: "POST" })
                  .then(() =>
                    setTasks((ts) => ts.filter((x) => x.taskId !== id))
                  )
                  .catch(() => alert("Error"));
              }}
            />
          ))
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>Create Rapport</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="delivery">Delivery</MenuItem>
              </Select>
            </FormControl>

            {type === "text" ? (
              <TextField
                label="Content"
                multiline
                rows={4}
                fullWidth
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                sx={{ mt: 2 }}
              />
            ) : deliveries.length === 0 ? (
              <Typography sx={{ mt: 2 }} color="text.secondary">
                No deliveries scheduled
              </Typography>
            ) : (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Delivery</InputLabel>
                <Select
                  value={deliveryId}
                  label="Delivery"
                  onChange={(e) => setDeliveryId(e.target.value)}
                >
                  {deliveries.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {`${d.productName} x${d.quantity} ${
                        d.expirationDate ? `(exp ${d.expirationDate})` : ""
                      }`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={type === "text" ? !textContent.trim() : !deliveryId}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
