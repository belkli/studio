import React from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AuthContext } from '@/hooks/use-auth';
import { User } from '@/lib/types';
import * as initialMockData from '@/lib/data';
import * as fs from 'fs';
import * as path from 'path';

// Load real Hebrew messages from src/messages/he/ split files and merge them
function loadMessages(locale: string): Record<string, unknown> {
    const dir = path.resolve(__dirname, `../src/messages/${locale}`);
    const merged: Record<string, unknown> = {};
    if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir)) {
            if (file.endsWith('.json')) {
                try {
                    const contents = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
                    // Merge all keys (including namespaced keys inside each file)
                    Object.assign(merged, contents);
                } catch {
                    // skip malformed files
                }
            }
        }
    }
    return merged;
}

const heMessages = loadMessages('he');

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
        messages = heMessages,
        user = null,
        authContextValue = {}
    }: RenderOptions = {}
) {
    const defaultAuthValue = {
        user,
        users: initialMockData.mockUsers,
        conservatoriums: initialMockData.conservatoriums,
        conservatoriumInstruments: initialMockData.mockConservatoriumInstruments ?? [],
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
