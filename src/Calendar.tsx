import { Children, cloneElement } from "react";
import { Calendar, momentLocalizer, ToolbarProps, View, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import 'moment/locale/it';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useCallback, useState, useEffect, } from 'react';
import EventInfoDialog from './EventInfoDialog';
import axiosInstance from './api/axiosInstance';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { NotificationSetting } from './types/models';
import { useDialogContext } from './DialogProvider';
import { useTimeMachine } from './TimeMachineContext';
import notificationService from './services/NotificationService';

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



export default function MyCalendar() {
    const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
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
            const [eventsRes] = await Promise.all([
                axiosInstance.get('/events'),
            ]);

            const events = eventsRes.data || [];
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

    const fetchTasks = async () => {
        try {
            const { data } = await axiosInstance.get('/activities');
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
        setRefreshCallbacks({ refreshEvents: fetchEvents, refreshTasks: fetchTasks })
    }, []);

    useEffect(() => {
        setDate(currentTime);
    }, [currentTime]);

    useEffect(() => {
        fetchTasks();
    }, [currentTime]);

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
        async ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: { event: CalendarEvent, start: string | Date, end: string | Date, isAllDay?: boolean }) => {
            const { isAllDay: allDay } = event;

            if (!allDay && droppedOnAllDaySlot) {
                event.isAllDay = true;
            }
            if (allDay && !droppedOnAllDaySlot) {
                event.isAllDay = false;
            }

            const updatedItem = {
                startDate: new Date(start),
                endDate: new Date(end),
                isAllDay: event.isAllDay,
            };

            try {
                    await axiosInstance.patch(`/events/${event._id}`, updatedItem);
                    setMyEvents((prev) =>
                        prev.map((ev) =>
                            ev._id === event._id ? { ...ev, ...updatedItem } : ev
                        )
                    );
            } catch (error) {
                console.error('Error updating item:', error);
            }
        },
        [setMyEvents, setTasks]
    )

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

    const isTaskOverdue = (task: Task) => {
        return isInPast(new Date(task.dueDate)) && !task.completed;
    };

    const getTaskUrgency = (task: Task) => {
        if (task.completed) return 'completed';

        const dueDate = new Date(task.dueDate);
        const now = currentTime;

        if (isTaskOverdue(task)) return 'overdue';

        const daysDifference = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysDifference <= 1) return 'urgent'; // Due today or tomorrow
        if (daysDifference <= 3) return 'high';   // Due in 2-3 days
        if (daysDifference <= 7) return 'medium'; // Due in 4-7 days
        return 'low';                            // Due in more than a week
    };

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

    const allCalendarItems = [...transformEventsForCalendar(myEvents), ...transformTasksToCalendarEvents(tasks)];

    const handleStudyCycleClick = (event: CalendarEvent) => {
        if (event.studyCycleData) {
            navigate('/pomodoro', {
                state: {
                    eventId: event._id,
                    title: event.title,
                    studyTime: event.studyCycleData.studyTime,
                    breakTime: event.studyCycleData.breakTime,
                    totalCycles: event.studyCycleData.totalCycles,
                    completedCycles: event.studyCycleData.completedCycles || 0,
                    totalTime: calculateTotalTime(event.studyCycleData)
                }
            });
        }
    };

    const calculateTotalTime = (studyCycleData: any) => {
        if (!studyCycleData) return "00:00";

        const { studyTime, breakTime, totalCycles } = studyCycleData;
        const totalMinutes = (studyTime + breakTime) * totalCycles;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedSlot({ start });
        setShowSelectEventTypeDialog(true);
    };

    const handleCreateEventType = (eventType: 'event' | 'task' | 'studyCycle') => {
        setShowSelectEventTypeDialog(false);

        if (!selectedSlot) return;

        switch (eventType) {
            case 'event':

                setShowEventForm(true, {
                    startDate: selectedSlot.start,
                    endDate: new Date(new Date(selectedSlot.start).getTime() + 60 * 60 * 1000)
                });
                break;
            case 'task':

                setShowTaskForm(true, {
                    startDate: selectedSlot.start,
                    dueDate: new Date(new Date(selectedSlot.start).getTime() + 24 * 60 * 60 * 1000)
                });
                break;
            case 'studyCycle':

                setShowStudyCycleForm(true, selectedSlot.start);
                break;
        }

        setSelectedSlot(null);
    };

    useEffect(() => {
        const setupNotifications = async () => {
            const permissionGranted = await notificationService.requestPermission();
            setNotificationsEnabled(permissionGranted);
        };

        setupNotifications();

        const handleOpenTask = (event: CustomEvent) => {
            const taskId = event.detail;
            const task = tasks.find(t => t._id === taskId);
            if (task) {
                setSelectedTask(task);
            }
        };

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

        const handleTimeMachineChange = () => {

            setNotifiedTasksCache({});

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

    useEffect(() => {
        if (notificationsEnabled) {
            tasks.forEach(task => checkAndNotifyTask(task));
        }
    }, [tasks, currentTime, notificationsEnabled]);

    const checkAndNotifyTask = (task: Task, forceNotify = false) => {
        if (task.completed) return;

        const urgency = getTaskUrgency(task);
        const taskId = task._id?.toString() || '';
        const notificationKey = `${taskId}-${urgency}-${currentTime.getDate()}`;

        const shouldNotify =
            ['medium', 'high', 'urgent', 'overdue'].includes(urgency) &&
            (forceNotify || !notifiedTasksCache[notificationKey]);

        if (shouldNotify) {
            notificationService.notifyTask(task, urgency);

            setNotifiedTasksCache(prev => ({
                ...prev,
                [notificationKey]: true
            }));
        }
    };

    const snoozeTaskNotification = (taskId: number | undefined, minutes: number = 15) => {
        if (!taskId) return;

        const tag = `task-${taskId}`;

        notificationService.snoozeNotification(tag, minutes);
    };

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
        };
    }, [myEvents]);


    const TouchCellWrapper = ({ children, value, onSelectSlot }: { children: React.JSX.Element, value: Date, onSelectSlot: ({ start }: { start: Date }) => void }) =>
        cloneElement(Children.only(children), {
            onTouchEnd: handleSelectSlot,
            style: {
                className: `${children}`
            }
        });

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    gap: '10px',
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        flex: 2,
                        minWidth: '300px',
                        height: '100%',
                        position: 'relative',
                        boxSizing: 'border-box',
                    }}>
                        <DnDCalendar
                            localizer={myLocalizer}
                            events={allCalendarItems}
                            draggableAccessor={(event) => !event.isTask}
                            onEventDrop={moveEvent}
                            onEventResize={moveEvent}
                            className='m-auto'
                            defaultView={view}
                            view={view}
                            date={date}
                            onView={(view) => setView(view)}
                            onNavigate={(date) => {
                                setDate(new Date(date));
                            }}
                            components={{
                                toolbar: CustomToolbar,

                                dateCellWrapper: (props) => (
                                    <TouchCellWrapper {...props} onSelectSlot={handleSelectSlot} />
                                )
                            }}
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
                                    const progress = event.studyCycleData ?
                                        event.studyCycleData.completedCycles / event.studyCycleData.totalCycles : 0;
                                    return {
                                        style: {
                                            backgroundColor: '#673ab7',
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
                        minWidth: '300px',
                        height: '100%',
                        padding: '10px',
                        overflowY: 'auto',
                        borderLeft: '1px solid #ddd',
                        backgroundColor: '#f9f9f9',
                        boxSizing: 'border-box',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0 }}>Attività</h2>
                        </div>

                        { }
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

                        { }
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
            </div>

            { }
            {selectedEvent && <EventInfoDialog open={openedDialog} onClose={() => { setOpenedDialog(false); }} event={selectedEvent} />}

            { }
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

                            { }
                            <p style={{
                                fontWeight: 'bold',
                                color: getUrgencyColor(getTaskUrgency(selectedTask))
                            }}>
                                Priorità: {getUrgencyLabel(getTaskUrgency(selectedTask))}
                            </p>

                            <p>Stato: {selectedTask.completed ? 'Completata' : 'Da completare'}</p>

                            { }
                            {!selectedTask.completed && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">Posticipa notifica:</Typography>
                                    <Box display="flex" gap={1} mt={1} minWidth="250px">
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

            { }
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

