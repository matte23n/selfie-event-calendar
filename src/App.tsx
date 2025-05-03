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
import { useAuth } from './AuthProvider';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  /*useEffect(() => {
    // Aggiorna le view in base alla nuova data e ora
  }, [currentTime]);*/

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
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
            <MyCalendar />
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
