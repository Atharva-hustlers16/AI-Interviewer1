'use server';

/**
 * @fileOverview Generates dynamic interview questions based on the previous answers.
 *
 * - generateInterviewQuestion - A function that generates the interview question.
 * - GenerateInterviewQuestionInput - The input type for the generateInterviewQuestion function.
 * - GenerateInterviewQuestionOutput - The return type for the generateInterviewQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionInputSchema = z.object({
  history: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).describe('The history of questions and answers in the interview so far.'),
  interviewRound: z.enum(['Technical', 'Coding', 'HR']).describe('The current interview round.'),
  userRole: z.string().describe('The role of the user being interviewed (e.g., Software Engineer, Data Scientist).'),
});
export type GenerateInterviewQuestionInput = z.infer<typeof GenerateInterviewQuestionInputSchema>;

const GenerateInterviewQuestionOutputSchema = z.object({
  question: z.string().describe('The generated interview question.'),
});
export type GenerateInterviewQuestionOutput = z.infer<typeof GenerateInterviewQuestionOutputSchema>;

export async function generateInterviewQuestion(input: GenerateInterviewQuestionInput): Promise<GenerateInterviewQuestionOutput> {
  return generateInterviewQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionPrompt',
  input: {schema: GenerateInterviewQuestionInputSchema},
  output: {schema: GenerateInterviewQuestionOutputSchema},
  prompt: `You are an AI interviewer. Generate a dynamic interview question for a {{{userRole}}} candidate.
The current interview round is: {{{interviewRound}}}.

Consider the entire interview history to ask relevant and follow-up questions. Avoid repeating questions.
If the history is empty, start with an appropriate opening question for the round.
If there is history, generate a follow-up question based on the candidate's last answer.

Interview History:
{{#each history}}
Q: {{this.question}}
A: {{this.answer}}
{{/each}}

New Question:`,
});

const generateInterviewQuestionFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionFlow',
    inputSchema: GenerateInterviewQuestionInputSchema,
    outputSchema: GenerateInterviewQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
