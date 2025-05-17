import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardMedia, Grid } from "@mui/material";

export default function HomeCustomer() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/products/with-stock")
    .then(async (res) => {
      const text = await res.text();
      console.log("Raw response:", text);
      return JSON.parse(text); // Will throw if it's not JSON
    })
    .then((data) => {
      console.log("Parsed data:", data);
      setProducts(data);
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
    });
  
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Available Products
      </Typography>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                image={`http://localhost:8080/${product.image}`}
                alt={product.name}
                sx={{
                  width: 200,
                  height: 200,
                  objectFit: 'contain',
                }}
              />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total in stock: {product.quantity}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
