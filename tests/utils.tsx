import React from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AuthContext } from '@/hooks/use-auth';
import { User } from '@/lib/types';
import * as initialMockData from '@/lib/data';

// Basic messages for testing
const defaultMessages = {
    Navigation: {
        about: 'אודות',
        contact: 'צור קשר',
        musicians: 'מוזיקאים',
        availableNow: 'זמין עכשיו',
        lessons: 'שיעורים',
        donate: 'תרומה',
        openDay: 'יום פתוח',
        login: 'כניסה',
        register: 'הרשמה',
        dashboard: 'לוח בקרה'
    },
    Common: {
        name: 'שם',
        save: 'שמור',
        cancel: 'ביטול',
        noData: 'אין נתונים להצגה',
        edit: 'ערוך',
        delete: 'מחק',
        actions: 'פעולות'
    },
    AboutPage: {
        title: 'מדריך הקונסרבטוריונים',
        search: 'חיפוש קונסרבטוריון...',
        filterByCity: 'סינון לפי עיר',
        useLocation: 'השתמש במיקום שלי',
        allDepartments: 'כל המחלקות'
    },
    ContactPage: {
        title: 'צור קשר',
        selectConservatorium: 'בחר קונסרבטוריון ליצירת קשר',
        send: 'שלח הודעה'
    },
    HomePage: {
        title: 'הַרמוֹנְיָה',
        copyright: 'All rights reserved.',
        privacyPolicy: 'Privacy Policy'
    }
};

interface RenderOptions {
    locale?: string;
    messages?: any;
    user?: User | null;
    authContextValue?: any;
}

export function renderWithProviders(
    ui: React.ReactElement,
    {
        locale = 'he',
        messages = defaultMessages,
        user = null,
        authContextValue = {}
    }: RenderOptions = {}
) {
    const defaultAuthValue = {
        user,
        users: initialMockData.mockUsers,
        conservatoriums: initialMockData.conservatoriums,
        mockFormSubmissions: [],
        mockLessons: [],
        mockPackages: [],
        mockAlumni: initialMockData.mockAlumni,
        mockInstrumentInventory: initialMockData.mockInstrumentInventory,
        mockBranches: initialMockData.mockBranches,
        mockRooms: initialMockData.mockRooms,
        login: () => { },
        logout: () => { },
        newFeaturesEnabled: true,
        isLoading: false,
        ...authContextValue
    };

    return render(
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthContext.Provider value={defaultAuthValue}>
                {ui}
            </AuthContext.Provider>
        </NextIntlClientProvider>
    );
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
