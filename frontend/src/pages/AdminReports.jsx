import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  Dialog,
  TextField,
} from "@mui/material";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [respDialog, setRespDialog] = useState({
    open: false,
    id: null,
    text: "",
  });

  useEffect(() => {
    fetch("/api/ordered-products")
      .then((res) => res.json())
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching deliveries:", err);
        setDeliveries([]);
      });
  }, []);

  // fetch all rapports on mount
  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/rapports");
        if (!res.ok) throw new Error("Failed to load reports");
        const data = await res.json();
        Array.isArray(data) ? setReports(data) : setReports([]);
      } catch (err) {
        console.error("Error fetching rapports:", err);
      }
    }

    loadReports();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `/api/rapports/${id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      // update local state
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const openRespond = (r) =>
    setRespDialog({ open: true, id: r.id, text: r.response || "" });

  const sendResponse = async () => {
    try {
      const { id, text } = respDialog;
      const res = await fetch(
        `/api/rapports/${id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: text }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "responded", response: text } : r
        )
      );
      setRespDialog({ open: false, id: null, text: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to send response");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Reports
      </Typography>

      <List>
        {reports.map((r) => {
          // for delivery rapports, look up the order in `deliveries`
          let deliveryInfo = null;
          if (r.type === "delivery" && r.content) {
            const orderId = parseInt(r.content, 10);
            deliveryInfo = deliveries.find((d) => d.id === orderId) || null;
          }
          return (
            <Paper key={r.id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                {r.type === "text"
                  ? `[Text] ${r.content}`
                  : deliveryInfo
                  ? // show actual delivered product
                    `Delivery for ${deliveryInfo.productName} x${deliveryInfo.quantity}` +
                    (deliveryInfo.expirationDate
                      ? ` (exp ${deliveryInfo.expirationDate})`
                      : "")
                  : // fallback if not yet loaded
                    `Delivery rapport for order #${r.content}`}{" "}
              </Typography>
              <Typography>Status: {r.status}</Typography>
              {r.response && (
                <Typography color="text.secondary">
                  Response: {r.response}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                <Button
                  onClick={() => updateStatus(r.id, "accepted")}
                  disabled={r.status !== "pending"}
                  sx={{ mr: 1 }}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => updateStatus(r.id, "denied")}
                  disabled={r.status !== "pending"}
                  sx={{ mr: 1 }}
                >
                  Deny
                </Button>
                {r.type === "text" && (
                  <Button onClick={() => openRespond(r)}>Respond</Button>
                )}
              </Box>
            </Paper>
          );
        })}
      </List>

      <Dialog
        open={respDialog.open}
        onClose={() => setRespDialog({ ...respDialog, open: false })}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Respond to Report</Typography>
          <TextField
            label="Response"
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 1 }}
            value={respDialog.text}
            onChange={(e) =>
              setRespDialog({ ...respDialog, text: e.target.value })
            }
          />
          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              onClick={() => setRespDialog({ open: false, id: null, text: "" })}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button variant="contained" onClick={sendResponse}>
              Send
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
