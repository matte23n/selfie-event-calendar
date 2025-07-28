import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  TextField, 
  Typography, 
  Paper,
  InputAdornment
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TodayIcon from '@mui/icons-material/Today';
import { useTimeMachine } from '../TimeMachineContext';

const TimeMachineControl: React.FC = () => {
  const { currentTime, setTime, resetToSystemTime } = useTimeMachine();
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState(currentTime.toISOString().slice(0, 10));
  const [timeInput, setTimeInput] = useState(
    currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    setDateInput(currentTime.toISOString().slice(0, 10));
    setTimeInput(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [currentTime]);

  const handleApplyDateTime = () => {
    try {
      const [hours, minutes] = timeInput.split(':').map(Number);
      const newDateTime = new Date(dateInput);
      newDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      setTime(newDateTime);
      setOpen(false);
    } catch (error) {
      console.error('Error applying date/time:', error);
    }
  };

  const formattedDate = currentTime.toLocaleDateString();
  const formattedTime = currentTime.toLocaleTimeString();
  const isSystemTime = Math.abs(currentTime.getTime() - new Date().getTime()) < 1000;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, position: 'relative' }}>
      <IconButton 
        onClick={() => setOpen(!open)} 
        color="inherit" 
        sx={{ p: 0.5, mr: 1 }}
        aria-label="Toggle time machine controls"
      >
        <AccessTimeIcon color={isSystemTime ? 'inherit' : 'warning'} />
      </IconButton>

      <Typography 
        variant="body2" 
        sx={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          color: isSystemTime ? 'inherit' : 'orange'
        }}
        onClick={() => setOpen(!open)}
      >
        {formattedDate} {formattedTime}
      </Typography>

      {open && (
        <Paper
          elevation={10}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            p: 2,
            width: 300,
            bgcolor: '#222',
            color: 'white',
            border: '2px solid #ff9800',
            borderRadius: 2,
            mt: 1,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: '#ff9800' }}>
            Time Machine
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Current virtual time:
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              {formattedDate} {formattedTime}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  '& fieldset': {
                    borderColor: '#ff9800',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ff9800',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TodayIcon sx={{ color: '#ff9800' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Time"
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  '& fieldset': {
                    borderColor: '#ff9800',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#ff9800',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeIcon sx={{ color: '#ff9800' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="contained"
              color="warning"
              fullWidth
              onClick={handleApplyDateTime}
              sx={{ mt: 1 }}
            >
              Apply Time
            </Button>
          </Box>
          
          <Button 
            variant="contained" 
            startIcon={<RestartAltIcon />} 
            onClick={() => {
              resetToSystemTime();
            }}
            fullWidth
            sx={{
              bgcolor: '#ff9800',
              '&:hover': {
                bgcolor: '#f57c00',
              },
            }}
          >
            Reset to System Time
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default TimeMachineControl;
