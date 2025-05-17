import React, { useState } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu,
  Container, Button, Tooltip, MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../context/AuthContext';

const rolePages = {
  customer: ['Customer Home'],
  worker: ['Worker Home'],
  admin: ['Admin Home'],
  demo: ['Customer Home', 'Worker Home', 'Admin Home']
};

const TopBar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const {role, setRole} = useAuth();
  const loggedIn = !!role;
  const pages = role ? (rolePages[role] || ['Home']) : ['Home'];


  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    setRole(null);
    localStorage.clear();
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
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button key={page} onClick={handleCloseNavMenu} sx={{ my: 2, color: 'white' }}>
                {page}
              </Button>
            ))}
          </Box>

          {/* Right side buttons */}
          <Box sx={{ flexGrow: 0 }}>
            {!loggedIn ? (
              <>
                <Button color="inherit" onClick={() => window.location.href = '/login'}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => window.location.href = '/register'}>
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
                  open={Boolean(anchorElUser)}
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
