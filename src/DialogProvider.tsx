import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Select, MenuItem, IconButton, Typography, Divider, FormControl, InputLabel, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Tooltip, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axiosInstance from './api/axiosInstance';
import StudyCycleForm from './components/StudyCycleForm';
import { NotificationSetting, NotificationType, RepeatSetting } from './types/models';
import eventNotificationService from './services/EventNotificationService';

// Interfaces
export interface CalendarEvent {
  id?: number;
  title: string;
  startDate: Date;
  endDate: Date;
  desc?: string;
  place?: string;
  isAllDay?: boolean;
  isRepeatable?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  repeatCount?: number;
  repeatUntil?: string;
  notifications?: NotificationSetting[];
  invitedUsers?: string[];
}

export interface Task {
  id?: number;
  title?: string;
  startDate: Date;
  dueDate: Date;
  completed: boolean;
}

interface DialogContextType {
  showEventForm: boolean;
  setShowEventForm: (show: boolean) => void;
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean) => void;
  showStudyCycleForm: boolean;
  setShowStudyCycleForm: (show: boolean) => void;
  refreshEvents?: () => void;
  refreshTasks?: () => void;
}

const DialogContext = createContext<DialogContextType>({
  showEventForm: false,
  setShowEventForm: () => {},
  showTaskForm: false,
  setShowTaskForm: () => {},
  showStudyCycleForm: false,
  setShowStudyCycleForm: () => {},
});

export const useDialogContext = () => useContext(DialogContext);

