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
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCalendarContext } from './CalendarContext';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

// We still need these interfaces for the Calendar component
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
    isTask?: boolean;
    taskData?: Task;
}

// Aggiungi questa interfaccia per le attività
export interface Task {
    id?: number;
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
    const [myEvents, setMyEvents] = useState<CalendarEvent[]>(myEventsArray);
    const [openedDialog, setOpenedDialog] = useState<boolean>(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();
    
    // Connect to the calendar context
    const { showEventForm, setShowEventForm, showTaskForm, setShowTaskForm } = useCalendarContext();
    
    const [newEvent, setNewEvent] = useState<CalendarEvent>({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        desc: '',
        isAllDay: false,
        isRepeatable: false,
    });
    
    // Aggiungi stato per le attività
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<Task>({
        title: '',
        startDate: new Date(),
        dueDate: new Date(),
        completed: false
    });
    const [selectedTask, setSelectedTask] = useState<Task | undefined>();
    const [showTaskList, setShowTaskList] = useState(true); // Mostra/nascondi lista attività

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

    // Modifica useEffect per caricare anche le attività
    useEffect(() => {
        fetchEvents();
        fetchTasks();
    }, []);

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await axiosInstance.post('/events', newEvent);
        setShowEventForm(false);
        fetchEvents();
    };

    // Aggiungi questa funzione per gestire la creazione di nuove attività
    const handleTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/activities', {
                ...newTask,
                startDate: newTask.startDate.toISOString(),
                dueDate: newTask.dueDate.toISOString()
            });
            setShowTaskForm(false);
            fetchTasks();
            // Reset del form
            setNewTask({
                title: '',
                startDate: new Date(),
                dueDate: new Date(),
                completed: false
            });
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    // Aggiungi questa funzione per gestire il completamento delle attività
    const handleTaskCompletion = async (taskId: number, completed: boolean) => {
        try {
            await axiosInstance.patch(`/activities/${taskId}`, { finished: completed });
            setTasks(tasks.map(task => 
                task.id === taskId ? { ...task, completed } : task
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
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, startDate: new Date(start), endDate: new Date(end), isAllDay: event.isAllDay }]
            })
        },
        [setMyEvents]
    )

    // Funzione per trasformare le attività in eventi per il calendario
    const transformTasksToCalendarEvents = (taskList: Task[]): any[] => {
        return taskList.map(task => ({
            id: `task-${task.id}`,
            title: `🔔 ${task.title} (Scadenza)`,
            startDate: task.startDate,
            endDate: task.dueDate,
            isTask: true,
            taskData: task
        }));
    };

    // Combina eventi normali e attività per il calendario
    const allCalendarItems = [...transformEventsForCalendar(myEvents), ...transformTasksToCalendarEvents(tasks)];
    
    return (
        <div>
            
            {/* Layout principale con Calendario e Lista Attività */}
            <div style={{ display: 'flex', height: '85vh' }}>
                {/* Calendario (occupa tutta la larghezza se la lista attività è nascosta) */}
                <div style={{ flex: showTaskList ? 2 : 1, height: '100%' }}>
                    <DnDCalendar
                        localizer={myLocalizer}
                        events={allCalendarItems}
                        draggableAccessor={(event) => !event.isTask} // Solo gli eventi normali sono trascinabili
                        onEventDrop={moveEvent}
                        className='m-auto'
                        components={{ toolbar: CustomToolbar }}
                        onSelectEvent={(event) => {
                            if (event.isTask) {
                                setSelectedTask(event.taskData);
                            } else {
                                setOpenedDialog(true);
                                setSelectedEvent(event);
                            }
                        }}
                        startAccessor="startDate"
                        endAccessor="endDate"
                        eventPropGetter={(event) => {
                            if (event.isTask && event.taskData) {
                                // Stile diverso per le scadenze delle attività
                                const isOverdue = new Date(event.startDate) < new Date() && !event.taskData.completed;
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
                    />
                </div>
                
                {/* Lista Attività (solo se visibile) */}
                {showTaskList && (
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
                            {tasks.filter(task => !task.completed && new Date(task.dueDate) < new Date()).map(task => (
                                <div key={task.id} style={{
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
                                            onChange={(e) => task.id && handleTaskCompletion(task.id, e.target.checked)}
                                            color="primary"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
                                        <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                                        <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(task => !task.completed && new Date(task.dueDate) < new Date()).length === 0 && (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>Nessuna attività in ritardo</p>
                            )}
                        </div>
                        
                        {/* Attività da completare */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ color: '#1976d2' }}>Da completare</h3>
                            {tasks.filter(task => !task.completed && new Date(task.dueDate) >= new Date()).map(task => (
                                <div key={task.id} style={{
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
                                            onChange={(e) => task.id && handleTaskCompletion(task.id, e.target.checked)}
                                            color="primary"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
                                        <span>Inizio: {new Date(task.startDate).toLocaleDateString()}</span>
                                        <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {tasks.filter(task => !task.completed && new Date(task.dueDate) >= new Date()).length === 0 && (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>Nessuna attività da completare</p>
                            )}
                        </div>
                        
                        {/* Attività completate */}
                        <div>
                            <h3 style={{ color: '#388e3c' }}>Completate</h3>
                            {tasks.filter(task => task.completed).map(task => (
                                <div key={task.id} style={{
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
                                            onChange={(e) => task.id && handleTaskCompletion(task.id, e.target.checked)}
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
                )}
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
                                    onChange={(e) => selectedTask.id && handleTaskCompletion(selectedTask.id, e.target.checked)}
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
        </div>
    );
}

