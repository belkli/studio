import { z } from 'zod';

// Mock authentication check since the app currently uses localStorage.
// In a real application, this would verify a session cookie or JWT via NextAuth/Firebase.
export async function verifyAuth() {
    // For the sake of the mock, we will attempt to simulate an auth check.
    // However, Server Actions cannot directly read localStorage.
    // In our implementation, we will require the userId to be passed from the client,
    // and we will validate that it exists and looks like a valid user ID format.

    // In a production app: const session = await auth(); if (!session) throw new Error("Unauthorized");
    return true;
}

// Higher-order function to wrap Server Actions with an authentication check
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
                throw new Error('Invalid input provided to server action.');
            }
            throw new Error('An error occurred while processing the request.');
        }
    };
}
