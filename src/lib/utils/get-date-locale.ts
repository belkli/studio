import { Locale } from 'date-fns';
import { he, ar, ru, enUS } from 'date-fns/locale';

export const getDateLocale = (localeKey: string): Locale => {
    switch (localeKey) {
        case 'he': return he;
        case 'ar': return ar;
        case 'ru': return ru;
        case 'en': return enUS;
        default: return he;
    }
};
