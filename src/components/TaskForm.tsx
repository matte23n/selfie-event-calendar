import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField 
} from '@mui/material';
import axiosInstance from '../api/axiosInstance';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Partial<Task>;
}

export interface Task {
  id?: number;
  title?: string;
  startDate: Date;
  dueDate: Date;
  completed: boolean;
}

const TaskForm = ({ open, onClose, onSave, initialData }: TaskFormProps) => {
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    startDate: new Date(),
    dueDate: new Date(),
    completed: false
  });

  // Initialize form with initial data when dialog opens
  useEffect(() => {
    if (open && initialData) {
      setNewTask({
        ...newTask,
        ...initialData
      });
    } else if (open) {
      // Reset to default values when opening without initial data
      setNewTask({
        title: '',
        startDate: new Date(),
        dueDate: new Date(),
        completed: false
      });
    }
  }, [open, initialData]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/activities', {
        ...newTask,
        startDate: newTask.startDate.toISOString(),
        dueDate: newTask.dueDate.toISOString()
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
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
          label="Data di Inizio"
          type="date"
          fullWidth
          margin="normal"
          value={new Date(newTask.startDate.getTime() - (newTask.startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)}
          onChange={(e) => setNewTask({ ...newTask, startDate: new Date(e.target.value) })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Data di Scadenza"
          type="date"
          fullWidth
          margin="normal"
          value={new Date(newTask.dueDate.getTime() - (newTask.dueDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)}
          onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value) })}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annulla
        </Button>
        <Button 
          onClick={handleTaskSubmit} 
          color="primary"
          disabled={!newTask.title?.trim()}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm;
