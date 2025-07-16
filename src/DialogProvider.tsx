import React, { createContext, useState, useContext, ReactNode } from 'react';
import { NotificationSetting, NotificationType, RepeatSetting } from './types/models';
import EventForm from './components/EventForm';
import TaskForm from './components/TaskForm';
import StudyCycleForm from './components/StudyCycleForm';

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
  setShowEventForm: (show: boolean, initialData?: Partial<CalendarEvent>) => void;
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean, initialData?: Partial<Task>) => void;
  showStudyCycleForm: boolean;
  setShowStudyCycleForm: (show: boolean, date?: Date) => void;
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
  // State for controlling dialogs visibility
  const [showEventForm, setShowEventFormState] = useState(false);
  const [showTaskForm, setShowTaskFormState] = useState(false);
  const [showStudyCycleForm, setShowStudyCycleFormState] = useState(false);
  
  // State for storing initial data for forms
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEvent> | undefined>();
  const [taskFormData, setTaskFormData] = useState<Partial<Task> | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Enhanced show form functions that accept initial data
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

  const setShowStudyCycleForm = (show: boolean, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowStudyCycleFormState(show);
  };

  // Handle form close actions
  const handleEventFormClose = () => {
    setShowEventFormState(false);
    setEventFormData(undefined);
  };

  const handleTaskFormClose = () => {
    setShowTaskFormState(false);
    setTaskFormData(undefined);
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
      
      {/* Event Form Dialog */}
      <EventForm
        open={showEventForm}
        onClose={handleEventFormClose}
        onSave={refreshCallbacks?.refreshEvents || (() => {})}
        initialData={eventFormData}
      />

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onClose={handleTaskFormClose}
        onSave={refreshCallbacks?.refreshTasks || (() => {})}
        initialData={taskFormData}
      />
      
      {/* Study Cycle Form Dialog */}
      <StudyCycleForm 
        open={showStudyCycleForm}
        onClose={() => setShowStudyCycleFormState(false)}
        onSave={refreshCallbacks?.refreshEvents || (() => {})}
        date={selectedDate}
      />
    </DialogContext.Provider>
  );
};
