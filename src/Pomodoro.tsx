import React, { useState, useEffect } from 'react';
import { Button, Container, Grid2 as Grid, Box, TextField, Typography } from '@mui/material';
import './Pomodoro.css';
import axiosInstance from './api/axiosInstance';

interface cycle {
  study: number;
  break: number;
}

const Pomodoro = () => {
  const [studyTime, setStudyTime] = useState(30);
  const [breakTime, setBreakTime] = useState(5);
  const [totalTime, setTotalTime] = useState('');
  const [cycles, setCycles] = useState<cycle[]>([]);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isStudying, setIsStudying] = useState(true);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [pomodoroHistory, setPomodoroHistory] = useState<any[]>([]);

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
    let totalMinutes = parseInt(totalTime);
    if (isNaN(totalMinutes)) {
      const [hours, minutes] = totalTime.split(':').map(Number);
      totalMinutes = (hours * 60) + minutes;
    }
    const cycleTime = studyTime + breakTime;
    const numCycles = Math.floor(totalMinutes / cycleTime);
    const remainingTime = totalMinutes % cycleTime;
    const cycles = Array(numCycles).fill({ study: studyTime, break: breakTime });
    if (remainingTime > 0) {
      cycles.push({ study: remainingTime, break: 0 });
    }
    setCycles(cycles);
  };

  const startCycle = () => {
    if (currentCycle < cycles.length) {
      const time = isStudying ? cycles[currentCycle].study : cycles[currentCycle].break;
      setTimer(setTimeout(() => {
        setIsStudying(!isStudying);
        if (!isStudying) {
          setCurrentCycle(currentCycle + 1);
        }
        startCycle();
      }, time * 60000));
    } else {
      // Save completed pomodoro to backend
      savePomodoroSession();
      alert('All cycles completed!');
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
  };

  const endCycle = () => {
    if (timer) clearTimeout(timer);
    setCurrentCycle(cycles.length);
    savePomodoroSession();
  };

  useEffect(() => {
    if (currentCycle < cycles.length) {
      const notification = isStudying ? 'Study time!' : 'Break time!';
      alert(notification);
    }
  }, [currentCycle, isStudying]);

  return (
    <Container maxWidth="sm">
      <Box mb={4} className={isStudying ? 'study-animation' : 'break-animation'}>
        <Typography variant="h4" gutterBottom>Pomodoro Timer</Typography>
        <TextField
          label="Study Time (minutes)"
          type="number"
          value={studyTime}
          onChange={(e) => setStudyTime(parseInt(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Break Time (minutes)"
          type="number"
          value={breakTime}
          onChange={(e) => setBreakTime(parseInt(e.target.value))}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Total Time (minutes or HH:MM)"
          value={totalTime}
          onChange={(e) => setTotalTime(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={calculateCycles}>Calculate Cycles</Button>
      </Box>
      
      <Grid container spacing={2}>
        <Grid>
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
    </Container>
  );
};

export default Pomodoro;
