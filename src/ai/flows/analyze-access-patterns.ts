'use server';

/**
 * @fileOverview Access log analysis and anomaly detection flow.
 *
 * - analyzeAccessPatterns - Analyzes access logs for suspicious patterns.
 * - AnalyzeAccessPatternsInput - Input for access log analysis.
 * - AnalyzeAccessPatternsOutput - Output containing identified anomalies.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAccessPatternsInputSchema = z.object({
  accessLogs: z
    .string()
    .describe(
      'A string containing the access logs to be analyzed.  Include date, time, and user/visitor identification in each log entry.'
    ),
  normalHoursStart: z
    .string()
    .describe('The start time of normal access hours, in HH:MM format.'),
  normalHoursEnd: z
    .string()
    .describe('The end time of normal access hours, in HH:MM format.'),
});
export type AnalyzeAccessPatternsInput = z.infer<
  typeof AnalyzeAccessPatternsInputSchema
>;

const AnalyzeAccessPatternsOutputSchema = z.object({
  anomalies: z
    .string()
    .describe(
      'A description of any unusual or suspicious access patterns detected in the logs, including repeated failed attempts or access outside of normal hours.'
    ),
});
export type AnalyzeAccessPatternsOutput = z.infer<
  typeof AnalyzeAccessPatternsOutputSchema
>;

export async function analyzeAccessPatterns(
  input: AnalyzeAccessPatternsInput
): Promise<AnalyzeAccessPatternsOutput> {
  return analyzeAccessPatternsFlow(input);
}

const analyzeAccessPatternsPrompt = ai.definePrompt({
  name: 'analyzeAccessPatternsPrompt',
  input: {schema: AnalyzeAccessPatternsInputSchema},
  output: {schema: AnalyzeAccessPatternsOutputSchema},
  prompt: `You are an expert security analyst tasked with identifying suspicious access patterns in access logs.

  Analyze the following access logs for any anomalies, such as repeated failed attempts or access outside of normal business hours ({{normalHoursStart}} - {{normalHoursEnd}}).

  Access Logs:
  {{accessLogs}}

  Identify and describe any suspicious patterns.
  If the logs are clean, return 'No anomalies detected'.`,
});

const analyzeAccessPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeAccessPatternsFlow',
    inputSchema: AnalyzeAccessPatternsInputSchema,
    outputSchema: AnalyzeAccessPatternsOutputSchema,
  },
  async input => {
    const {output} = await analyzeAccessPatternsPrompt(input);
    return output!;
  }
);
