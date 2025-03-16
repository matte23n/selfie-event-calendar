import React from 'react';
import MyCalendar from './Calendar';
import { Link } from 'react-router';
import { Button, Container, Grid2 as Grid, Box } from '@mui/material';

function Home() {
  return (
    <Container maxWidth="lg" className='h-screen flex flex-col items-center justify-center'>
      <Box mb={4}>
        <Grid container spacing={2} justifyContent="center">
          <Grid>
            <Button variant="contained" color="primary" component={Link} to='/calendario'>
              Calendario
            </Button>
          </Grid>
          <Grid>
            <Button variant="contained" color="secondary" component={Link} to='/pomodoro'>
              Pomodoro
            </Button>
          </Grid>
          <Grid>
            <Button variant="contained" color="warning" component={Link} to='/note'>
              Note
            </Button>
          </Grid>
          <Grid>
            <Button variant="contained" color="success" component={Link} to='/progetti'>
              Progetti
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Box className='flex items-center justify-center w-full'>
        <MyCalendar />
      </Box>
    </Container>
  );
}

export default Home;
