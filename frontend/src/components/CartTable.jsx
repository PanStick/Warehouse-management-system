import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button
  } from "@mui/material";
  import SmartQuantityInput from "./SmartQuantityInput"; // adjust path as needed
  
  export default function CartTable({ cart, onUpdate, onRemove }) {
    return (
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
                  <SmartQuantityInput
                    value={item.quantity}
                    max={item.stock ?? 9999}
                    onChange={(val) => onUpdate(item.id, val)}
                  />
                </TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                <TableCell>
                  <Button color="error" onClick={() => onRemove(item.id)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  