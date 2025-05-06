import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Container, Grid2 as Grid, Box, Typography, Card, CardContent } from '@mui/material';
import axiosInstance from './api/axiosInstance';
import { Event, Note, Activity, Pomodoro, Project } from './types/models';

function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [lastPomodoro, setLastPomodoro] = useState<Pomodoro | null>(null);
  const [projectDeadlines, setProjectDeadlines] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        try {
          const eventsResponse = await axiosInstance.get('/events');
          if (eventsResponse.data && eventsResponse.data.length > 0) {
            setEvents(eventsResponse.data.slice(0, 3));
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }

        // Fetch notes
        try {
          const notesResponse = await axiosInstance.get('/notes');
          if (notesResponse.data && notesResponse.data.length > 0) {
            setLatestNote(notesResponse.data[0]);
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
        }

        // Fetch activities
        try {
          const activitiesResponse = await axiosInstance.get('/activities');
          if (activitiesResponse.data && activitiesResponse.data.length > 0) {
            setUpcomingActivities(activitiesResponse.data.slice(0, 3));
          }
        } catch (error) {
          console.error('Error fetching activities:', error);
        }

        // Mock pomodoro data - this endpoint doesn't exist yet
        setLastPomodoro({
          studyTime: 25,
          breakTime: 5,
          completed: true,
          timestamp: new Date().toISOString()
        });

        // Mock project deadlines - this endpoint doesn't exist yet
        setProjectDeadlines([
          {
            name: "Final Project",
            deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            status: 'in-progress'
          },
          {
            name: "Team Presentation",
            deadline: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            status: 'not-started'
          }
        ]);
      } catch (error) {
        console.error('Error in data fetching:', error);
      }
    };

    fetchData();
  }, []);

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
      <Box className='flex flex-col items-center w-full'>
        <Typography variant="h5" gutterBottom>Preview</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Upcoming Events</Typography>
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <Typography key={index} variant="body2">
                      {event.title} - {new Date(event.startDate).toLocaleString()}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">No upcoming events</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Latest Note</Typography>
                {latestNote ? (
                  <Typography variant="body2">{latestNote.title}</Typography>
                ) : (
                  <Typography variant="body2">No notes available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Upcoming Activities</Typography>
                {upcomingActivities.length > 0 ? (
                  upcomingActivities.map((activity, index) => (
                    <Typography key={index} variant="body2">
                      {activity.description} - Due: {new Date(activity.dueDate).toLocaleString()}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">No upcoming activities</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Last Pomodoro</Typography>
                {lastPomodoro ? (
                  <Typography variant="body2">
                    {lastPomodoro.studyTime} mins study, {lastPomodoro.breakTime} mins break
                  </Typography>
                ) : (
                  <Typography variant="body2">No pomodoro data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Project Deadlines</Typography>
                {projectDeadlines.length > 0 ? (
                  projectDeadlines.map((project, index) => (
                    <Typography key={index} variant="body2">
                      {project.name} - Due: {new Date(project.deadline).toLocaleString()}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">No project deadlines</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Home;
