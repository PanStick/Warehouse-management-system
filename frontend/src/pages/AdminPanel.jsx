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
  const [orderOpen, setOrderOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [suppOpen, setSuppOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newSupplierName, setNewSupplierName] = useState("");

  const [orderForm, setOrderForm] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    expirationDate: "",
  });
  const [prodForm, setProdForm] = useState({
    supplierId: "",
    productName: "",
    price: "",
    imageFile: null,
  });
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "customer",
  });

  // Load suppliers once
  useEffect(() => {
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Failed to fetch suppliers:", err));
  }, []);

  // When supplier changes, load its products
  useEffect(() => {
    if (!orderForm.supplierId) return;
    fetch(`/api/products?supplierId=${orderForm.supplierId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products:", err));
    // reset product selection
    setOrderForm((f) => ({ ...f, productId: "" }));
  }, [orderForm.supplierId]);

  const loadSuppliers = () => {
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((data) => setSuppliers(data))
      .catch((err) => console.error("Failed to fetch suppliers: ", err));
  };

  const handleUserOpen = () => setUserOpen(true);
  const handleUserClose = () => {
    setUserOpen(false);
    setUserForm({ email: "", password: "", role: "customer" });
  };
  const handleUserChange = (field) => (e) =>
    setUserForm((f) => ({ ...f, [field]: e.target.value }));

  const submitUser = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) throw new Error(await res.text());
      handleUserClose();
      alert("User created!");
    } catch (err) {
      console.error("Failed to add user:", err);
      alert("Error: " + err.message);
    }
  };

  const handleSuppOpen = () => setSuppOpen(true);
  const handleSuppClose = () => {
    setSuppOpen(false);
    setNewSupplierName("");
  };

  const submitSupplier = async () => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierName: newSupplierName }),
      });
      if (!res.ok) throw new Error(await res.text());
      handleSuppClose();
      loadSuppliers();
      alert("Supplier added!");
    } catch (err) {
      console.error("Failed to add supplier:", err);
      alert("Error: " + err.message);
    }
  };

  const handleProdOpen = () => setProdOpen(true);

  const handleProdClose = () => {
    setProdOpen(false);
    setProdForm({
      supplierId: "",
      productName: "",
      price: "",
      imageFile: null,
    });
  };
  const handleProdChange = (field) => (e) => {
    const val = field === "imageFile" ? e.target.files[0] : e.target.value;
    setProdForm((f) => ({ ...f, [field]: val }));
  };
  const handleProdSubmit = async () => {
    const formData = new FormData();
    formData.append("supplierId", prodForm.supplierId);
    formData.append("productName", prodForm.productName);
    formData.append("unitType", "unit");
    formData.append("price", prodForm.price);
    if (prodForm.imageFile) {
      formData.append("image", prodForm.imageFile);
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Product created");
      handleProdClose();
    } catch (err) {
      console.error("Failed to create product: ", err);
      alert("Error: " + err.message);
    }
  };

  const handleOrderOpen = () => setOrderOpen(true);
  const handleOrderClose = () => {
    setOrderOpen(false);
    setOrderForm({
      supplierId: "",
      productId: "",
      quantity: "",
      expirationDate: "",
    });
  };

  const handleOrderChange = (field) => (e) => {
    setOrderForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleOrderSubmit = async () => {
    const payload = {
      productID: parseInt(orderForm.productId),
      quantity: parseInt(orderForm.quantity),
      expirationDate: orderForm.expirationDate || null,
    };

    try {
      const res = await fetch("/api/ordered-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      handleOrderClose();
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
      <Button variant="contained" onClick={handleOrderOpen}>
        Create Order
      </Button>
      <Button variant="contained" onClick={handleProdOpen}>
        Create Product
      </Button>
      <Button variant="contained" onClick={handleSuppOpen}>
        Add Supplier
      </Button>
      <Button variant="contained" onClick={handleUserOpen}>
        Add User
      </Button>

      <Dialog
        open={orderOpen}
        onClose={handleOrderClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Product Order</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={orderForm.supplierId}
              label="Supplier"
              onChange={handleOrderChange("supplierId")}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.supplierName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            sx={{ mt: 2 }}
            disabled={!orderForm.supplierId}
          >
            <InputLabel>Product</InputLabel>
            <Select
              value={orderForm.productId}
              label="Product"
              onChange={handleOrderChange("productId")}
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
            value={orderForm.quantity}
            onChange={handleOrderChange("quantity")}
          />

          <TextField
            label="Expiration Date (optional)"
            type="date"
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            value={orderForm.expirationDate}
            onChange={handleOrderChange("expirationDate")}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleOrderClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleOrderSubmit}
            disabled={!orderForm.productId || !orderForm.quantity}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prodOpen} onClose={handleProdClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={prodForm.supplierId}
              label="Supplier"
              onChange={handleProdChange("supplierId")}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.supplierName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Product Name"
            fullWidth
            sx={{ mt: 2 }}
            value={prodForm.productName}
            onChange={handleProdChange("productName")}
          />

          <TextField
            label="Price"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ step: "0.01", min: 0 }}
            value={prodForm.price}
            onChange={handleProdChange("price")}
          />

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" component="label">
              Upload Image (optional)
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                hidden
                onChange={handleProdChange("imageFile")}
              />
            </Button>
            {prodForm.imageFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {prodForm.imageFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProdClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProdSubmit}
            disabled={
              !prodForm.supplierId ||
              !prodForm.productName.trim() ||
              !prodForm.price
            }
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={suppOpen} onClose={handleSuppClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <TextField
            label="Supplier Name"
            fullWidth
            sx={{ mt: 1 }}
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuppClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitSupplier}
            disabled={!newSupplierName.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={userOpen} onClose={handleUserClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            label="Email"
            type="email"
            fullWidth
            sx={{ mt: 2 }}
            value={userForm.email}
            onChange={handleUserChange("email")}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ mt: 2 }}
            value={userForm.password}
            onChange={handleUserChange("password")}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={handleUserChange("role")}
            >
              <MenuItem value="worker">Worker</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUserClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitUser}
            disabled={
              !userForm.email.trim() || !userForm.password || !userForm.role
            }
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
