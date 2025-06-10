import { useState } from "react";
import { TextField, Button, Typography, Box, Toolbar } from "@mui/material";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Registration failed: ${text}`);
      }

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Toolbar />
      <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
        <Typography variant="h5">Register</Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        <Button onClick={handleRegister} variant="contained" color="secondary">
          Register
        </Button>
      </Box>
    </>
  );
}
