import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
} from "@mui/material";

export default function TaskCard({ task, onComplete }) {
  return (
    <Paper key={task.taskId} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Task Type: {task.type}</Typography>
      </Box>
      <List dense>
        {task.items.map((item) => (
          <ListItem key={`${task.taskId}-${item.batchId}`}>
            <ListItemText
              primary={`Product: ${item.productName}`}
              secondary={`Batch ID: ${item.batchId} | Quantity: ${item.quantity}`}
            />
          </ListItem>
        ))}
      </List>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onComplete(task.taskId)}
      >
        Finish Task
      </Button>
    </Paper>
  );
}
