import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Button
} from "@mui/material";

export default function Cart() {
  const [cart, setCart] = useState({});
  const userID = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "{}");
    setCart(storedCart);
  }, []);

  const updateQuantity = (id, qty) => {
    const updated = { ...cart };
    updated[id].quantity = parseInt(qty);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (id) => {
    const updated = { ...cart };
    delete updated[id];
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const confirmPurchase = () => {
    const items = Object.values(cart).map(item => ({
      productID: item.id,
      quantity: item.quantity,
    }));


    fetch("http://localhost:8080/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, items }),
    })
      .then(async (res) => {
        const text = await res.text();
        console.log("Raw response from backend:", text); // 🔍
        if (!res.ok) throw new Error(text);
        return JSON.parse(text); // Only if it's JSON
      })
      .then(data => {
        alert("Purchase submitted!");
        localStorage.removeItem("cart");
        setCart({});
      })
      .catch(err => {
        console.error("Purchase error:", err);
        alert("Failed to submit purchase.");
      });
    
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Shopping Cart</Typography>
      {Object.keys(cart).length === 0 ? (
        <Typography>Your cart is empty.</Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.values(cart).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button color="error" onClick={() => removeItem(item.id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={confirmPurchase}>
              Confirm Purchase
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
