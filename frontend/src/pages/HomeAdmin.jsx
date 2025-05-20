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
  const [assignments, setAssignments] = useState({});
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

    const initial = {};
    data.items.forEach((item) => {
      initial[item.itemID] = item.batches.map((b) => ({
        batchID: b.batchID,
        quantity: b.quantity,
      }));
    });
    setAssignments(initial);
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      fetchDetails(id);
      setExpandedId(id);
    }
  };

  const handleAssignChange = (itemID, batchID, value) => {
    setAssignments((prev) => ({
      ...prev,
      [itemID]: prev[itemID].map((b) =>
        b.batchID === batchID ? { ...b, quantity: parseFloat(value) || 0 } : b
      ),
    }));
  };
  const handleAssignSubmit = (id) => {
    const flat = [];
    for (let itemID in assignments) {
      assignments[itemID].forEach(({ batchID, quantity }) => {
        flat.push({ itemID: parseInt(itemID), batchID, quantity });
      });
    }

    fetch(`http://localhost:8080/api/purchase-requests/${id}/assign-batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batches: flat }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to assign");
        alert("Assignments updated");
      })
      .catch((err) => {
        console.error(err);
        alert("Assignment failed");
      });
  };

  const handleAction = (id, action) => {
    fetch(`http://localhost:8080/api/purchase-requests/${id}/${action}`, {
      method: "POST",
    })
      .then(() => {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action } : r))
        );
      })
      .catch((err) => console.error("Action failed:", err));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      {(requests || []).map((req) => (
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
              {assignments &&
                Object.entries(assignments).map(([itemID, batchList]) => {
                  const itemDetail = req.details?.find(
                    (it) => it.itemID === parseInt(itemID)
                  );
                  return (
                    <Box key={itemID} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Product: {itemDetail?.productName || `Item ${itemID}`}{" "}
                        (Total: {itemDetail?.quantity})
                      </Typography>
                      {batchList.map((batch, i) => {
                        const detailBatch = itemDetail?.batches.find(
                          (b) => b.batchID === batch.batchID
                        );
                        return (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mt: 1,
                            }}
                          >
                            <Typography>
                              Exp: {detailBatch?.expirationDate || "N/A"},
                              Stock: {detailBatch?.quantity}
                            </Typography>
                            <TextField
                              label="Qty to assign"
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: batch.quantity }}
                              value={
                                assignedQuantities[itemID]?.[batch.batchID] !==
                                undefined
                                  ? assignedQuantities[itemID][batch.batchID]
                                  : 0
                              }
                              disabled={req.status !== "pending"}
                              onFocus={(e) => {
                                if (e.target.value === "0") {
                                  e.target.select(); // selects the 0 so it gets replaced when typing
                                }
                              }}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value || "0");
                                setAssignedQuantities((prev) => ({
                                  ...prev,
                                  [itemID]: {
                                    ...(prev[itemID] || {}),
                                    [batch.batchID]:
                                      value > batch.quantity
                                        ? batch.quantity
                                        : value,
                                  },
                                }));
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              {req.status === "pending" && (
                <Button
                  variant="contained"
                  onClick={() => handleAssignSubmit(req.id)}
                >
                  Submit Assignments
                </Button>
              )}
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
