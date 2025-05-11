import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { timeMachineService } from './services/TimeMachineService';

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

  const contextValue = {
    currentTime,
    setTime: (newTime: Date) => timeMachineService.setTime(newTime),
    moveForward: (minutes: number) => timeMachineService.moveForward(minutes),
    moveBackward: (minutes: number) => timeMachineService.moveBackward(minutes),
    resetToSystemTime: () => timeMachineService.resetToSystemTime(),
    isInFuture: (date: Date) => timeMachineService.isInFuture(date),
    isInPast: (date: Date) => timeMachineService.isInPast(date),
    isToday: (date: Date) => timeMachineService.isToday(date),
  };

  return (
    <TimeMachineContext.Provider value={contextValue}>
      {children}
    </TimeMachineContext.Provider>
  );
};

export const useTimeMachine = () => useContext(TimeMachineContext);
