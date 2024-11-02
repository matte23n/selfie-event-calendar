import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment';
import { useCallback, useState } from 'react';

const DnDCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar)
const myLocalizer = momentLocalizer(moment)

interface CalendarEvent {
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

export default function MyCalendar() {
    const [myEvents, setMyEvents] = useState<CalendarEvent[]>(myEventsArray)

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


    return <DnDCalendar
        localizer={myLocalizer}
        events={myEvents}
        draggableAccessor={(event) => true}
        onEventDrop={moveEvent}
    />
}

