import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router';
import TimeMachineControl from './TimeMachineControl'; // Import TimeMachineControl

const Navbar: React.FC = () => {
  return (
    <AppBar position="static" sx={{ marginBottom: '10px' }}> {/* Add margin below the Navbar */}
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 2 }}>
          Selfie Event Calendar
        </Typography>
        <TimeMachineControl /> {/* Add TimeMachineControl next to the typography */}
        <Box sx={{ flexGrow: 1 }} /> {/* Push links to the end */}
        <Box>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/calendario">Calendario</Button>
          <Button color="inherit" component={Link} to="/pomodoro">Pomodoro</Button>
          <Button color="inherit" component={Link} to="/note">Note</Button>
          <Button color="inherit" component={Link} to="/progetti">Progetti</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
