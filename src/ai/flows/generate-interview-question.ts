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
  previousAnswer: z.string().describe('The previous answer provided by the candidate.'),
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
  prompt: `You are an AI interviewer. Generate a dynamic interview question based on the candidate's previous answer and the current interview round. The user role is {{{userRole}}}.

Previous Answer: {{{previousAnswer}}}
Interview Round: {{{interviewRound}}}

Question:`,
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
