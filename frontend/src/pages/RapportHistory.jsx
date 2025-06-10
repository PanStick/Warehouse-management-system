import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";

export default function RapportHistory() {
  const [rapports, setRapports] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/worker/rapports");
        if (!res.ok) throw new Error("Failed to load rapports");
        const data = await res.json();
        setRapports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Rapport History
      </Typography>

      {rapports.length === 0 ? (
        <Typography>No reports yet.</Typography>
      ) : (
        <List>
          {rapports.map((r) => (
            <Paper key={r.id} sx={{ p: 2, mb: 2 }}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <>
                      <strong>[{r.status.toUpperCase()}]</strong>{" "}
                      {r.content || "(no content)"}
                    </>
                  }
                  secondary={
                    r.response
                      ? `Response: ${r.response}`
                      : "No response yet."
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
}
