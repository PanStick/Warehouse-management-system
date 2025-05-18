import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, CardMedia,
 Button, TextField
} from "@mui/material";
import Grid from '@mui/material/Grid';

export default function HomeCustomer() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetch("http://localhost:8080/api/products/with-stock")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  const handleAddToCart = (product) => {
    const qty = parseInt(quantities[product.id] || 1);
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
    console.log(JSON.parse(localStorage.getItem("cart")));
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Available Products</Typography>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid size = {{xs:12, sm: 4, md:4 }} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                image={`http://localhost:8080/${product.image}`}
                alt={product.name}
                sx={{ width: 200, height: 200, objectFit: 'contain' }}
              />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2">Price: ${product.price.toFixed(2)}</Typography>
                <Typography variant="body2">In stock: {product.quantity}</Typography>
                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  value={quantities[product.id] || 1}
                  onChange={(e) =>
                    setQuantities({ ...quantities, [product.id]: e.target.value })
                  }
                  sx={{ mt: 1, width: 70 }}
                />
                <Button onClick={() => handleAddToCart(product)} sx={{ ml: 2, mt: 1 }}>
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
