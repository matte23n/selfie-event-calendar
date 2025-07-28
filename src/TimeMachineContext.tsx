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

  const updateTime = (newTime: Date) => {
    const newDay = new Date(newTime).setHours(0, 0, 0, 0);
    const oldDay = new Date(currentTime).setHours(0, 0, 0, 0);
    
    setCurrentTime(newTime);
    
    if (newDay !== oldDay) {
      notificationService.notifyDateChange(newTime);
      setPreviousDay(newDay);
      
      window.dispatchEvent(new CustomEvent('timeMachineChanged', {
        detail: { newDate: newTime }
      }));
    }
  };

  useEffect(() => {
    const unsubscribe = timeMachineService.addListener((time) => {
      setCurrentTime(new Date(time));
    });
    
    const interval = setInterval(() => {
      if (timeMachineService.isUsingSystemTime()) {
        setCurrentTime(new Date());
      }
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const currentDay = new Date(currentTime).setHours(0, 0, 0, 0);
    
    if (currentDay !== previousDay) {
      notificationService.notifyDateChange(currentTime);
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
