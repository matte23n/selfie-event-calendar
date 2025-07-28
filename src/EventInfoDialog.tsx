import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Box, Divider, List, ListItem, ListItemText } from '@mui/material';
import { CalendarEvent } from './Calendar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';

interface EventInfoDialogProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent;
}

const getNotificationText = (notification: any): string => {
  let text = `${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} notification `;
  
  if (notification.advanceTime === 0) {
    text += 'at event time';
  } else {
    text += `${notification.advanceTime} ${notification.advanceUnit}${notification.advanceTime !== 1 ? 's' : ''} before`;
  }
  
  if (notification.repeat) {
    if (notification.repeat.type === 'count') {
      text += `, repeat ${notification.repeat.count} times`;
    } else if (notification.repeat.type === 'interval') {
      text += `, repeat every ${notification.repeat.interval} minutes`;
    } else {
      text += `, repeat until response`;
    }
  }
  
  return text;
};

const EventInfoDialog: React.FC<EventInfoDialogProps> = ({ open, onClose, event }) => {
  const formatDate = (date: Date): string => {
    const day = new Date(date).getDate().toString().padStart(2, '0');
    const month = (new Date(date).getMonth() + 1).toString().padStart(2, '0');
    const year = new Date(date).getFullYear();
    const hours = new Date(date).getHours().toString().padStart(2, '0');
    const minutes = new Date(date).getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{event.title}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">Start: {formatDate(event.startDate)}</Typography>
        <Typography variant="subtitle1">End: {formatDate(event.endDate)}</Typography>
        
        {event.isAllDay && (
          <Typography variant="subtitle1" color="primary">All Day Event</Typography>
        )}
        
        {event.isRepeatable && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <Typography variant="subtitle1" color="primary">
              Repeating Event: {event.frequency}
            </Typography>
            {event.repeatCount && (
              <Typography variant="body2">
                Repeats {event.repeatCount} times
              </Typography>
            )}
            {event.repeatUntil && (
              <Typography variant="body2">
                Repeats until {new Date(event.repeatUntil).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {event.desc && (
          <>
            <Typography variant="subtitle1">Description:</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.desc}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <NotificationsIcon sx={{ mr: 1 }} /> Notifications
          </Typography>
          
          {event.notifications && event.notifications.length > 0 ? (
            <List dense>
              {event.notifications.map((notification, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemText 
                    primary={getNotificationText(notification)} 
                    sx={{ py: 0.5 }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No notifications configured
            </Typography>
          )}
        </Box>
        
        <Box>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PeopleIcon sx={{ mr: 1 }} /> Invited Users
          </Typography>
          
          {event.invitedUsers && event.invitedUsers.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {event.invitedUsers.map((user, index) => (
                <Chip 
                  key={index} 
                  label={user.username} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No invited users
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventInfoDialog;

