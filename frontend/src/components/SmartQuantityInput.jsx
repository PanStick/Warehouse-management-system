import React from "react";
import { TextField } from "@mui/material";

export default function SmartQuantityInput({
  value,
  onChange,
  max = Infinity,
  min = 0,
  disabled = false,
  width = 70,
}) {
  return (
    <TextField
      type="number"
      size="small"
      inputProps={{ min, max }}
      value={value ?? 0}
      disabled={disabled}
      sx={{ width }}
      onFocus={(e) => {
        if (e.target.value === "0") e.target.select();
      }}
      onChange={(e) => {
        const num = parseFloat(e.target.value || "0");
        if (!isNaN(num)) {
          onChange(Math.min(Math.max(num, min), max));
        }
      }}
    />
  );
}
