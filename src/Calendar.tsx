import { Calendar, momentLocalizer, ToolbarProps, View, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import 'moment/locale/it';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; 
import { useCallback, useState, useEffect,  } from 'react';
import EventInfoDialog from './EventInfoDialog';
import axiosInstance from './api/axiosInstance';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import {  NotificationSetting } from './types/models';
import {  useDialogContext } from './DialogProvider';
import { useTimeMachine } from './TimeMachineContext';
import notificationService from './services/NotificationService';
import eventNotificationService from './services/EventNotificationService';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

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
    notifications?: NotificationSetting[];
    invitedUsers?: InvitedUser[];
}

export interface InvitedUser {
    userId: string;
    username: string;
}

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
    const { setShowStudyCycleForm, setShowEventForm, setShowTaskForm, setRefreshCallbacks } = useDialogContext();
    const { currentTime, isInPast } = useTimeMachine();
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
    const [notifiedTasksCache, setNotifiedTasksCache] = useState<Record<string, boolean>>({});
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date } | null>(null);
    const [showSelectEventTypeDialog, setShowSelectEventTypeDialog] = useState(false);

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
            
            const events = eventsRes.data || [];
            const studyCycles = studyCyclesRes.data || [];
            const allEvents = [...events.map((event: any) => ({
                ...event,
                startDate: new Date(event.startDate),
            })),
            ];
            
            setMyEvents(allEvents);
            
            
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
        setRefreshCallbacks({refreshEvents: fetchEvents, refreshTasks: fetchTasks})
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
        return taskList.map(task => {
            const urgency = getTaskUrgency(task);
            const urgencyIcon = getUrgencyIcon(urgency);
            return {
                id: `task-${task._id}`,
                title: `${urgencyIcon} ${task.title}`,
                startDate: new Date(task.startDate),
                endDate: new Date(task.dueDate),
                isTask: true,
                taskData: task,
                urgency: urgency
            };
        });
    };

    // Update this function to use the TimeMachine's currentTime for comparison
    const isTaskOverdue = (task: Task) => {
        return isInPast(new Date(task.dueDate)) && !task.completed;
    };

    // Function to determine task urgency based on due date
    const getTaskUrgency = (task: Task) => {
        if (task.completed) return 'completed';
        
        const dueDate = new Date(task.dueDate);
        const now = currentTime;
        
        // If already overdue
        if (isTaskOverdue(task)) return 'overdue';
        
        // Calculate days until due
        const daysDifference = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        // Determine urgency levels
        if (daysDifference <= 1) return 'urgent'; // Due today or tomorrow
        if (daysDifference <= 3) return 'high';   // Due in 2-3 days
        if (daysDifference <= 7) return 'medium'; // Due in 4-7 days
        return 'low';                            // Due in more than a week
    };
    
    // Function to get color based on urgency
    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'overdue': return '#f44336'; // Red
            case 'urgent': return '#ff5722';  // Deep Orange
            case 'high': return '#ff9800';    // Orange
            case 'medium': return '#ffc107';  // Amber
            case 'low': return '#8bc34a';     // Light Green
            case 'completed': return '#4caf50'; // Green
            default: return '#2196f3';        // Blue (default)
        }
    };
    
    // Function to get urgency label
    const getUrgencyLabel = (urgency: string) => {
        switch (urgency) {
            case 'overdue': return 'In ritardo';
            case 'urgent': return 'Urgente';
            case 'high': return 'Alta priorità';
            case 'medium': return 'Media priorità';
            case 'low': return 'Bassa priorità';
            case 'completed': return 'Completata';
            default: return '';
        }
    };
    
    // Function to get urgency icon (emoji)
    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'overdue': return '🔴';
            case 'urgent': return '⚠️';
            case 'high': return '❗';
            case 'medium': return '❕';
            case 'low': return '📝';
            case 'completed': return '✅';
            default: return '📌';
        }
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

    // Handle slot select to show event type selection dialog
    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedSlot({ start });
        setShowSelectEventTypeDialog(true);
    };

    // Handle creating different types of events
    const handleCreateEventType = (eventType: 'event' | 'task' | 'studyCycle') => {
        setShowSelectEventTypeDialog(false);
        
        if (!selectedSlot) return;
        
        switch (eventType) {
            case 'event':
                // Use DialogProvider to show event form with initial data
                setShowEventForm(true, {
                    startDate: selectedSlot.start,
                    endDate: new Date(new Date(selectedSlot.start).getTime() + 60 * 60 * 1000)
                });
                break;
            case 'task':
                // Use DialogProvider to show task form with initial data
                setShowTaskForm(true, {
                    startDate: selectedSlot.start,
                    dueDate: new Date(new Date(selectedSlot.start).getTime() + 24 * 60 * 60 * 1000)
                });
                break;
            case 'studyCycle':
                // Show study cycle form (already using the provider)
                setShowStudyCycleForm(true, selectedSlot.start);
                break;
        }
        
        // Reset selected slot
        setSelectedSlot(null);
    };

    // Request notification permissions when component mounts
    useEffect(() => {
        const setupNotifications = async () => {
            const permissionGranted = await notificationService.requestPermission();
            setNotificationsEnabled(permissionGranted);
        };
        
        setupNotifications();
        
        // Set up event listener for opening tasks from notifications
        const handleOpenTask = (event: CustomEvent) => {
            const taskId = event.detail;
            const task = tasks.find(t => t._id === taskId);
            if (task) {
                setSelectedTask(task);
            }
        };
        
        // Set up event listener for re-checking tasks after snoozing
        const handleCheckTask = (event: CustomEvent) => {
            const { tag } = event.detail;
            if (tag && tag.startsWith('task-')) {
                const taskId = tag.replace('task-', '').split('-')[0];
                const task = tasks.find(t => t._id === taskId);
                if (task) {
                    checkAndNotifyTask(task, true); // force notification
                }
            }
        };
        
        // Set up event listener for time machine changes
        const handleTimeMachineChange = () => {
            // Reset notification cache when time changes
            setNotifiedTasksCache({});
            // Force check all tasks with new time
            tasks.forEach(task => checkAndNotifyTask(task, true));
        };
        
        window.addEventListener('openTask', handleOpenTask as EventListener);
        window.addEventListener('checkTask', handleCheckTask as EventListener);
        window.addEventListener('timeMachineChanged', handleTimeMachineChange);
        
        return () => {
            window.removeEventListener('openTask', handleOpenTask as EventListener);
            window.removeEventListener('checkTask', handleCheckTask as EventListener);
            window.removeEventListener('timeMachineChanged', handleTimeMachineChange);
            notificationService.clearAllNotifications();
        };
    }, [tasks]); // Include tasks in the dependency array
    
    // Check for notifications when time changes or tasks change
    useEffect(() => {
        if (notificationsEnabled) {
            tasks.forEach(task => checkAndNotifyTask(task));
        }
    }, [tasks, currentTime, notificationsEnabled]);
    
    // Function to check a task's urgency and send notification if needed
    const checkAndNotifyTask = (task: Task, forceNotify = false) => {
        if (task.completed) return;
        
        const urgency = getTaskUrgency(task);
        const taskId = task._id?.toString() || '';
        const notificationKey = `${taskId}-${urgency}-${currentTime.getDate()}`;
        
        // Notify if urgency is medium or higher and we haven't notified yet for this combination
        const shouldNotify = 
            ['medium', 'high', 'urgent', 'overdue'].includes(urgency) && 
            (forceNotify || !notifiedTasksCache[notificationKey]);
            
        if (shouldNotify) {
            notificationService.notifyTask(task, urgency);
            
            // Mark as notified for this urgency level and day
            setNotifiedTasksCache(prev => ({
                ...prev,
                [notificationKey]: true
            }));
        }
    };

    // Add snooze functionality for task notifications
    const snoozeTaskNotification = (taskId: number | undefined, minutes: number = 15) => {
        if (!taskId) return;
        
        // Generate the task tag like we do in the notifications
        const tag = `task-${taskId}`;
        
        // Call the notification service to snooze
        notificationService.snoozeNotification(tag, minutes);
        
        // Provide visual feedback (optional)
        const taskLabel = tasks.find(t => t._id === taskId)?.title;
        if (taskLabel) {
            // Display temporary confirmation message
            alert(`Notifiche per "${taskLabel}" posticipate di ${minutes} minuti`);
        }
    };

    // Add event listener for openEvent from notifications
    useEffect(() => {
        const handleOpenEvent = (event: CustomEvent) => {
            const eventId = event.detail?.eventId;
            if (eventId) {
                const foundEvent = myEvents.find(e => e._id === eventId);
                if (foundEvent) {
                    setSelectedEvent(foundEvent);
                    setOpenedDialog(true);
                }
            }
        };
        
        window.addEventListener('openEvent', handleOpenEvent as EventListener);
        
        return () => {
            window.removeEventListener('openEvent', handleOpenEvent as EventListener);
            // Cancel all notification schedules when component unmounts
            eventNotificationService.cancelAllNotifications();
        };
    }, [myEvents]);

    //adding notifications for events
    function  NotifyEachMinute(){
         //check all the events of today and notify for upcoming events
         for(let i=0; i<myEventsArray.length; i++){
            if((myEventsArray[i].startDate.getHours() ) == new Date().getHours() && myEventsArray[i].startDate.getMinutes()-5 <= new Date().getMinutes())
                window.alert("the event" + myEventsArray[i].title + "will start shortly.");
         }
         //repeat every minute
        setTimeout(NotifyEachMinute , (61- new Date().getSeconds()) * 1000);
    }
    NotifyEachMinute();
    

    return (
            <>
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
                            const urgency = getTaskUrgency(event.taskData);
                            const urgencyColor = getUrgencyColor(urgency);
                            
                            return {
                                style: {
                                    backgroundColor: urgencyColor,
                                    borderRadius: '4px',
                                    border: event.taskData.completed ? '2px solid #4caf50' : 'none',
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
                            borderLeft: `6px solid ${getUrgencyColor('overdue')}`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px', fontSize: '18px' }}>{getUrgencyIcon('overdue')}</span>
                                    {task.title}
                                </h4>
                                <Checkbox
                                    checked={task.completed}
                                    onChange={(e) => task._id && handleTaskCompletion(task, e.target.checked)}
                                    color="primary"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666' }}>
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
                    {tasks.filter(task => !task.completed && !isTaskOverdue(task)).map(task => {
                        const urgency = getTaskUrgency(task);
                        return (
                            <div key={task._id} style={{
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '4px',
                                borderLeft: `6px solid ${getUrgencyColor(urgency)}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ marginRight: '8px', fontSize: '18px' }}>{getUrgencyIcon(urgency)}</span>
                                        {task.title}
                                    </h4>
                                    <Checkbox
                                        checked={task.completed}
                                        onChange={(e) => task._id && handleTaskCompletion(task, e.target.checked)}
                                        color="primary"
                                    />
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    fontSize: '0.8em'
                                }}>
                                    <span>Scadenza: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    <span style={{ 
                                        fontWeight: 'bold', 
                                        color: getUrgencyColor(urgency)
                                    }}>
                                        {getUrgencyLabel(urgency)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
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
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ 
                                    marginRight: '10px',
                                    fontSize: '24px' 
                                }}>
                                    {getUrgencyIcon(getTaskUrgency(selectedTask))}
                                </span>
                                {selectedTask.title}
                            </div>
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
                        
                        {/* Add urgency information */}
                        <p style={{ 
                            fontWeight: 'bold', 
                            color: getUrgencyColor(getTaskUrgency(selectedTask)) 
                        }}>
                            Priorità: {getUrgencyLabel(getTaskUrgency(selectedTask))}
                        </p>
                        
                        <p>Stato: {selectedTask.completed ? 'Completata' : 'Da completare'}</p>
                        
                        {/* Add snooze options for non-completed tasks */}
                        {!selectedTask.completed && (
                            <Box mt={2}>
                                <Typography variant="subtitle2">Posticipa notifica:</Typography>
                                <Box display="flex" gap={1} mt={1}>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => snoozeTaskNotification(selectedTask._id, 15)}
                                    >
                                        15 min
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => snoozeTaskNotification(selectedTask._id, 30)}
                                    >
                                        30 min
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => snoozeTaskNotification(selectedTask._id, 60)}
                                    >
                                        1 ora
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => snoozeTaskNotification(selectedTask._id, 24 * 60)}
                                    >
                                        1 giorno
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSelectedTask(undefined)} color="primary">
                            Chiudi
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>

        {/* Dialog for selecting event type */}
        <Dialog 
            open={showSelectEventTypeDialog} 
            onClose={() => setShowSelectEventTypeDialog(false)}
        >
            <DialogTitle>Cosa vuoi aggiungere?</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth="250px">
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleCreateEventType('event')}
                        fullWidth
                    >
                        Evento
                    </Button>
                    <Button 
                        variant="contained" 
                        color="secondary"
                        onClick={() => handleCreateEventType('task')}
                        fullWidth
                    >
                        Attività
                    </Button>
                    <Button 
                        variant="contained" 
                        style={{ backgroundColor: '#673ab7', color: 'white' }}
                        onClick={() => handleCreateEventType('studyCycle')}
                        fullWidth
                    >
                        Ciclo di Studio
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowSelectEventTypeDialog(false)} color="primary">
                    Annulla
                </Button>
            </DialogActions>
        </Dialog>
    </>
    );
}

