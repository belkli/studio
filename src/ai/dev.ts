import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-compositions.ts';
import '@/ai/flows/match-teacher-flow.ts';
import '@/ai/flows/draft-progress-report-flow.ts';
