import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CalendarContextType {
  showEventForm: boolean;
  setShowEventForm: (show: boolean) => void;
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean) => void;
}

const CalendarContext = createContext<CalendarContextType>({
  showEventForm: false,
  setShowEventForm: () => {},
  showTaskForm: false,
  setShowTaskForm: () => {},
});

export const CalendarProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  return (
    <CalendarContext.Provider value={{ 
      showEventForm, 
      setShowEventForm, 
      showTaskForm, 
      setShowTaskForm 
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => useContext(CalendarContext);
