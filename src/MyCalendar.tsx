import { Calendar, momentLocalizer, ToolbarProps } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import 'moment/locale/it';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; import { useCallback, useState } from 'react';
import EventInfoDialog from './EventInfoDialog';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

export interface CalendarEvent {
    id?: number;
    title?: string;
    start?: Date;
    end?: Date;
    desc?: string;
    allDay?: boolean;
}

interface CalendarResource {
    id: string;
    title: string;
}

const myEventsArray: CalendarEvent[] = [{
    id: 6,
    title: 'Meeting',
    start: new Date(2024, 10, 3, 10, 30, 0, 0),
    end: new Date(2024, 10, 4, 12, 30, 0, 0),
    desc: 'Pre-meeting meeting, to prepare for the meeting',
},];

const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent, CalendarResource>) => {
    return (
        <div className='rbc-toolbar'>
            <span className="rbc-btn-group">
                <button type="button" onClick={() => toolbar.onNavigate('PREV')}><ArrowLeftIcon /></button>
                <button type="button" onClick={() => toolbar.onNavigate('TODAY')} ><FiberManualRecordIcon /></button>
                <button type="button" onClick={() => toolbar.onNavigate('NEXT')}><ArrowRightIcon /></button>
            </span>
            <span className="rbc-toolbar-label">{toolbar.label}</span>

            <span className="rbc-btn-group">
                <button
                    type="button"
                    key={"day"}
                    className={toolbar.view === 'day' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('day')}
                >
                    Day
                </button>
                <button
                    type="button"
                    key={"Weekly"}
                    className={toolbar.view === 'week' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('week')}
                >
                    Week
                </button>
                <button
                    type="button"
                    key={"Weekly"}
                    className={toolbar.view === 'month' ? "rbc-active" : ""}
                    onClick={() => toolbar.onView('month')}
                >
                    Month
                </button>
                <button
                    type="button"
                    key={"Agenda"}
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

    const moveEvent = useCallback(
        ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: { event: CalendarEvent, start: string | Date, end: string | Date, isAllDay?: boolean }) => {
            const { allDay } = event
            if (!allDay && droppedOnAllDaySlot) {
                event.allDay = true
            }
            if (allDay && !droppedOnAllDaySlot) {
                event.allDay = false;
            }

            setMyEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, { ...existing, start: new Date(start), end: new Date(end), allDay: event.allDay }]
            })
        },
        [setMyEvents]
    )


    return <> {/* <DnDCalendar
        localizer={myLocalizer}
        events={myEvents}
        draggableAccessor={(event) => true}
        onEventDrop={moveEvent}
        className='m-auto'
        components={{ toolbar: CustomToolbar }}
        onSelectEvent={(event) => { setOpenedDialog(true); setSelectedEvent(event) }}
    /> */}
        {selectedEvent && <EventInfoDialog open={openedDialog} onClose={() => { setOpenedDialog(false); }} event={selectedEvent} />}
    </>
}

