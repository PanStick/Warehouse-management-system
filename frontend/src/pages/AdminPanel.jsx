import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";

export default function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    expirationDate: "",
  });

  // Load suppliers once
  useEffect(() => {
    fetch("http://localhost:8080/api/suppliers")
      .then((res) => res.json())
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Failed to fetch suppliers:", err));
  }, []);

  // When supplier changes, load its products
  useEffect(() => {
    if (!form.supplierId) return;
    fetch(`http://localhost:8080/api/products?supplierId=${form.supplierId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products:", err));
    // reset product selection
    setForm((f) => ({ ...f, productId: "" }));
  }, [form.supplierId]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({ supplierId: "", productId: "", quantity: "", expirationDate: "" });
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    const payload = {
      productID: parseInt(form.productId),
      quantity: parseInt(form.quantity),
      expirationDate: form.expirationDate || null,
    };

    try {
      const res = await fetch("http://localhost:8080/api/ordered-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      handleClose();
      alert("Order created successfully!");
    } catch (err) {
      console.error("Failed to create order:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      <Button variant="contained" onClick={handleOpen}>
        Create Order
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Product Order</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={form.supplierId}
              label="Supplier"
              onChange={handleChange("supplierId")}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.supplierName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }} disabled={!form.supplierId}>
            <InputLabel>Product</InputLabel>
            <Select
              value={form.productId}
              label="Product"
              onChange={handleChange("productId")}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.productName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Quantity"
            type="number"
            fullWidth
            required
            inputProps={{ min: 1 }}
            sx={{ mt: 2 }}
            value={form.quantity}
            onChange={handleChange("quantity")}
          />

          <TextField
            label="Expiration Date (optional)"
            type="date"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={form.expirationDate}
            onChange={handleChange("expirationDate")}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.productId || !form.quantity}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