export const DialogProvider: React.FC<{children: ReactNode, refreshCallbacks?: {refreshEvents?: () => void, refreshTasks?: () => void}}> = ({ children, refreshCallbacks }) => {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showStudyCycleForm, setShowStudyCycleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState<CalendarEvent>({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    place: '',
    desc: '',
    isAllDay: false,
    isRepeatable: false,
    notifications: [],
    invitedUsers: []
  });
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    startDate: new Date(),
    dueDate: new Date(),
    completed: false
  });

  // New state for notifications and invitations
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationSetting>({
    type: 'system',
    advanceTime: 15,
    advanceUnit: 'minute'
  });
  const [newInvitee, setNewInvitee] = useState('');

  // Function to add notification to event
  const addNotification = () => {
    const notifications = [...(newEvent.notifications || [])];
    notifications.push({...currentNotification});
    setNewEvent({...newEvent, notifications});
    
    // Reset notification form
    setCurrentNotification({
      type: 'system',
      advanceTime: 15,
      advanceUnit: 'minute'
    });
    setShowNotificationForm(false);
  };

  // Function to remove notification
  const removeNotification = (index: number) => {
    const notifications = [...(newEvent.notifications || [])];
    notifications.splice(index, 1);
    setNewEvent({...newEvent, notifications});
  };

  // Function to add an invitee
  const addInvitee = () => {
    if (!newInvitee.trim()) return;
    
    const invitedUsers = [...(newEvent.invitedUsers || [])];
    invitedUsers.push(newInvitee.trim());
    setNewEvent({...newEvent, invitedUsers});
    setNewInvitee('');
  };

  // Function to remove an invitee
  const removeInvitee = (index: number) => {
    const invitedUsers = [...(newEvent.invitedUsers || [])];
    invitedUsers.splice(index, 1);
    setNewEvent({...newEvent, invitedUsers});
  };

  // Helper function to format notification text
  const getNotificationText = (notification: NotificationSetting): string => {
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

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...newEvent,
        startDate: newEvent.startDate.toISOString(),
        endDate: newEvent.endDate.toISOString()
      };
      
      const response = await axiosInstance.post('/events', eventData);
      
      // Schedule notification for the newly created event
      if (response.data && response.data.insertedId && newEvent.notifications && newEvent.notifications.length > 0) {
        // Create a properly formatted event object with the new ID
        const eventWithId = {
          ...eventData,
          _id: response.data.insertedId
        };
        
      }
      
      setShowEventForm(false);
      
      // Reset form
      setNewEvent({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        desc: '',
        isAllDay: false,
        isRepeatable: false,
        notifications: [],
        invitedUsers: []
      });
      
      // Refresh calendar events if callback provided
      if (refreshCallbacks?.refreshEvents) {
        refreshCallbacks.refreshEvents();
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/activities', {
        ...newTask,
        startDate: newTask.startDate.toISOString(),
        dueDate: newTask.dueDate.toISOString()
      });
      setShowTaskForm(false);
      // Reset form
      setNewTask({
        title: '',
        startDate: new Date(),
        dueDate: new Date(),
        completed: false
      });
      // Refresh tasks if callback provided
      if (refreshCallbacks?.refreshTasks) {
        refreshCallbacks.refreshTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <DialogContext.Provider value={{ 
      showEventForm, 
      setShowEventForm, 
      showTaskForm, 
      setShowTaskForm,
      showStudyCycleForm,
      setShowStudyCycleForm,
      refreshEvents: refreshCallbacks?.refreshEvents,
      refreshTasks: refreshCallbacks?.refreshTasks
    }}>
      {children}
      
      {/* Global Event Form Dialog */}
      <Dialog open={showEventForm} onClose={() => setShowEventForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <TextField
            label="Start Date"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={ new Date(newEvent.startDate.getTime() - (newEvent.startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
            onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
          />
          <TextField
            label="End Date"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={ new Date(newEvent.endDate.getTime() - (newEvent.startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
            onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={newEvent.desc}
            onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newEvent.isAllDay || false}
                onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
              />
            }
            label="All Day"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newEvent.isRepeatable || false}
                onChange={(e) => setNewEvent({ ...newEvent, isRepeatable: e.target.checked })}
              />
            }
            label="Repeatable"
          />
          
          {/* Repeatable event options */}
          {newEvent.isRepeatable && (
            <Box sx={{ ml: 3, mt: 1, mb: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={newEvent.frequency || 'daily'}
                  onChange={(e) => setNewEvent({ ...newEvent, frequency: e.target.value })}
                  label="Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Repeat Count"
                type="number"
                fullWidth
                margin="normal"
                value={newEvent.repeatCount || ''}
                onChange={(e) => setNewEvent({ ...newEvent, repeatCount: parseInt(e.target.value) })}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Or specify an end date:
              </Typography>
              <TextField
                label="Repeat Until"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={newEvent.repeatUntil?.slice(0, 10) || ''}
                onChange={(e) => setNewEvent({ ...newEvent, repeatUntil: e.target.value })}
              />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          
          {/* Notifications Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} /> Notifications
            </Typography>
            
            {/* List of configured notifications */}
            {(newEvent.notifications || []).length > 0 ? (
              <List dense>
                {(newEvent.notifications || []).map((notification, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={getNotificationText(notification)} />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => removeNotification(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
                No notifications configured
              </Typography>
            )}
            
            {/* Add notification button */}
            {!showNotificationForm ? (
              <Button 
                startIcon={<AddIcon />} 
                onClick={() => setShowNotificationForm(true)}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Notification
              </Button>
            ) : (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>New Notification</Typography>
                
                <FormControl fullWidth margin="dense">
                  <InputLabel>Notification Type</InputLabel>
                  <Select
                    value={currentNotification.type}
                    onChange={(e) => setCurrentNotification({ 
                      ...currentNotification, 
                      type: e.target.value as NotificationType 
                    })}
                    label="Notification Type"
                  >
                    <MenuItem value="system">System Notification</MenuItem>
                    <MenuItem value="alert">Alert</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    {/* <MenuItem value="whatsapp">WhatsApp</MenuItem> */}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                  <TextField
                    label="Time"
                    type="number"
                    value={currentNotification.advanceTime}
                    onChange={(e) => setCurrentNotification({
                      ...currentNotification,
                      advanceTime: parseInt(e.target.value) || 0
                    })}
                    sx={{ flex: 1 }}
                  />
                  
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={currentNotification.advanceUnit}
                      onChange={(e) => setCurrentNotification({
                        ...currentNotification,
                        advanceUnit: e.target.value as 'minute' | 'hour' | 'day'
                      })}
                      label="Unit"
                      disabled={currentNotification.advanceTime === 0}
                    >
                      <MenuItem value="minute">Minute(s)</MenuItem>
                      <MenuItem value="hour">Hour(s)</MenuItem>
                      <MenuItem value="day">Day(s)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Repeat</InputLabel>
                  <Select
                    value={currentNotification.repeat?.type || 'none'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'none') {
                        const { repeat, ...rest } = currentNotification;
                        setCurrentNotification(rest);
                      } else {
                        let repeatSetting: RepeatSetting;
                        
                        switch(value) {
                          case 'count':
                            repeatSetting = { type: 'count', count: 3 };
                            break;
                          case 'interval':
                            repeatSetting = { type: 'interval', interval: 15 };
                            break;
                          case 'until-response':
                            repeatSetting = { type: 'until-response', responded: false };
                            break;
                          default:
                            return;
                        }
                        
                        setCurrentNotification({
                          ...currentNotification,
                          repeat: repeatSetting
                        });
                      }
                    }}
                    label="Repeat"
                  >
                    <MenuItem value="none">No Repetition</MenuItem>
                    <MenuItem value="count">Repeat X Times</MenuItem>
                    <MenuItem value="interval">Repeat Every X Minutes</MenuItem>
                    <MenuItem value="until-response">Repeat Until Response</MenuItem>
                  </Select>
                </FormControl>
                
                {currentNotification.repeat?.type === 'count' && (
                  <TextField
                    label="Number of Repetitions"
                    type="number"
                    value={currentNotification.repeat.count}
                    onChange={(e) => setCurrentNotification({
                      ...currentNotification,
                      repeat: {
                        ...currentNotification.repeat as RepeatSetting,
                        count: parseInt(e.target.value) || 1
                      }
                    })}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                )}
                
                {currentNotification.repeat?.type === 'interval' && (
                  <TextField
                    label="Interval (minutes)"
                    type="number"
                    value={currentNotification.repeat.interval}
                    onChange={(e) => setCurrentNotification({
                      ...currentNotification,
                      repeat: {
                        ...currentNotification.repeat as RepeatSetting,
                        interval: parseInt(e.target.value) || 5
                      }
                    })}
                    fullWidth
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                )}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={() => setShowNotificationForm(false)}>Cancel</Button>
                  <Button variant="contained" onClick={addNotification}>Add</Button>
                </Box>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Invitations Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAddIcon sx={{ mr: 1 }} /> Invite Others
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
              <TextField
                label="Email or Username"
                value={newInvitee}
                onChange={(e) => setNewInvitee(e.target.value)}
                fullWidth
              />
              <Button 
                variant="contained" 
                onClick={addInvitee}
                sx={{ minWidth: '100px' }}
              >
                Add
              </Button>
            </Box>
            
            {/* List of invitees */}
            {(newEvent.invitedUsers || []).length > 0 ? (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(newEvent.invitedUsers || []).map((user, index) => (
                  <Chip
                    key={index}
                    label={user}
                    onDelete={() => removeInvitee(index)}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ my: 1 }}>
                No invitees added
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventForm(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleEventSubmit} 
            color="primary"
            variant="contained"
            disabled={!newEvent.title?.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Task Form Dialog */}
      <Dialog open={showTaskForm} onClose={() => setShowTaskForm(false)}>
        <DialogTitle>Aggiungi Nuova Attività</DialogTitle>
        <DialogContent>
          <TextField
            label="Titolo"
            fullWidth
            margin="normal"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            label="Data di inizio"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newTask.startDate.toISOString().slice(0, 10)}
            onChange={(e) => setNewTask({ ...newTask, startDate: new Date(e.target.value) })}
          />
          <TextField
            label="Data di scadenza"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newTask.dueDate.toISOString().slice(0, 10)}
            onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTaskForm(false)} color="secondary">
            Annulla
          </Button>
          <Button onClick={handleTaskSubmit} color="primary">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Study Cycle Form Dialog */}
      <StudyCycleForm 
        open={showStudyCycleForm}
        onClose={() => setShowStudyCycleForm(false)}
        onSave={refreshCallbacks?.refreshEvents || (() => {})}
        date={selectedDate}
      />
    </DialogContext.Provider>
  );
};
