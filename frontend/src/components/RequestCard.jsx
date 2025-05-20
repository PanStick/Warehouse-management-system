import {
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Collapse,
    Box,
  } from "@mui/material";
  import SmartQuantityInput from "./SmartQuantityInput";
  
  export default function RequestCard({
    request,
    expanded,
    onToggle,
    assignedQuantities,
    onQuantityChange,
    onAction,
    assignmentError,
    expandedId,
  }) {
    return (
      <Paper key={request.id} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">
          Request #{request.id} - User: {request.email} - Status: {request.status}
        </Typography>
        <List dense>
          {request.items.map((item) => (
            <ListItem key={item.productID}>
              <ListItemText primary={`${item.productName} x${item.quantity}`} />
            </ListItem>
          ))}
        </List>
        {request.status === "pending" && (
          <Button onClick={() => onToggle(request.id)} sx={{ mt: 1 }}>
            {expanded ? "Hide Batches" : "Assign Batches"}
          </Button>
        )}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2, mt: 2 }}>
            {request.details?.map((item) => (
              <Box key={item.itemID} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Product: {item.productName} (Total: {item.quantity})
                </Typography>
                {item.batches.map((batch) => (
                  <Box
                    key={batch.batchID}
                    sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
                  >
                    <Typography>
                      Exp: {batch.expirationDate || "N/A"}, Stock: {batch.quantity}
                    </Typography>
  
                    <SmartQuantityInput
                      value={assignedQuantities[item.itemID]?.[batch.batchID] ?? 0}
                      max={batch.quantity}
                      onChange={(val) => onQuantityChange(item.itemID, batch.batchID, val)}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Collapse>
        {assignmentError && expanded && request.id === expandedId && (
          <Typography color="error" sx={{ mt: 1 }}>
            {assignmentError}
          </Typography>
        )}
        {request.status === "pending" && (
          <Box sx={{ mt: 1 }}>
            <Button
              onClick={() => onAction(request.id, "accept")}
              variant="contained"
              color="success"
              sx={{ mr: 1 }}
            >
              Accept
            </Button>
            <Button
              onClick={() => onAction(request.id, "deny")}
              variant="contained"
              color="error"
            >
              Deny
            </Button>
          </Box>
        )}
      </Paper>
    );
  }
  