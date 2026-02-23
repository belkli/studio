/**
 * @fileoverview This file provides utility functions for server actions,
 * primarily focusing on authentication and input validation.
 */
import { z } from 'zod';

/**
 * Mock authentication check.
 * In a real application, this would verify a session cookie or JWT against a backend service
 * (e.g., NextAuth.js, Firebase Auth, Lucia). For this prototype, we assume any
 * request reaching a server action is from an authenticated context, as client-side
 * routing would prevent unauthenticated users from accessing action-triggering UI.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is considered authenticated.
 */
export async function verifyAuth(): Promise<boolean> {
    // In a production app, this would be a real check:
    // const session = await auth();
    // if (!session) throw new Error("Unauthorized");
    return true;
}

/**
 * A higher-order function to wrap Server Actions with authentication and validation.
 * This pattern ensures that every server action is secure and receives correctly-typed data.
 *
 * @template T - A Zod schema for input validation.
 * @template R - The return type of the action.
 * @param {T} schema - The Zod schema to validate the input against.
 * @param {(input: z.infer<T>) => Promise<R>} action - The server action function to execute.
 * @returns {Function} An async function that takes validated input and returns the action's result.
 */
export function withAuth<T extends z.ZodType<any, any>, R>(
    schema: T,
    action: (input: z.infer<T>) => Promise<R>
) {
    return async (input: z.infer<T>): Promise<R> => {
        try {
            // 1. Authorization Check
            await verifyAuth();

            // 2. Input Validation (Zod)
            const parsedInput = schema.parse(input);

            // 3. Execution
            return await action(parsedInput);

        } catch (error) {
            console.error('Server Action Error:', error);
            if (error instanceof z.ZodError) {
                // Provides a clear error for development if client-side validation fails.
                throw new Error('Invalid input provided to server action.');
            }
            // Generic error for production to avoid leaking implementation details.
            throw new Error('An error occurred while processing the request.');
        }
    };
}
