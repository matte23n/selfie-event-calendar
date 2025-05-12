import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { timeMachineService } from './services/TimeMachineService';
import notificationService from './services/NotificationService';

interface TimeMachineContextType {
  currentTime: Date;
  setTime: (newTime: Date) => void;
  moveForward: (minutes: number) => void;
  moveBackward: (minutes: number) => void;
  resetToSystemTime: () => void;
  isInFuture: (date: Date) => boolean;
  isInPast: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
}

const TimeMachineContext = createContext<TimeMachineContextType>({
  currentTime: new Date(),
  setTime: () => {},
  moveForward: () => {},
  moveBackward: () => {},
  resetToSystemTime: () => {},
  isInFuture: () => false,
  isInPast: () => false,
  isToday: () => false,
});

export const TimeMachineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(timeMachineService.getCurrentTime());
  const [previousDay, setPreviousDay] = useState(new Date(currentTime).setHours(0, 0, 0, 0));

  // Function to update the time and trigger notifications if the day changes
  const updateTime = (newTime: Date) => {
    const newDay = new Date(newTime).setHours(0, 0, 0, 0);
    const oldDay = new Date(currentTime).setHours(0, 0, 0, 0);
    
    // Update the current time
    setCurrentTime(newTime);
    
    // Check if the day has changed
    if (newDay !== oldDay) {
      // Send a notification about the date change
      notificationService.notifyDateChange(newTime);
      // Update previous day reference
      setPreviousDay(newDay);
      
      // Notify that we need to recalculate urgency levels for tasks
      window.dispatchEvent(new CustomEvent('timeMachineChanged', {
        detail: { newDate: newTime }
      }));
    }
  };

  // Listen for changes to the time
  useEffect(() => {
    const unsubscribe = timeMachineService.addListener((time) => {
      setCurrentTime(new Date(time)); // Ensure we're using a fresh date object
    });
    
    // Refresh time every minute to keep UI up to date
    const interval = setInterval(() => {
      // Only refresh if we're using system time
      if (timeMachineService.isUsingSystemTime()) {
        setCurrentTime(new Date());
      }
    }, 60000);

    // Cleanup listener and interval on unmount
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Handle date change notifications
  useEffect(() => {
    const currentDay = new Date(currentTime).setHours(0, 0, 0, 0);
    
    // Check if the day has changed
    if (currentDay !== previousDay) {
      // Notify about the date change
      notificationService.notifyDateChange(currentTime);
      
      // Update the previous day reference
      setPreviousDay(currentDay);
    }
  }, [currentTime, previousDay]);

  const contextValue = {
    currentTime,
    setTime: (newTime: Date) => {
      updateTime(newTime);
    },
    moveForward: (minutes: number) => {
      const newTime = new Date(currentTime);
      newTime.setMinutes(newTime.getMinutes() + minutes);
      updateTime(newTime);
    },
    moveBackward: (minutes: number) => {
      const newTime = new Date(currentTime);
      newTime.setMinutes(newTime.getMinutes() - minutes);
      updateTime(newTime);
    },
    resetToSystemTime: () => {
      updateTime(new Date());
    },
    isInFuture: (date: Date) => {
      return date.getTime() > currentTime.getTime();
    },
    isInPast: (date: Date) => {
      return date.getTime() < currentTime.getTime();
    },
    isToday: (date: Date) => {
      const d1 = date;
      const d2 = currentTime;
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    },
  };

  return (
    <TimeMachineContext.Provider value={contextValue}>
      {children}
    </TimeMachineContext.Provider>
  );
};

export const useTimeMachine = () => useContext(TimeMachineContext);
