import { Calendar, momentLocalizer, ToolbarProps } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import 'moment/locale/it';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; import { useCallback, useState, useEffect } from 'react';
import EventInfoDialog from './EventInfoDialog';
import axiosInstance from './api/axiosInstance';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Select, MenuItem, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

export interface CalendarEvent {
    id?: number;
    title?: string;
    startDate: Date;
    endDate: Date;
    desc?: string;
    isAllDay?: boolean;
    isRepeatable?: boolean;
    frequency?: string;
    repeatCount?: number;
    repeatUntil?: string;
}

interface CalendarResource {
    id: string;
    title: string;
}

const myEventsArray: CalendarEvent[] = [{
    id: 6,
    title: 'Meeting',
    startDate: new Date(2024, 10, 3, 10, 30, 0, 0),
    endDate: new Date(2024, 10, 4, 12, 30, 0, 0),
    desc: 'Pre-meeting meeting, to prepare for the meeting',
},];

const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent, CalendarResource>) => {
    return (
        <div className='rbc-toolbar'>
            <span className="rbc-btn-group">
                <button type="button" onClick={() => toolbar.onNavigate('PREV')}>
                    <ArrowLeftIcon />
                </button>
                <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>
                    <FiberManualRecordIcon />
                </button>
                <button type="button" onClick={() => toolbar.onNavigate('NEXT')}>
                    <ArrowRightIcon />
                </button>
            </span>
            <span className="rbc-toolbar-label">{toolbar.label}</span>

            <span className="rbc-btn-group">
                <button
                    type="button"
                    key="day"
                    className={toolbar.view === 'day' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('day')}
                >
                    Day
                </button>
                <button
                    type="button"
                    key="week"
                    className={toolbar.view === 'week' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('week')}
                >
                    Week
                </button>
                <button
                    type="button"
                    key="month"
                    className={toolbar.view === 'month' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('month')}
                >
                    Month
                </button>
                <button
                    type="button"
                    key="agenda"
                    className={toolbar.view === 'agenda' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('agenda')}
                >
                    Agenda
                </button>
            </span>
        </div>
    )
}

export default function MyCalendar() {
    const [myEvents, setMyEvents] = useState<CalendarEvent[]>(myEventsArray)
    const [openedDialog, setOpenedDialog] = useState<boolean>(false)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>()
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState<CalendarEvent>({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        desc: '',
        isAllDay: false,
        isRepeatable: false,
    });

    const transformEventsForCalendar = (events: CalendarEvent[]) => {
        return events.map(event => ({
            ...event,
            start: event.startDate,
            end: event.endDate
        }));
    };

    const fetchEvents = async () => {
        try {
            const { data } = await axiosInstance.get('/events');
            setMyEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await axiosInstance.post('/events', newEvent);
        setShowEventForm(false);
        fetchEvents();
    };

    const moveEvent = useCallback(
        ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: { event: CalendarEvent, start: string | Date, end: string | Date, isAllDay?: boolean }) => {
            const { isAllDay: allDay } = event
            if (!allDay && droppedOnAllDaySlot) {
                event.isAllDay = true
            }
            if (allDay && !droppedOnAllDaySlot) {
                event.isAllDay = false;
            }

            setMyEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, startDate: new Date(start), endDate: new Date(end), isAllDay: event.isAllDay }]
            })
        },
        [setMyEvents]
    )


    return (
        <div>
            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="add"
                onClick={() => setShowEventForm(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                }}
            >
                <AddIcon />
            </Fab>

            <Dialog open={showEventForm} onClose={() => setShowEventForm(false)}>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Title"
                        fullWidth
                        margin="normal"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                    <TextField
                        label="Start Date"
                        type="datetime-local"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newEvent.startDate.toISOString().slice(0, 16)}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
                    />
                    <TextField
                        label="End Date"
                        type="datetime-local"
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        value={newEvent.endDate.toISOString().slice(0, 16)}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        margin="normal"
                        value={newEvent.desc}
                        onChange={(e) => setNewEvent({ ...newEvent, desc: e.target.value })}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newEvent.isAllDay}
                                onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                            />
                        }
                        label="All Day"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newEvent.isRepeatable}
                                onChange={(e) => setNewEvent({ ...newEvent, isRepeatable: e.target.checked })}
                            />
                        }
                        label="Repeatable"
                    />
                    {newEvent.isRepeatable && (
                        <>
                            <Select
                                fullWidth
                                margin="dense"
                                value={newEvent.frequency}
                                onChange={(e) => setNewEvent({ ...newEvent, frequency: e.target.value })}
                            >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="yearly">Yearly</MenuItem>
                            </Select>
                            <TextField
                                label="Repeat Count"
                                type="number"
                                fullWidth
                                margin="normal"
                                value={newEvent.repeatCount || ''}
                                onChange={(e) => setNewEvent({ ...newEvent, repeatCount: parseInt(e.target.value) })}
                            />
                            <TextField
                                label="Repeat Until"
                                type="datetime-local"
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                                value={newEvent.repeatUntil}
                                onChange={(e) => setNewEvent({ ...newEvent, repeatUntil: e.target.value })}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEventForm(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleEventSubmit} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <div style={{ height: '85vh' }}>  {/* Adding a container with fixed height */}
                <DnDCalendar
                    localizer={myLocalizer}
                    events={transformEventsForCalendar(myEvents)}
                    draggableAccessor={(event) => true}
                    onEventDrop={moveEvent}
                    className='m-auto'
                    components={{ toolbar: CustomToolbar }}
                    onSelectEvent={(event) => { setOpenedDialog(true); setSelectedEvent(event) }}
                    startAccessor="startDate"
                    endAccessor="endDate"
                />
            </div>
            {selectedEvent && <EventInfoDialog open={openedDialog} onClose={() => { setOpenedDialog(false); }} event={selectedEvent} />}
        </div>
    );
}

