import { Calendar, momentLocalizer, ToolbarProps, View, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import 'moment/locale/it';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; 
import { useCallback, useState, useEffect, useMemo } from 'react';
import EventInfoDialog from './EventInfoDialog';
import axiosInstance from './api/axiosInstance';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Fab, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router';
import StudyCycleForm from './components/StudyCycleForm';
import { StudyCycleData, Event } from './types/models';
import { useDialogContext } from './DialogProvider';
import { useTimeMachine } from './TimeMachineContext';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

// We still need these interfaces for the Calendar component
export interface CalendarEvent {
    _id?: number;
    title?: string;
    startDate: Date;
    endDate: Date;
    desc?: string;
    isAllDay?: boolean;
    isRepeatable?: boolean;
    frequency?: string;
    repeatCount?: number;
    repeatUntil?: string;
    isTask?: boolean;
    taskData?: Task;
    isStudyCycle?: boolean;
    studyCycleData?: {
        studyTime: number;
        breakTime: number;
        totalCycles: number;
        completedCycles: number;
        lastProgress?: string;
    };
}

// Aggiungi questa interfaccia per le attività
export interface Task {
    _id?: number;
    title?: string;
    startDate: Date;
    dueDate: Date;
    completed: boolean;
}

interface CalendarResource {
    id: string;
    title: string;
}

const myEventsArray: CalendarEvent[] = [{
    _id: 6,
    title: 'Meeting',
    startDate: new Date(2024, 10, 3, 10, 30, 0, 0),
    endDate: new Date(2024, 10, 4, 12, 30, 0, 0),
    desc: 'Pre-meeting meeting, to prepare for the meeting',
},];



export default function MyCalendar() {
    const [myEvents, setMyEvents] = useState<CalendarEvent[]>(myEventsArray);
    const [openedDialog, setOpenedDialog] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const navigate = useNavigate();
    const { setShowStudyCycleForm } = useDialogContext();
    const { currentTime, isInPast, isInFuture } = useTimeMachine();

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
    };

    const transformEventsForCalendar = (events: CalendarEvent[]) => {
        return events.map(event => ({
            ...event,
            start: event.startDate,
            end: event.endDate
        }));
    };

    const fetchEvents = async () => {
        try {
            const [eventsRes, studyCyclesRes] = await Promise.all([
                axiosInstance.get('/events'),
                axiosInstance.get('/study-cycles')
            ]);
            
            // Combine regular events and study cycle events
            const events = eventsRes.data || [];
            const studyCycles = studyCyclesRes.data || [];
            
            setMyEvents([...events, ...studyCycles.filter((sc: StudyCycleData) => 
                !events.some((e: Event) => e._id === sc._id)
            )]);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    // Aggiungi questa funzione per caricare le attività
    const fetchTasks = async () => {
        try {
            const { data } = await axiosInstance.get('/activities');
            // Trasforma il formato data se necessario
            const formattedTasks = data.map((task: any) => ({
                ...task,
                startDate: new Date(task.startDate),
                dueDate: new Date(task.dueDate)
            }));
            setTasks(formattedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchTasks();
    }, []);

    useEffect(() => {
        setDate(currentTime);
    }, [currentTime]);

    // Update to fetch tasks when currentTime changes
    useEffect(() => {
        fetchTasks();
        // No need to fetch events on every time change, as those are displayed in the calendar
    }, [currentTime]);

    // Aggiungi questa funzione per gestire il completamento delle attività
    const handleTaskCompletion = async (taskToComplete: Task, completed: boolean) => {
        try {
            await axiosInstance.patch(`/activities/${taskToComplete._id}`, { completed });
            
            setTasks(tasks.map(task =>
                task._id === taskToComplete._id ? { ...task, completed } : task
            ));
        } catch (error) {
            console.error('Error updating task:', error);
        }
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
                const existing = prev.find((ev) => ev._id === event._id) ?? {}
                const filtered = prev.filter((ev) => ev._id !== event._id)
                return [...filtered, { ...existing, startDate: new Date(start), endDate: new Date(end), isAllDay: event.isAllDay }]
            })
        },
        [setMyEvents]
    )

    // Funzione per trasformare le attività in eventi per il calendario
    const transformTasksToCalendarEvents = (taskList: Task[]): any[] => {
        return taskList.map(task => ({
            id: `task-${task._id}`,
            title: `🔔 ${task.title} (Scadenza)`,
            startDate: task.startDate,
            endDate: task.dueDate,
            isTask: true,
            taskData: task
        }));
    };

    // Combina eventi normali e attività per il calendario
    const allCalendarItems = [...transformEventsForCalendar(myEvents), ...transformTasksToCalendarEvents(tasks)];

    // Handle clicking on a study cycle event
    const handleStudyCycleClick = (event: CalendarEvent) => {
        if (event.studyCycleData) {
            // Navigate to Pomodoro page with study cycle data
            navigate('/pomodoro', { 
                state: { 
                    eventId: event._id,
                    title: event.title,
                    studyTime: event.studyCycleData.studyTime,
                    breakTime: event.studyCycleData.breakTime,
                    totalCycles: event.studyCycleData.totalCycles,
                    completedCycles: event.studyCycleData.completedCycles || 0,
                    // Add total time calculation for the form
                    totalTime: calculateTotalTime(event.studyCycleData)
                } 
            });
        }
    };

    // Helper function to calculate total time in HH:MM format
    const calculateTotalTime = (studyCycleData: any) => {
        if (!studyCycleData) return "00:00";
        
        const { studyTime, breakTime, totalCycles } = studyCycleData;
        const totalMinutes = (studyTime + breakTime) * totalCycles;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Handle slot select to open study cycle form
    const handleSelectSlot = ({ start }: { start: Date }) => {
        setShowStudyCycleForm(true);
    };

    // Update this function to use the TimeMachine's currentTime for comparison
    const isTaskOverdue = (task: Task) => {
        return isInPast(new Date(task.dueDate)) && !task.completed;
    };

    return (<>
        <div style={{ display: 'flex', height: '85vh' }}>
            <div style={{ flex: 2, height: '100%', position: 'relative' }}>
                <DnDCalendar
                    localizer={myLocalizer}
                    events={allCalendarItems}
                    draggableAccessor={(event) => !event.isTask} // Solo gli eventi normali sono trascinabili
                    onEventDrop={moveEvent}
                    className='m-auto'
                    defaultView={view}
                    view={view} 
                    date={date} 
                    onView={(view) => setView(view)}
                    onNavigate={(date) => {
                        setDate(new Date(date));
                    }}
                    components={{toolbar: CustomToolbar}}
                    onSelectEvent={(event) => {
                        if (event.isStudyCycle) {
                            handleStudyCycleClick(event);
                        } else if (event.isTask) {
                            setSelectedTask(event.taskData);
                        } else {
                            setOpenedDialog(true);
                            setSelectedEvent(event);
                        }
                    }}
                    startAccessor="startDate"
                    endAccessor="endDate"
                    eventPropGetter={(event) => {
                        if (event.isStudyCycle) {
                            // Style for study cycle events
                            const progress = event.studyCycleData ? 
                                event.studyCycleData.completedCycles / event.studyCycleData.totalCycles : 0;
                            
                            return {
                                style: {
                                    backgroundColor: '#673ab7', // Purple color for study cycles
                                    backgroundImage: `linear-gradient(90deg, #8561c5 ${progress * 100}%, #673ab7 ${progress * 100}%)`,
                                    borderRadius: '4px',
                                    border: '1px solid #5e35b1'
                                }
                            };
                        } else if (event.isTask && event.taskData) {
                            // Stile diverso per le scadenze delle attività
                            const isOverdue = isTaskOverdue(event.taskData);
                            return {
                                style: {
                                    backgroundColor: isOverdue ? '#f44336' : '#ff9800',
                                    borderRadius: '4px',
                                    border: event.taskData.completed ? '2px solid green' : 'none',
                                    opacity: event.taskData.completed ? 0.7 : 1
                                }
                            };
                        }
                        return {};
                    }}
                    onSelectSlot={handleSelectSlot}
                    selectable={true}
                />
            </div>
            <div style={{
                flex: 1,
                height: '100%',
                padding: '10px',
                overflowY: 'auto',
                borderLeft: '1px solid #ddd',
                backgroundColor: '#f9f9f9'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0 }}>Attività</h2>
                </div>

                {/* Attività in ritardo */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#d32f2f' }}>In ritardo</h3>
                    {tasks.filter(task => !task.completed && isTaskOverdue(task)).map(task => (
                        <div key={task._id} style={{
                            padding: '10px',
                            marginBottom: '8px',
                            backgroundColor: '#ffebee',
                            borderRadius: '4px',
                            border: '1px solid #ffcdd2'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                                <Checkbox
                                    checked={task.completed}
                                    onChange={(e) => task._id && handleTaskCompletion(task, e.target.checked)}
                                    color="primary"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
                                <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                                <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {tasks.filter(task => !task.completed && isTaskOverdue(task)).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Nessuna attività in ritardo</p>
                    )}
                </div>

                {/* Attività da completare */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#1976d2' }}>Da completare</h3>
                    {tasks.filter(task => !task.completed && !isTaskOverdue(task)).map(task => (
                        <div key={task._id} style={{
                            padding: '10px',
                            marginBottom: '8px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            border: '1px solid #bbdefb'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                                <Checkbox
                                    checked={task.completed}
                                    onChange={(e) => task._id && handleTaskCompletion(task, e.target.checked)}
                                    color="primary"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
                                <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                                <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {tasks.filter(task => !task.completed && !isTaskOverdue(task)).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Nessuna attività da completare</p>
                    )}
                </div>

                {/* Attività completate */}
                <div>
                    <h3 style={{ color: '#388e3c' }}>Completate</h3>
                    {tasks.filter(task => task.completed).map(task => (
                        <div key={task._id} style={{
                            padding: '10px',
                            marginBottom: '8px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '4px',
                            border: '1px solid #c8e6c9',
                            opacity: 0.8
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: '0 0 5px 0', textDecoration: 'line-through' }}>{task.title}</h4>
                                <Checkbox
                                    checked={task.completed}
                                    onChange={(e) => task._id && handleTaskCompletion(task, e.target.checked)}
                                    color="primary"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
                                <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                                <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {tasks.filter(task => task.completed).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Nessuna attività completata</p>
                    )}
                </div>
            </div>

        </div>

        {/* Dialog per Eventi (esistente) */}
        {selectedEvent && <EventInfoDialog open={openedDialog} onClose={() => { setOpenedDialog(false); }} event={selectedEvent} />}

        {/* Dialog per dettagli Attività */}
        <Dialog open={!!selectedTask} onClose={() => setSelectedTask(undefined)}>
            {selectedTask && (
                <>
                    <DialogTitle>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {selectedTask.title}
                            <Checkbox
                                checked={selectedTask.completed}
                                onChange={(e) => selectedTask._id && handleTaskCompletion(selectedTask, e.target.checked)}
                                color="primary"
                            />
                        </div>
                    </DialogTitle>
                    <DialogContent>
                        <p>Data di inizio: {new Date(selectedTask.startDate).toLocaleDateString()}</p>
                        <p>Data di scadenza: {new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                        <p>Stato: {selectedTask.completed ? 'Completata' : 'Da completare'}</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSelectedTask(undefined)} color="primary">
                            Chiudi
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    </>
    );
}

