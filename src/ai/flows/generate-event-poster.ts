import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EventPosterInputSchema = z.object({
  id: z.string(),
  title: z.object({
    he: z.string(),
    en: z.string(),
    ru: z.string().optional(),
    ar: z.string().optional(),
  }),
  eventDate: z.string(),
  startTime: z.string(),
  venueName: z.string(),
});

const EventPosterOutputSchema = z.object({
  posterUrl: z.string(),
});

export type GenerateEventPosterInput = z.infer<typeof EventPosterInputSchema>;
export type GenerateEventPosterOutput = z.infer<typeof EventPosterOutputSchema>;

export async function generateEventPoster(input: GenerateEventPosterInput): Promise<GenerateEventPosterOutput> {
  return generateEventPosterFlow(input);
}

const generateEventPosterFlow = ai.defineFlow(
  {
    name: 'generateEventPosterFlow',
    inputSchema: EventPosterInputSchema,
    outputSchema: EventPosterOutputSchema,
  },
  async (input) => {
    // Simulate image generation latency (~10 seconds) and return a deterministic poster placeholder.
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return {
      posterUrl: `https://picsum.photos/seed/event-poster-${encodeURIComponent(input.id)}/900/1350`,
    };
  }
);
