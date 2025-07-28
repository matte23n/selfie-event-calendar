import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Fab, Zoom, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router';
import TimeMachineControl from './TimeMachineControl';
import { useAuth } from '../AuthProvider';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import TaskIcon from '@mui/icons-material/Task';
import SchoolIcon from '@mui/icons-material/School';
import { useDialogContext } from '../DialogProvider';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const { setShowEventForm, setShowTaskForm, setShowStudyCycleForm } = useDialogContext();

  useEffect(() => {
    setFabOpen(false);
  }, [location.pathname]);

  const handleFabClick = () => {
    setFabOpen(!fabOpen);
  };

  const handleOpenEventForm = () => {
    setFabOpen(false);
    setShowEventForm(true);
  };

  const handleOpenTaskForm = () => {
    setFabOpen(false);
    setShowTaskForm(true);
  };

  const handleOpenStudyCycleForm = () => {
    setFabOpen(false);
    setShowStudyCycleForm(true);
  };

  return (
    <>
      <AppBar position="static" sx={{ marginBottom: '10px' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 2 }}>
            Selfie Event Calendar
          </Typography>
          {isAuthenticated && <TimeMachineControl />}
          <Box sx={{ flexGrow: 1 }} />
          {isAuthenticated ? (
            <>
              <Box>
                <Button color="inherit" component={Link} to="/">
                  Home
                </Button>
                <Button color="inherit" component={Link} to="/calendario">
                  Calendario
                </Button>
                <Button color="inherit" component={Link} to="/pomodoro">
                  Pomodoro
                </Button>
                <Button color="inherit" component={Link} to="/note">
                  Note
                </Button>
                <Button color="inherit" component={Link} to="/progetti">
                  Progetti
                </Button>
                <Button color="inherit" onClick={logout}>
                  Logout
                </Button>
              </Box>
            </>
          ) : (
            <Box>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/signup">
                Signup
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {isAuthenticated && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '300ms' : '0ms' }}>
            <Tooltip title="Schedule Study Cycles" placement="left">
              <Fab
                size="medium"
                color="info"
                sx={{
                  position: 'absolute',
                  bottom: 190,
                  right: 8,
                  bgcolor: '#673ab7',
                  '&:hover': {
                    bgcolor: '#5e35b1',
                  },
                }}
                onClick={handleOpenStudyCycleForm}
              >
                <SchoolIcon />
              </Fab>
            </Tooltip>
          </Zoom>
          <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '150ms' : '0ms' }}>
            <Tooltip title="Add Task" placement="left">
              <Fab size="medium" color="secondary" sx={{ position: 'absolute', bottom: 130, right: 8 }} onClick={handleOpenTaskForm}>
                <TaskIcon />
              </Fab>
            </Tooltip>
          </Zoom>
          <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '0ms' : '0ms' }}>
            <Tooltip title="Add Event" placement="left">
              <Fab
                size="medium"
                color="primary"
                sx={{ position: 'absolute', bottom: 70, right: 8 }}
                onClick={handleOpenEventForm}
              >
                <EventIcon />
              </Fab>
            </Tooltip>
          </Zoom>
          <Tooltip title={fabOpen ? 'Close' : 'Add New'}>
            <Fab
              color="primary"
              onClick={handleFabClick}
              sx={{
                transform: fabOpen ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.3s',
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