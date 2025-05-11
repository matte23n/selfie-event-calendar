import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Select, MenuItem } from '@mui/material';
import axiosInstance from './api/axiosInstance';
import StudyCycleForm from './components/StudyCycleForm';

// Interfaces
export interface CalendarEvent {
  id?: number;
  title?: string;
  startDate: Date;
  endDate: Date;
  desc?: string;
  isAllDay?: boolean;
  isRepeatable?: boolean;
  frequency?: string;
  repeatCount?: number;
  repeatUntil?: string;
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
    desc: '',
    isAllDay: false,
    isRepeatable: false,
  });
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    startDate: new Date(),
    dueDate: new Date(),
    completed: false
  });

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axiosInstance.post('/events', newEvent);
    setShowEventForm(false);
    // Reset form
    setNewEvent({
      title: '',
      startDate: new Date(),
      endDate: new Date(),
      desc: '',
      isAllDay: false,
      isRepeatable: false,
    });
    // Refresh calendar events if callback provided
    if (refreshCallbacks?.refreshEvents) {
      refreshCallbacks.refreshEvents();
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
      <Dialog open={showEventForm} onClose={() => setShowEventForm(false)}>
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
            InputLabelProps={{ shrink: true }}
            value={newEvent.startDate.toISOString().slice(0, 16)}
            onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
          />
          <TextField
            label="End Date"
            type="datetime-local"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newEvent.endDate.toISOString().slice(0, 16)}
            onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
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
          {newEvent.isRepeatable && (
            <>
              <Select
                fullWidth
                margin="dense"
                value={newEvent.frequency || ''}
                onChange={(e) => setNewEvent({ ...newEvent, frequency: e.target.value })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
              <TextField
                label="Repeat Count"
                type="number"
                fullWidth
                margin="normal"
                value={newEvent.repeatCount || ''}
                onChange={(e) => setNewEvent({ ...newEvent, repeatCount: parseInt(e.target.value) })}
              />
              <TextField
                label="Repeat Until"
                type="datetime-local"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={newEvent.repeatUntil || ''}
                onChange={(e) => setNewEvent({ ...newEvent, repeatUntil: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventForm(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleEventSubmit} color="primary">
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
