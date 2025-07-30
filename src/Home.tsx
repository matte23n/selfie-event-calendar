import React, { useEffect, useState } from 'react';
import { Container, Grid, Box, Typography, Card, CardContent } from '@mui/material';
import axiosInstance from './api/axiosInstance';
import { Event, Note, Activity, Pomodoro } from './types/models';
import { useTimeMachine } from './TimeMachineContext';

function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [latestNote, setLatestNote] = useState<Note | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [lastPomodoro, setLastPomodoro] = useState<Pomodoro | null>(null);
  const [loading, setLoading] = useState({
    events: true,
    notes: true,
    activities: true,
    pomodoro: true,
    projects: true
  });

  const { currentTime } = useTimeMachine();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        try {
          setLoading(prev => ({ ...prev, events: true }));
          const eventsResponse = await axiosInstance.get('/events');
          if (eventsResponse.data && eventsResponse.data.length > 0) {
            setEvents(eventsResponse.data.slice(0, 3));
          }
          setLoading(prev => ({ ...prev, events: false }));
        } catch (error) {
          console.error('Error fetching events:', error);
          setLoading(prev => ({ ...prev, events: false }));
        }

        // Fetch notes
        try {
          setLoading(prev => ({ ...prev, notes: true }));
          const notesResponse = await axiosInstance.get('/notes');
          if (notesResponse.data && notesResponse.data.length > 0) {
            const sortedNotes = notesResponse.data.sort((a: Note, b: Note) => {
              const dateA = a.lastMod ? new Date(a.lastMod) : new Date(a.lastMod);
              const dateB = b.lastMod ? new Date(b.lastMod) : new Date(b.lastMod);
              return dateB.getTime() - dateA.getTime();
            });
            setLatestNote(sortedNotes[0]);
          }
          setLoading(prev => ({ ...prev, notes: false }));
        } catch (error) {
          console.error('Error fetching notes:', error);
          setLoading(prev => ({ ...prev, notes: false }));
        }

        // Fetch activities
        try {
          setLoading(prev => ({ ...prev, activities: true }));
          const activitiesResponse = await axiosInstance.get('/activities');
          if (activitiesResponse.data && activitiesResponse.data.length > 0) {
            setUpcomingActivities(activitiesResponse.data.slice(0, 3));
          }
          setLoading(prev => ({ ...prev, activities: false }));
        } catch (error) {
          console.error('Error fetching activities:', error);
          setLoading(prev => ({ ...prev, activities: false }));
        }

        // Fetch pomodoro data - now using real backend API
        try {
          setLoading(prev => ({ ...prev, pomodoro: true }));
          const pomodoroResponse = await axiosInstance.get('/pomodoros/latest');
          if (pomodoroResponse.data) {
            setLastPomodoro(pomodoroResponse.data);
          }
          setLoading(prev => ({ ...prev, pomodoro: false }));
        } catch (error) {
          console.error('Error fetching pomodoro data:', error);
          setLoading(prev => ({ ...prev, pomodoro: false }));
        }
      } catch (error) {
        console.error('Error in data fetching:', error);
      }
    };

    fetchData();
  }, [currentTime]);

  return (
    <Container maxWidth="lg" className='flex flex-col items-center justify-center'>
      <Box className='flex flex-col items-center w-full'>
        <Typography variant="h5" gutterBottom>Preview</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Upcoming Events</Typography>
                {loading.events ? (
                  <Typography variant="body2">Loading...</Typography>
                ) : events.length > 0 ? (
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
                {loading.notes ? (
                  <Typography variant="body2">Loading...</Typography>
                ) : latestNote ? (
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
                {loading.activities ? (
                  <Typography variant="body2">Loading...</Typography>
                ) : upcomingActivities.length > 0 ? (
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
                {loading.pomodoro ? (
                  <Typography variant="body2">Loading...</Typography>
                ) : lastPomodoro ? (
                  <Typography variant="body2">
                    {lastPomodoro.studyTime} mins study, {lastPomodoro.breakTime} mins break
                  </Typography>
                ) : (
                  <Typography variant="body2">No pomodoro data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6">Project Deadlines</Typography>
                {loading.projects ? (
                  <Typography variant="body2">Loading...</Typography>
                ) : projectDeadlines.length > 0 ? (
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
          </Grid> */}
        </Grid>
      </Box>
    </Container>
  );
}

export default Home;
