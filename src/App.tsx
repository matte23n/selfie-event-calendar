import './App.css';
import MyCalendar from './MyCalendar';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { BrowserRouter, Routes, Route } from "react-router";
import Login from './Login';
import Signup from './Signup';
import Home from './Home';

function App() {
  return (
    <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/" element={<Home/>} />
    </Routes>
  );
}

export default App;
