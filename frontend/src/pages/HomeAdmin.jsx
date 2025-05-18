import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, List, ListItem, ListItemText
} from "@mui/material";

export default function HomeAdmin() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/purchase-requests")
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.error("Failed to fetch requests:", err));
  }, []);

  const handleAction = (id, action) => {
    fetch(`http://localhost:8080/api/purchase-requests/${id}/${action}`, {
      method: "POST"
    })
      .then(() => {
        console.log(`Request ${id} ${action}ed`);
        setRequests(prev =>
          prev.map(r => (r.id === id ? { ...r, status: action } : r))
        );
      })
      .catch(err => console.error("Action failed:", err));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      {requests.map(req => (
        <Paper key={req.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Request #{req.id} - User: {req.userID} - Status: {req.status}</Typography>
          <List dense>
            {req.items.map(item => (
              <ListItem key={item.productID}>
                <ListItemText primary={`${item.productName} x${item.quantity}`} />
              </ListItem>
            ))}
          </List>
          {req.status === "pending" && (
            <Box sx={{ mt: 1 }}>
              <Button onClick={() => handleAction(req.id, "accept")} variant="contained" color="success" sx={{ mr: 1 }}>
                Accept
              </Button>
              <Button onClick={() => handleAction(req.id, "deny")} variant="contained" color="error">
                Deny
              </Button>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
}
