import React, { useState } from 'react';

const TimeMachineControl: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
//    timeMachineService.setTime(new Date(event.target.value));
  };

  const handleReset = () => {
    setDate(new Date().toISOString().slice(0, 16));
  //  timeMachineService.resetTime();
  };

  return (
    <div style={{ padding: '10px'}}>
      <input
        type="datetime-local"
        value={date}
        onChange={handleChange}
        style={{ marginRight: '10px' }} // Add margin between input and button
      />
      <button onClick={handleReset}>Reset to System Time</button>
    </div>
  );
};

export default TimeMachineControl;
