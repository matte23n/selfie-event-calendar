import React, { useState, useEffect } from 'react';
import { Button, Container, Grid, Box, TextField, Typography, FormHelperText } from '@mui/material';
import './Pomodoro.css';
import axiosInstance from './api/axiosInstance';
import { useLocation, useNavigate } from 'react-router';

interface cycle {
  study: number;
  break: number;
}

interface LocationState {
  eventId?: string;
  title?: string;
  studyTime?: number;
  breakTime?: number;
  totalCycles?: number;
  completedCycles?: number;
  totalTime?: string;
}

const Pomodoro = () => {
  const [studyTime, setStudyTime] = useState(30);
  const [breakTime, setBreakTime] = useState(5);
  const [totalTime, setTotalTime] = useState('02:55');
  const [cycles, setCycles] = useState<cycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isStudying, setIsStudying] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [pomodoroHistory, setPomodoroHistory] = useState<any[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [fromCalendar, setFromCalendar] = useState(false);
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [initialCompletedCycles, setInitialCompletedCycles] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're coming from a calendar event
  useEffect(() => {
    const state = location.state as LocationState;
    
    if (state && state.eventId) {
      setEventId(state.eventId);
      setFromCalendar(true);
      
      // Populate the form fields with the data from the calendar event
      if (state.studyTime) setStudyTime(state.studyTime);
      if (state.breakTime) setBreakTime(state.breakTime);
      if (state.totalTime) setTotalTime(state.totalTime);
      
      if (state.totalCycles) {
        // Create cycles based on the calendar event
        const newCycles = Array(state.totalCycles).fill({}).map(() => ({
          study: state.studyTime || 25,
          break: state.breakTime || 5
        }));
        setCycles(newCycles);
        
        // Set the starting cycle based on completed cycles
        setCurrentCycle(state.completedCycles || 0);
        setInitialCompletedCycles(state.completedCycles || 0);
      }
    }
    
    // Clear location state after reading
    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // Fetch pomodoro history on component mount
  useEffect(() => {
    fetchPomodoroHistory();
  }, []);

  const fetchPomodoroHistory = async () => {
    try {
      const response = await axiosInstance.get('/pomodoros');
      setPomodoroHistory(response.data);
    } catch (error) {
      console.error('Error fetching pomodoro history:', error);
    }
  };

  const calculateCycles = () => {
    // Clear previous errors
    setError('');
    
    let totalMinutes = 0;
    
    // Check if the input includes a colon (HH:MM format)
    if (totalTime.includes(':')) {
      const [hours, minutes] = totalTime.split(':').map(num => parseInt(num, 10));
      // Validate that both hours and minutes are valid numbers
      if (!isNaN(hours) && !isNaN(minutes)) {
        totalMinutes = (hours * 60) + minutes;
      } else {
        setError('Invalid time format. Please use HH:MM or minutes.');
        return;
      }
    } else {
      // Try to parse as minutes
      totalMinutes = parseInt(totalTime, 10);
      if (isNaN(totalMinutes)) {
        setError('Please enter a valid time value.');
        return;
      }
    }
    
    // Validate that we have a positive number of minutes
    if (totalMinutes <= 0) {
      setError('Please enter a time greater than zero.');
      return;
    }
    
    // Validate that study and break times are valid
    if (studyTime <= 0 || breakTime < 0) {
      setError('Study time must be greater than zero and break time must be non-negative.');
      return;
    }
    
    const cycleTime = studyTime + breakTime;
    const numCycles = Math.floor(totalMinutes / cycleTime);
    const remainingTime = totalMinutes % cycleTime;
    
    const newCycles = Array(numCycles).fill({}).map(() => ({ 
      study: studyTime, 
      break: breakTime 
    }));
    
    if (remainingTime > 0) {
      newCycles.push({ study: remainingTime, break: 0 });
    }
    
    setCycles(newCycles);
  };

  const startCycle = () => {
    if (currentCycle < cycles.length) {
      setIsActive(true);
      const time = isStudying ? cycles[currentCycle].study : cycles[currentCycle].break;
      setTimer(setTimeout(() => {
        setIsStudying(!isStudying);
        if (!isStudying) {
          setCurrentCycle(currentCycle + 1);
        }
      }, time * 60000));
    } 
  };

  const savePomodoroSession = async () => {
    try {
      const totalStudyTime = cycles.reduce((acc, cycle) => acc + cycle.study, 0);
      const totalBreakTime = cycles.reduce((acc, cycle) => acc + cycle.break, 0);
      
      const pomodoroData = {
        studyTime,
        breakTime,
        totalTime: totalStudyTime + totalBreakTime,
        completed: currentCycle >= cycles.length,
        timestamp: new Date().toISOString()
      };
      
      await axiosInstance.post('/pomodoros', pomodoroData);
      fetchPomodoroHistory(); // Refresh history
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
    }
  };

  const resetCycle = () => {
    if (timer) clearTimeout(timer);
    setCurrentCycle(0);
    setIsStudying(true);
    setIsActive(false);
  };

  const endCycle = () => {
    if (timer) clearTimeout(timer);
    setCurrentCycle(cycles.length);
    savePomodoroSession();
    setIsActive(false);
    
    // If from calendar, update the progress
    if (fromCalendar && eventId) {
      updateStudyCycleProgress();
    }
  };

  useEffect(() => {
    if (currentCycle < cycles.length) {
      const time = isStudying ? cycles[currentCycle].study : cycles[currentCycle].break;
      const notification = isStudying ? 'Study time!' : 'Break time!';
      alert(notification);
      setTimer(setTimeout(() => {
        setIsStudying(!isStudying);
        if (!isStudying) {
          setCurrentCycle(currentCycle + 1);
        }
      }, time * 60000));
    } else if (cycles.length > 0 && currentCycle === cycles.length) {
      alert('All cycles completed!');
      setIsActive(false);
      savePomodoroSession();
    } 
  }, [currentCycle, isStudying]);

  // Update study cycle progress in the event
  const updateStudyCycleProgress = async () => {
    if (eventId && fromCalendar) {
      try {
        await axiosInstance.patch(`/study-cycles/${eventId}/progress`, {
          completedCycles: currentCycle,
          lastProgress: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating study cycle progress:', error);
      }
    }
  };

  // Update the progress whenever the current cycle changes
  useEffect(() => {
    if (fromCalendar && eventId && currentCycle > initialCompletedCycles) {
      updateStudyCycleProgress();
    }
  }, [currentCycle, fromCalendar, eventId]);

  return (
    <Grid 
      container
      className={isActive ? (isStudying ? 'study-animation' : 'break-animation') : ''}
      sx={{ minHeight: '100vh', padding: 3 }}
    >
      <Grid sx={{ mr: 'auto', ml: 'auto' }} maxWidth={'sm'}>
      
      {/* Show info if coming from calendar */}
      {fromCalendar && (
        <Box mb={4} p={2} border="1px solid #673ab7" borderRadius={1} bgcolor="#f3e5f5">
          <Typography variant="h6" gutterBottom>
            Study Cycle from Calendar
          </Typography>
          <Typography variant="body1">
            Progress: {currentCycle} of {cycles.length} cycles completed
          </Typography>
          {currentCycle > 0 && (
            <Typography variant="body2">
              You've completed {Math.floor((currentCycle / cycles.length) * 100)}% of your study goal!
            </Typography>
          )}
        </Box>
      )}
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Pomodoro Timer</Typography>
        <TextField
          label="Study Time (minutes)"
          type="number"
          value={studyTime}
          onChange={(e) => setStudyTime(parseInt(e.target.value) || 0)}
          fullWidth
          margin="normal"
          error={error.includes('Study time')}
          InputProps={{ inputProps: { min: 1 } }}
        />
        <TextField
          label="Break Time (minutes)"
          type="number"
          value={breakTime}
          onChange={(e) => setBreakTime(parseInt(e.target.value) || 0)}
          fullWidth
          margin="normal"
          error={error.includes('break time')}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <TextField
          label="Total Time (minutes or HH:MM)"
          value={totalTime}
          onChange={(e) => setTotalTime(e.target.value)}
          fullWidth
          margin="normal"
          error={!!error && !error.includes('Study time') && !error.includes('break time')}
          helperText={error && !error.includes('Study time') && !error.includes('break time') ? error : ''}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={calculateCycles}
          disabled={!totalTime || studyTime <= 0}
        >
          Calculate Cycles
        </Button>
        {error && error.includes('Study time') && (
          <FormHelperText error>{error}</FormHelperText>
        )}
      </Box>
      
      {/* Display Calculated Cycles */}
      {cycles.length > 0 && (
        <Box mb={4} p={2} border="1px solid #ddd" borderRadius={1} bgcolor="#f5f5f5">
          <Typography variant="h6" gutterBottom>Calculated Cycles:</Typography>
          {cycles.map((cycle, index) => (
            <Box key={index} mb={1}>
              <Typography variant="body2">
                Cycle {index + 1}: {cycle.study} min study + {cycle.break} min break
              </Typography>
            </Box>
          ))}
          <Typography variant="body1" mt={1}>
            Total: {cycles.reduce((acc, cycle) => acc + cycle.study + cycle.break, 0)} minutes
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={2} mb={2}>
        <Grid sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={startCycle}>Start Cycle</Button>
          <Button variant="contained" color="secondary" onClick={resetCycle}>Reset Cycle</Button>
          <Button variant="contained" color="error" onClick={endCycle}>End Cycle</Button>
        </Grid>
      </Grid>
      
      {/* Pomodoro History Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Pomodoro History</Typography>
        {pomodoroHistory.length > 0 ? (
          <Box>
            {pomodoroHistory.map((session, index) => (
              <Box 
                key={index} 
                p={2} 
                mb={2} 
                border="1px solid #ddd" 
                borderRadius={1}
                bgcolor={session.completed ? "#e8f5e9" : "#fff3e0"}
              >
                <Typography variant="body1">
                  {new Date(session.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Study: {session.studyTime} mins, Break: {session.breakTime} mins
                </Typography>
                <Typography variant="body2">
                  Status: {session.completed ? "Completed" : "Incomplete"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1">No pomodoro sessions recorded yet.</Typography>
        )}
      </Box>
      </Grid>
    </Grid>
  );
};

export default Pomodoro;
