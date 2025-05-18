import React, { useState, useEffect } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  Container, Button, Tooltip, MenuItem, Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const rolePages = {
  customer: [{ label: 'Customer Home', path: '/customer-home' }],
  worker: [{ label: 'Worker Home', path: '/worker-home' }],
  admin: [{ label: 'Admin Home', path: '/admin-home' }],
  demo: [
    { label: 'Customer Home', path: '/customer-home' },
    { label: 'Worker Home', path: '/worker-home' },
    { label: 'Admin Home', path: '/admin-home' }
  ]
};

const TopBar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();

  const { role, setRole } = useAuth();
  const loggedIn = !!role;
  const pages = role ? (rolePages[role] || []) : [{label: "home", path: "/"}];

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);


  useEffect(() => {
    setAnchorElNav(null);
    setAnchorElUser(null);
  }, [role]);

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    navigate('/');
  };

  const handlePageNavigate = (path) => {
    navigate(path);
    handleCloseNavMenu();
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav && anchorElNav instanceof Element)}
              onClose={handleCloseNavMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {pages.map((page) => (
                <MenuItem key={page.label} onClick={() => handlePageNavigate(page.path)}>
                  <Typography textAlign="center">{page.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.label}
                onClick={() => handlePageNavigate(page.path)}
                sx={{ my: 2, color: 'white' }}
              >
                {page.label}
              </Button>
            ))}
          </Box>

          {role === 'customer' || role === 'demo' ? (
            <IconButton color="inherit" onClick={() => navigate('/cart')}>
              <Badge color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          ) : null}

          {/* Right side buttons */}
          <Box sx={{ flexGrow: 0 }}>
            {!loggedIn ? (
              <>
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            ) : (
              <>
                <Tooltip title="Open settings">
                  <Button onClick={handleOpenUserMenu} sx={{ color: 'white' }}>
                    My Account
                  </Button>
                </Tooltip>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser && anchorElUser instanceof Element && document.body.contains(anchorElUser))}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default TopBar;
