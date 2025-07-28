import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Routes, Route, Navigate } from 'react-router';
import Navbar from './components/Navbar';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import React, { JSX } from 'react';
import Pomodoro from './Pomodoro';
import Note from './Note';
import Progetti from './Progetti';
import MyCalendar from './Calendar';
import { AuthProvider, useAuth } from './AuthProvider';
import { CalendarProvider } from './CalendarContext';
import { DialogProvider } from './DialogProvider';
import { TimeMachineProvider } from './TimeMachineContext';

const App: React.FC = () => {
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <AuthProvider>
      <TimeMachineProvider>
        <CalendarProvider>
          <DialogProvider>
            <div>
              <Navbar />
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
          </DialogProvider>
        </CalendarProvider>
      </TimeMachineProvider>
    </AuthProvider>
  );
};

export default App;
