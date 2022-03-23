import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from "react-oidc-context";

export default function ButtonAppBar() {
  const auth = useAuth();
  let fragment = auth.isAuthenticated ? [
    <Typography key="username" sx={{ mr: 2 }}>Willkommen {auth.user?.profile["displayName"]}</Typography>,
    <Button color="inherit" key='logout' onClick={auth.removeUser} variant="outlined">Abmelden</Button>
  ] : <Button color="inherit" variant="outlined" onClick={auth.signinRedirect}>Anmelden</Button>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Home
          </Typography>
          {fragment}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
