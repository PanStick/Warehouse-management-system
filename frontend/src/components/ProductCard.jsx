import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import { cardStyles, cardMediaStyles } from "../styles/commonStyles";
import SmartQuantityInput from "./SmartQuantityInput";

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
        
        <SmartQuantityInput
          value={quantity}
          onChange={(val) => onQuantityChange(val)}
          max={product.quantity}
        />

        <Button onClick={onAddToCart} sx={{ ml: 2, mt: 1 }}>
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
