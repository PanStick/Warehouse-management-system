import React, { useState } from "react";
import { TextField, Button, Typography, Box, Toolbar } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { setRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed: ${text}`);
      }

      const data = await res.json();
      //alert(data.message);

      const role = data.role;
      localStorage.setItem("role", role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", data.email);
      setRole(role);

      switch (role) {
        case "customer":
          navigate("/customer-home");
          break;
        case "worker":
          navigate("/worker-home");
          break;
        case "admin":
          navigate("/admin-home");
          break;
        case "demo":
          navigate("/customer-home"); // default for demo
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Toolbar />
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
        <Button
          onClick={handleLogin}
          variant="contained"
          color="primary"
          component="button"
        >
          Login
        </Button>
      </Box>
    </>
  );
}
