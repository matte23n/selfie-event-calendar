import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Fab, Zoom, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router';
import TimeMachineControl from './TimeMachineControl';
import { useAuth } from '../AuthProvider';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import TaskIcon from '@mui/icons-material/Task';
import { useDialogContext } from '../DialogProvider'; // Make sure this is used correctly

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const { setShowEventForm, setShowTaskForm } = useDialogContext(); // Using DialogContext
  
  // Close FAB menu when route changes
  useEffect(() => {
    setFabOpen(false);
  }, [location.pathname]);

  const handleFabClick = () => {
    setFabOpen(!fabOpen);
  };
  
  // These handlers now correctly use the DialogContext methods
  const handleOpenEventForm = () => {
    setFabOpen(false);
    setShowEventForm(true); // This should open the dialog
  };
  
  const handleOpenTaskForm = () => {
    setFabOpen(false);
    setShowTaskForm(true); // This should open the dialog
  };

  return (
    <>
      <AppBar position="static" sx={{ marginBottom: '10px' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 2 }}>
            Selfie Event Calendar
          </Typography>
          
          {/* Only show TimeMachineControl if authenticated */}
          {isAuthenticated && <TimeMachineControl />}
          
          <Box sx={{ flexGrow: 1 }} /> {/* Push links to the end */}
          
          {/* Only show navigation buttons if authenticated */}
          {isAuthenticated ? (
            <>
              <Box>
                <Button color="inherit" component={Link} to="/">Home</Button>
                <Button color="inherit" component={Link} to="/calendario">Calendario</Button>
                <Button color="inherit" component={Link} to="/pomodoro">Pomodoro</Button>
                <Button color="inherit" component={Link} to="/note">Note</Button>
                <Button color="inherit" component={Link} to="/progetti">Progetti</Button>
                <Button color="inherit" onClick={logout}>Logout</Button>
              </Box>
            </>
          ) : (
            <Box>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/signup">Signup</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Floating Action Button for adding events and tasks */}
      {isAuthenticated && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          {/* Task Button - Shows when expanded */}
          <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '150ms' : '0ms' }}>
            <Tooltip title="Add Task" placement="left">
              <Fab 
                size="medium" 
                color="secondary" 
                sx={{ position: 'absolute', bottom: 70, right: 8 }}
                onClick={handleOpenTaskForm}
              >
                <TaskIcon />
              </Fab>
            </Tooltip>
          </Zoom>

          {/* Event Button - Shows when expanded */}
          <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '0ms' : '0ms' }}>
            <Tooltip title="Add Event" placement="left">
              <Fab 
                size="medium" 
                color="primary" 
                sx={{ position: 'absolute', bottom: 130, right: 8 }}
                onClick={handleOpenEventForm}
              >
                <EventIcon />
              </Fab>
            </Tooltip>
          </Zoom>

          {/* Main FAB Button */}
          <Tooltip title={fabOpen ? "Close" : "Add New"}>
            <Fab 
              color="primary" 
              onClick={handleFabClick}
              sx={{ 
                transform: fabOpen ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.3s'
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      )}
    </>
  );
};

export default Navbar;