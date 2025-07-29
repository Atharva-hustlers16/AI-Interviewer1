'use server';

/**
 * @fileOverview A Genkit flow for generating a comprehensive interview report.
 *
 * - generateInterviewReport - A function that creates the report.
 * - GenerateInterviewReportInput - The input type for the generateInterviewReport function.
 * - GenerateInterviewReportOutput - The return type for the generateInterviewReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewReportInputSchema = z.object({
  history: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).describe('The history of questions and answers in the interview.'),
  userRole: z.string().describe('The role of the user who was interviewed (e.g., Software Engineer, Data Scientist).'),
  expressionAnalysis: z.array(z.string()).describe('A collection of facial expression analyses gathered during the interview.'),
});
export type GenerateInterviewReportInput = z.infer<typeof GenerateInterviewReportInputSchema>;

const GenerateInterviewReportOutputSchema = z.object({
    overallAssessment: z.string().describe('A brief, overall assessment of the candidate\'s performance.'),
    strengths: z.array(z.string()).describe('A list of the candidate\'s key strengths.'),
    areasForImprovement: z.array(z.string()).describe('A list of areas where the candidate can improve.'),
});
export type GenerateInterviewReportOutput = z.infer<typeof GenerateInterviewReportOutputSchema>;

export async function generateInterviewReport(input: GenerateInterviewReportInput): Promise<GenerateInterviewReportOutput> {
  return generateInterviewReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewReportPrompt',
  input: {schema: GenerateInterviewReportInputSchema},
  output: {schema: GenerateInterviewReportOutputSchema},
  prompt: `You are an expert hiring manager. Based on the entire interview transcript and facial expression analysis, generate a comprehensive performance report for the candidate applying for the {{{userRole}}} role.

Interview Transcript:
{{#each history}}
Q: {{this.question}}
A: {{this.answer}}
---
{{/each}}

Facial Expression Feedback Summary:
{{#each expressionAnalysis}}
- {{this}}
{{/each}}

Generate a final report with an overall assessment, a bulleted list of strengths, and a bulleted list of areas for improvement.`,
});

const generateInterviewReportFlow = ai.defineFlow(
  {
    name: 'generateInterviewReportFlow',
    inputSchema: GenerateInterviewReportInputSchema,
    outputSchema: GenerateInterviewReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
