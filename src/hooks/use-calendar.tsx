'use client';

import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks } from 'date-fns';
import { useDateLocale } from './use-date-locale';

export const useCalendar = (initialDate: Date = new Date()) => {
    const [currentDate, setCurrentDate] = useState(initialDate);

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
        start: startOfCurrentWeek,
        end: endOfCurrentWeek,
    });

    const nextWeek = () => {
        setCurrentDate(addWeeks(currentDate, 1));
    };

    const prevWeek = () => {
        setCurrentDate(subWeeks(currentDate, 1));
    };

    const returnToToday = () => {
        setCurrentDate(new Date());
    };

    const dateLocale = useDateLocale();

    const weekDisplay = useMemo(() => {
        const startMonth = format(startOfCurrentWeek, 'MMMM', { locale: dateLocale });
        const endMonth = format(endOfCurrentWeek, 'MMMM', { locale: dateLocale });
        const startYear = format(startOfCurrentWeek, 'yyyy', { locale: dateLocale });
        const endYear = format(endOfCurrentWeek, 'yyyy', { locale: dateLocale });

        if (startYear !== endYear) {
            return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
        if (startMonth !== endMonth) {
            return `${startMonth} - ${endMonth} ${startYear}`;
        }
        return `${startMonth} ${startYear}`;
    }, [startOfCurrentWeek, endOfCurrentWeek, dateLocale]);


    return {
        days,
        weekDisplay,
        nextWeek,
        prevWeek,
        returnToToday,
        currentDate,
    };
};