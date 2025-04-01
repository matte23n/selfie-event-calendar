import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Routes, Route, Navigate } from "react-router";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Example: Replace this with your actual authentication logic
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []);

  useEffect(() => {
    // Aggiorna le view in base alla nuova data e ora
  }, [currentTime]);

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <div>
      <TimeMachineControl />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <MyCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pomodoro"
          element={
            <ProtectedRoute>
              <Pomodoro />
            </ProtectedRoute>
          }
        />
        <Route
          path="/note"
          element={
            <ProtectedRoute>
              <Note />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progetti"
          element={
            <ProtectedRoute>
              <Progetti />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
