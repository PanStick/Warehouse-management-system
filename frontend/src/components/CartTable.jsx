import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TextField, Button
  } from "@mui/material";
  
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
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    size="small"
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
  