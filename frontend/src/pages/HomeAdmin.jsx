import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import RequestCard from "../components/RequestCard";

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
    const res = await fetch(`http://localhost:8080/api/purchase-requests/${id}/details`);
    const data = await res.json();
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, details: data.items } : r)));
  };

  const preloadAssignmentsIfNeeded = async (id, items) => {
    const newAssigned = {};
    items.forEach((item) => {
      let remainingQty = item.quantity;
      newAssigned[item.itemID] = {};
      item.batches.forEach((batch) => {
        const assignQty = Math.min(batch.quantity, remainingQty);
        newAssigned[item.itemID][batch.batchID] = assignQty;
        remainingQty -= assignQty;
      });
    });
    setAssignedQuantities(newAssigned);
    return newAssigned;
  };

  const handleAction = async (id, action) => {
    const request = requests.find((r) => r.id === id);
    let currentAssigned = assignedQuantities;

    if (action === "accept" && (!request.details || Object.keys(currentAssigned).length === 0)) {
      const res = await fetch(`http://localhost:8080/api/purchase-requests/${id}/details`);
      const data = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, details: data.items } : r)));
      currentAssigned = await preloadAssignmentsIfNeeded(id, data.items);
    }

    if (action === "accept") {
      const flat = [];
      for (let itemID in currentAssigned) {
        for (let batchID in currentAssigned[itemID]) {
          flat.push({
            itemID: parseInt(itemID),
            batchID: parseInt(batchID),
            quantity: currentAssigned[itemID][batchID],
          });
        }
      }

      try {
        await fetch(`http://localhost:8080/api/purchase-requests/${id}/assign-batches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batches: flat }),
        });

        await fetch(`http://localhost:8080/api/purchase-requests/${id}/accept`, {
          method: "POST",
        });
      } catch (err) {
        console.error("Assignment or acceptance failed:", err);
        alert("Failed to complete request.");
        return;
      }
    } else if (action === "deny") {
      await fetch(`http://localhost:8080/api/purchase-requests/${id}/deny`, {
        method: "POST",
      });
    }

    const res = await fetch(`http://localhost:8080/api/purchase-requests/${id}`);
    const updated = await res.json();
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const handleToggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      fetchDetails(id);
      setExpandedId(id);
    }
  };

  const handleQuantityChange = (itemID, batchID, value) => {
    setAssignedQuantities((prev) => ({
      ...prev,
      [itemID]: {
        ...(prev[itemID] || {}),
        [batchID]: value,
      },
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      {[...requests]
        .sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return b.id - a.id;
        })
        .map((req) => (
          <RequestCard
            key={req.id}
            request={req}
            expanded={expandedId === req.id}
            onToggle={handleToggleExpand}
            assignedQuantities={assignedQuantities}
            onQuantityChange={handleQuantityChange}
            onAction={handleAction}
          />
        ))}
    </Box>
  );
}
