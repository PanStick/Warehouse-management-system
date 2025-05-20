import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Collapse,
  TextField,
} from "@mui/material";

export default function HomeAdmin() {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [assignedQuantities, setAssignedQuantities] = useState({});

  useEffect(() => {
    fetch("http://localhost:8080/api/purchase-requests")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Failed to fetch requests:", err));
  }, []);

  const fetchDetails = async (id) => {
    const res = await fetch(
      `http://localhost:8080/api/purchase-requests/${id}/details`
    );
    const data = await res.json();

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, details: data.items } : r))
    );

    preloadAssignedQuantities(data.items);
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      fetchDetails(id);
      setExpandedId(id);
    }
  };

  const preloadAssignedQuantities = async (id, items) => {
    const newAssigned = {};
  
    items.forEach((item) => {
      let remainingQty = item.quantity;
      newAssigned[item.itemID] = {};
  
      item.batches.forEach((batch) => {
        if (remainingQty <= 0) {
          newAssigned[item.itemID][batch.batchID] = 0;
          return;
        }
        const assignQty = Math.min(remainingQty, batch.quantity);
        newAssigned[item.itemID][batch.batchID] = assignQty;
        remainingQty -= assignQty;
      });
    });
  
    return new Promise((resolve) => {
      setAssignedQuantities(newAssigned);
      resolve();
    });
  };

  const handleAction = async (id, action) => {
    const request = requests.find((r) => r.id === id);
  
    let currentAssigned = assignedQuantities;
  
    if (
      action === "accept" &&
      (!request.details || Object.keys(assignedQuantities).length === 0)
    ) {
      try {
        const res = await fetch(
          `http://localhost:8080/api/purchase-requests/${id}/details`
        );
        const data = await res.json();
  
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, details: data.items } : r))
        );
  
        //get assignments locally to be able to accept without assigning batches
        currentAssigned = {};
        data.items.forEach((item) => {
          let remainingQty = item.quantity;
          currentAssigned[item.itemID] = {};
  
          item.batches.forEach((batch) => {
            if (remainingQty <= 0) {
              currentAssigned[item.itemID][batch.batchID] = 0;
              return;
            }
  
            const assignQty = Math.min(remainingQty, batch.quantity);
            currentAssigned[item.itemID][batch.batchID] = assignQty;
            remainingQty -= assignQty;
          });
        });
      } catch (err) {
        console.error("Failed to preload details or assignments:", err);
        alert("Could not load necessary data for acceptance.");
        return;
      }
    }
  
    if (action === "accept") {
      const flat = [];
  
      for (let itemID in currentAssigned) {
        for (let batchID in currentAssigned[itemID]) {
          const quantity = currentAssigned[itemID][batchID];
          flat.push({
            itemID: parseInt(itemID),
            batchID: parseInt(batchID),
            quantity,
          });
        }
      }
  
      try {
        const res = await fetch(
          `http://localhost:8080/api/purchase-requests/${id}/assign-batches`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batches: flat }),
          }
        );
        if (!res.ok) throw new Error("Failed to assign batches");
  
        const acceptRes = await fetch(
          `http://localhost:8080/api/purchase-requests/${id}/accept`,
          { method: "POST" }
        );
        if (!acceptRes.ok) throw new Error("Failed to accept request");
      } catch (err) {
        console.error(err);
        alert("Assignment or acceptance failed");
        return;
      }
    } else if (action === "deny") {
      try {
        const res = await fetch(
          `http://localhost:8080/api/purchase-requests/${id}/deny`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error("Failed to deny request");
      } catch (err) {
        console.error("Deny failed:", err);
        return;
      }
    }
  
    //Refresh after action
    try {
      const res = await fetch(`http://localhost:8080/api/purchase-requests/${id}`);
      const updated = await res.json();
  
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
    } catch (err) {
      console.error("Failed to refresh updated request:", err);
    }
  };
  
  
  

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      {(requests || [])
        .sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return b.id - a.id; // sort descending by ID within same status
        })
        .map((req) => (
          <Paper key={req.id} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">
              Request #{req.id} - User: {req.userID} - Status: {req.status}
            </Typography>
            <List dense>
              {req.items.map((item) => (
                <ListItem key={item.productID}>
                  <ListItemText
                    primary={`${item.productName} x${item.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
            {req.status === "pending" && (
              <Button onClick={() => toggleExpand(req.id)} sx={{ mt: 1 }}>
                {expandedId === req.id ? "Hide Batches" : "Assign Batches"}
              </Button>
            )}
            <Collapse in={expandedId === req.id} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mt: 2 }}>
                {req.details &&
                  req.details.map((item) => (
                    <Box key={item.itemID} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Product: {item.productName} (Total: {item.quantity})
                      </Typography>
                      {item.batches.map((batch) => (
                        <Box
                          key={batch.batchID}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 1,
                          }}
                        >
                          <Typography>
                            Exp: {batch.expirationDate || "N/A"}, Stock:{" "}
                            {batch.quantity}
                          </Typography>
                          <TextField
                            label="Qty to assign"
                            type="number"
                            size="small"
                            inputProps={{ min: 0, max: batch.quantity }}
                            value={
                              assignedQuantities[item.itemID]?.[
                                batch.batchID
                              ] ?? 0
                            }
                            disabled={req.status !== "pending"}
                            onFocus={(e) => {
                              if (e.target.value === "0") {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value || "0");
                              setAssignedQuantities((prev) => ({
                                ...prev,
                                [item.itemID]: {
                                  ...(prev[item.itemID] || {}),
                                  [batch.batchID]:
                                    value > batch.quantity
                                      ? batch.quantity
                                      : value,
                                },
                              }));
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ))}
              </Box>
            </Collapse>
            {req.status === "pending" && (
              <Box sx={{ mt: 1 }}>
                <Button
                  onClick={() => handleAction(req.id, "accept")}
                  variant="contained"
                  color="success"
                  sx={{ mr: 1 }}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleAction(req.id, "deny")}
                  variant="contained"
                  color="error"
                >
                  Deny
                </Button>
              </Box>
            )}
          </Paper>
        ))}
    </Box>
  );
}
