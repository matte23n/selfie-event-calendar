import { ToolbarProps } from "react-big-calendar"
import { CalendarEvent } from "./Calendar"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; import { useCallback, useState, useEffect, useMemo } from 'react';


interface CalendarResource {
    id: string;
    title: string;
}

const MyCustomToolbar = () => (toolbar: ToolbarProps<CalendarEvent, CalendarResource>) => {
    return (
        <div className='rbc-toolbar'>
            <span className="rbc-btn-group">
                <button type="button" onClick={() => toolbar.onNavigate.bind(null, 'PREV')}>
                    <ArrowLeftIcon />
                </button>
                <button type="button" onClick={() => toolbar.onNavigate.bind(null, 'TODAY')}>
                    <FiberManualRecordIcon />
                </button>
                <button type="button" onClick={() => toolbar.onNavigate.bind(null, 'NEXT')}>
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

export default MyCustomToolbar;