import React, { useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, Typography
} from '@mui/material';
import axiosInstance from '../api/axiosInstance';

interface StudyCycleFormProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
    date?: Date;
}

const StudyCycleForm = ({ open, onClose, onSave, date = new Date() }: StudyCycleFormProps) => {
    const [title, setTitle] = useState('');
    const [studyTime, setStudyTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [totalCycles, setTotalCycles] = useState(4);
    const [selectedDate, setSelectedDate] = useState(
        new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    );
    const [startTime, setStartTime] = useState(
        new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    React.useEffect(() => {
        if (open) {
            setTitle('');
            setStudyTime(25);
            setBreakTime(5);
            setTotalCycles(4);
            setSelectedDate(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
            setStartTime(new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [open, date]);

    const handleSubmit = async () => {
        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const startDate = new Date(selectedDate);
            startDate.setHours(hours || 0, minutes || 0, 0);

            const totalMinutes = (studyTime + breakTime) * totalCycles;
            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + totalMinutes);

            const studyCycleEvent = {
                title,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                place: 'Study Place',
                isStudyCycle: true,
                studyCycleData: {
                    studyTime,
                    breakTime,
                    totalCycles,
                    completedCycles: 0,
                    lastProgress: new Date().toISOString()
                }
            };

            await axiosInstance.post('/study-cycles', studyCycleEvent);
            if (onSave) {
            onSave();
            }
            onClose();
        } catch (error) {
            console.error('Error creating study cycle:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Study Cycles</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Study Subject"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        label="Study Time (minutes)"
                        type="number"
                        fullWidth
                        value={studyTime}
                        onChange={(e) => setStudyTime(Number(e.target.value))}
                        margin="normal"
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        label="Break Time (minutes)"
                        type="number"
                        fullWidth
                        value={breakTime}
                        onChange={(e) => setBreakTime(Number(e.target.value))}
                        margin="normal"
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        label="Total Cycles"
                        type="number"
                        fullWidth
                        value={totalCycles}
                        onChange={(e) => setTotalCycles(Number(e.target.value))}
                        margin="normal"
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />        
                    <TextField
                        label="Start Time"
                        type="time"
                        fullWidth
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                            step: 300
                        }}
                    />

                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Summary:
                        </Typography>
                        <Typography variant="body2">
                            {totalCycles} x ({studyTime} min study + {breakTime} min break)
                        </Typography>
                        <Typography variant="body2">
                            Total: {(studyTime + breakTime) * totalCycles} minutes
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Scheduled for: {new Date(selectedDate).toLocaleDateString()} at {startTime}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary"
                    disabled={!title || studyTime <= 0 || breakTime <= 0 || totalCycles <= 0 || !selectedDate || !startTime}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudyCycleForm;
