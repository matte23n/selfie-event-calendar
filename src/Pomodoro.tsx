import React, { useState, useEffect } from 'react';
import { Button, Container, Grid2 as Grid, Box, TextField, Typography } from '@mui/material';
import './Pomodoro.css';

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
      alert('All cycles completed!');
    }
  };

  const resetCycle = () => {
    clearTimeout(timer!);
    setCurrentCycle(0);
    setIsStudying(true);
  };

  const endCycle = () => {
    clearTimeout(timer!);
    setCurrentCycle(cycles.length);
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
    </Container>
  );
};

export default Pomodoro;
