import React, { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  console.log("login form rendered");
  const { setRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    console.log("before prevent default");
    //e.preventDefault();
    console.log("Login button clicked");

    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed: ${text}`);
      }

      const data = await res.json();
      alert(data.message);

      if (email === "demo") setRole("demo");
      else setRole("customer");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
        <Typography variant="h5">Login</Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="off"
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="off"
          required
        />
        <Button onClick={handleLogin} variant="contained" color="primary" component="button">
          Login
        </Button>
    </Box>
  );
}
