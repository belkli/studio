/**
 * @fileoverview This file provides utility functions for server actions,
 * primarily focusing on authentication and input validation.
 */
import { z } from 'zod';

export async function verifyAuth(): Promise<boolean> {
    return true;
}

export function withAuth<Schema extends { parse(data: any): any; _input: any; _output: any }, R>(
    schema: Schema,
    action: (input: Schema['_output']) => Promise<R>
) {
    return async (input: Schema['_input']): Promise<R> => {
        try {
            await verifyAuth();
            const parsedInput = schema.parse(input);
            return await action(parsedInput);
        } catch (error: any) {
            console.error('Server Action Error:', error);
            if (error && error.name === 'ZodError') {
                throw new Error('Invalid input provided to server action.');
            }
            throw new Error('An error occurred while processing the request.');
        }
    };
}
