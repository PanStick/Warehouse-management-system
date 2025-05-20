import { Card, CardMedia, CardContent, Typography, TextField, Button } from "@mui/material";
import { cardStyles, cardMediaStyles } from "../styles/commonStyles";

export default function ProductCard({ product, quantity, onQuantityChange, onAddToCart }) {
  return (
    <Card sx={cardStyles}>
      <CardMedia
        component="img"
        image={`http://localhost:8080/${product.image}`}
        alt={product.productName}
        sx={cardMediaStyles}
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {product.productName}
        </Typography>
        <Typography variant="body2">Price: ${product.price.toFixed(2)}</Typography>
        <Typography variant="body2">In stock: {product.quantity}</Typography>
        <TextField
          label="Qty"
          type="number"
          size="small"
          inputProps={{ min: 0, max: product.quantity }}
          value={quantity ?? 0}
          onFocus={(e) => e.target.value === "0" && e.target.select()}
          onChange={(e) => {
            const val = parseInt(e.target.value || "0");
            if (!isNaN(val)) onQuantityChange(Math.min(val, product.quantity));
          }}
          sx={{ mt: 1, width: 70 }}
        />
        <Button onClick={onAddToCart} sx={{ ml: 2, mt: 1 }}>
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
