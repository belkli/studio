'use client';

import { useState, useMemo } from 'react';
import { add, sub, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

export const useCalendar = (initialDate: Date = new Date()) => {
    const [currentDate, setCurrentDate] = useState(initialDate);

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
        start: startOfCurrentWeek,
        end: endOfCurrentWeek,
    });

    const nextWeek = () => {
        setCurrentDate(add(currentDate, { weeks: 1 }));
    };

    const prevWeek = () => {
        setCurrentDate(sub(currentDate, { weeks: 1 }));
    };

    const returnToToday = () => {
        setCurrentDate(new Date());
    };

    const weekDisplay = useMemo(() => {
        const startMonth = format(startOfCurrentWeek, 'MMMM');
        const endMonth = format(endOfCurrentWeek, 'MMMM');
        const startYear = format(startOfCurrentWeek, 'yyyy');
        const endYear = format(endOfCurrentWeek, 'yyyy');

        if (startYear !== endYear) {
            return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
        if (startMonth !== endMonth) {
            return `${startMonth} - ${endMonth} ${startYear}`;
        }
        return `${startMonth} ${startYear}`;
    }, [startOfCurrentWeek, endOfCurrentWeek]);


    return {
        days,
        weekDisplay,
        nextWeek,
        prevWeek,
        returnToToday,
        currentDate,
    };
};