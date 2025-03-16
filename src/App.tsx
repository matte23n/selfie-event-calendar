import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { BrowserRouter, Routes, Route } from "react-router";
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import React, { useEffect, useState } from 'react';
import TimeMachineControl from './components/TimeMachineControl';
import Pomodoro from './Pomodoro';
import Note from './Note';
import Progetti from './Progetti';
import MyCalendar from './Calendar';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
//    const subscription = timeMachineService.currentTime$.subscribe(setCurrentTime);
  //  return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Aggiorna le view in base alla nuova data e ora
    // ...existing code...
  }, [currentTime]);

  return (
    <div>
      <TimeMachineControl />
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/calendario" element={<MyCalendar/>} />
        <Route path="/pomodoro" element={<Pomodoro/>} />
        <Route path="/note" element={<Note/>} />
        <Route path="/progetti" element={<Progetti/>} />
        <Route path="/" element={<Home/>} />
      </Routes>
    </div>
  );
};

export default App;
