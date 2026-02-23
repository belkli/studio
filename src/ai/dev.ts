
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-compositions.ts';
import '@/ai/flows/match-teacher-flow.ts';
import '@/ai/flows/draft-progress-report-flow.ts';
import '@/ai/flows/reschedule-flow.ts';
import '@/ai/flows/help-assistant-flow.ts';
import '@/ai/flows/target-empty-slots-flow.ts';
import '@/ai/flows/nurture-lead-flow.ts';
