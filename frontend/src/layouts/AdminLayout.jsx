import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Stack, Divider } from "@mui/material";

const adminPages = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Reports", path: "/admin/reports" },
  { label: "Admin Panel", path: "/admin/panel" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ mt: "90px", px: 3 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {adminPages.map((page) => {
          const isDashboard = page.path === "/admin/dashboard";
          const isActive =
            (isDashboard && location.pathname === "/admin") ||
            location.pathname.startsWith(page.path);

          return (
            <Button
              key={page.path}
              variant={isActive ? "contained" : "outlined"}
              onClick={() => navigate(page.path)}
            >
              {page.label}
            </Button>
          );
        })}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Outlet />
    </Box>
  );
}
