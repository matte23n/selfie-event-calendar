import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NotificationSetting } from './types/models';
import EventForm from './components/EventForm';
import TaskForm from './components/TaskForm';
import StudyCycleForm from './components/StudyCycleForm';

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
  setShowEventForm: (show: boolean, initialData?: Partial<CalendarEvent>) => void;
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean, initialData?: Partial<Task>) => void;
  showStudyCycleForm: boolean;
  setShowStudyCycleForm: (show: boolean, date?: Date) => void;
  setRefreshCallbacks: (callbacks: { refreshEvents: () => void, refreshTasks: () => void }) => void;
}

const DialogContext = createContext<DialogContextType>({
  showEventForm: false,
  setShowEventForm: () => {},
  showTaskForm: false,
  setShowTaskForm: () => {},
  showStudyCycleForm: false,
  setShowStudyCycleForm: () => {},
  setRefreshCallbacks: () => {}
});

export const useDialogContext = () => useContext(DialogContext);

export const DialogProvider: React.FC<{children: ReactNode}> = ({ children,  }) => {
  const [showEventForm, setShowEventFormState] = useState(false);
  const [showTaskForm, setShowTaskFormState] = useState(false);
  const [showStudyCycleForm, setShowStudyCycleFormState] = useState(false);
  const [refreshCallbacks, setRefreshCallbacksState] = useState<{refreshEvents: () => void, refreshTasks: () => void}>();
  
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEvent> | undefined>();
  const [taskFormData, setTaskFormData] = useState<Partial<Task> | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const setShowEventForm = (show: boolean, initialData?: Partial<CalendarEvent>) => {
    if (initialData) {
      setEventFormData(initialData);
    }
    setShowEventFormState(show);
  };

  const setShowTaskForm = (show: boolean, initialData?: Partial<Task>) => {
    if (initialData) {
      setTaskFormData(initialData);
    }
    setShowTaskFormState(show);
  };

  const setRefreshCallbacks = (callbacks: {refreshEvents: () => void, refreshTasks: () => void}) => {
    setRefreshCallbacksState(callbacks);
  }

  const setShowStudyCycleForm = (show: boolean, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowStudyCycleFormState(show);
  };

  const handleEventFormClose = () => {
    setShowEventFormState(false);
    setEventFormData(undefined);
    refreshCallbacks?.refreshEvents();
  };

  const handleTaskFormClose = () => {
    setShowTaskFormState(false);
    setTaskFormData(undefined);
    
      refreshCallbacks?.refreshTasks();
    
  };

  return (
    <DialogContext.Provider value={{ 
      showEventForm, 
      setShowEventForm, 
      showTaskForm, 
      setShowTaskForm,
      showStudyCycleForm,
      setShowStudyCycleForm,
      setRefreshCallbacks
    }}>
      {children}
      
      <EventForm
        open={showEventForm}
        onClose={handleEventFormClose}
        onSave={refreshCallbacks?.refreshEvents}
        initialData={eventFormData}
      />

      <TaskForm
        open={showTaskForm}
        onClose={handleTaskFormClose}
        onSave={refreshCallbacks?.refreshTasks}
        initialData={taskFormData}
      />
      
      <StudyCycleForm 
        open={showStudyCycleForm}
        onClose={() => setShowStudyCycleFormState(false)}
        onSave={refreshCallbacks?.refreshEvents}
        date={selectedDate}
      />
    </DialogContext.Provider>
  );
};
