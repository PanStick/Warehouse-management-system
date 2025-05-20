import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid";

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
    const qty = Math.min(inputQty, product.quantity); // cap at max available

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
      },
    };

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setQuantities((prev) => ({ ...prev, [product.id]: 0 })); // reset to 0
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>
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
          .filter((product) => (showOnlyAvailable ? product.quantity > 0 : true))
          .map((product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={product.id}>
              <Card
                sx={{
                  height: 300,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <CardMedia
                  component="img"
                  image={`http://localhost:8080/${product.image}`}
                  alt={product.productName}
                  sx={{ height: 140, objectFit: "contain" }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {product.productName}
                  </Typography>
                  <Typography variant="body2">
                    Price: ${product.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    In stock: {product.quantity}
                  </Typography>
                  <TextField
                    label="Qty"
                    type="number"
                    size="small"
                    inputProps={{
                      min: 0,
                      max: product.quantity,
                    }}
                    value={quantities[product.id] ?? 0}
                    onFocus={(e) => {
                      if (e.target.value === "0") {
                        e.target.select(); // select to replace on first input
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        const capped = Math.min(num, product.quantity);
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: capped,
                        }));
                      }
                    }}
                    sx={{ mt: 1, width: 70 }}
                  />

                  <Button
                    onClick={() => handleAddToCart(product)}
                    sx={{ ml: 2, mt: 1 }}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
