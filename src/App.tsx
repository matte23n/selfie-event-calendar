import './App.css';
import MyCalendar from './MyCalendar';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {
  return (
    <div className='h-screen flex items-center justify-center /*bg-amber-400*/'>
      <MyCalendar />
    </div>
  );
}

export default App;
