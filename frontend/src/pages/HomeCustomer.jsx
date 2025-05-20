import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, TextField } from "@mui/material";
import ProductCard from "../components/ProductCard";

export default function HomeCustomer() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [filterText, setFilterText] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/products/with-stock")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const handleAddToCart = (product) => {
    const inputQty = parseInt(quantities[product.id] ?? 0);
    const qty = Math.min(inputQty, product.quantity);
    if (qty <= 0) return;

    const storedCart = JSON.parse(localStorage.getItem("cart") || "{}");
    const updatedCart = {
      ...storedCart,
      [product.id]: {
        id: product.id,
        name: product.productName,
        price: product.price,
        image: product.image,
        quantity: (storedCart[product.id]?.quantity || 0) + qty,
        stock: product.quantity
      },
    };
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setQuantities((prev) => ({ ...prev, [product.id]: 0 }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Products</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <TextField
          label="Filter by name"
          variant="outlined"
          size="small"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Only show available
        </label>
      </Box>
      <Grid container spacing={3}>
        {products
          .filter((product) =>
            product.productName.toLowerCase().includes(filterText.toLowerCase())
          )
          .filter((product) => !showOnlyAvailable || product.quantity > 0)
          .map((product) => (
            <Grid size={{xs:12, sm:6, md:4, lg:4 }} key={product.id}>
              <ProductCard
                product={product}
                quantity={quantities[product.id]}
                onQuantityChange={(val) => setQuantities(prev => ({ ...prev, [product.id]: val }))}
                onAddToCart={() => handleAddToCart(product)}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
