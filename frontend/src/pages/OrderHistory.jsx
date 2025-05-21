import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:8080/api/purchase-requests/user/${userId}`)
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [userId]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Order History
      </Typography>

      {orders.length === 0 ? (
        <Typography>No past orders found.</Typography>
      ) : (
        orders.map(order => (
          <Paper key={order.id} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">
              Order #{order.id} — Status: {order.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Placed on: {new Date(order.created_at).toLocaleString()}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {order.items.map(item => (
                <ListItem key={item.productID}>
                  <ListItemText
                    primary={`${item.productName} × ${item.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))
      )}
    </Box>
  );
}
