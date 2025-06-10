import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import CartTable from "../components/CartTable";

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

    fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, items }),
    })
      .then(res => res.json())
      .then(() => {
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
          <CartTable cart={cart} onUpdate={updateQuantity} onRemove={removeItem} />
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={confirmPurchase}>Confirm Purchase</Button>
          </Box>
        </>
      )}
    </Box>
  );
}
