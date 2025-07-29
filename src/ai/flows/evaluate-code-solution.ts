'use server';

/**
 * @fileOverview This file defines a Genkit flow for evaluating coding solutions provided by candidates.
 *
 * - evaluateCodeSolution - A function that evaluates the coding solution.
 * - EvaluateCodeSolutionInput - The input type for the evaluateCodeSolution function.
 * - EvaluateCodeSolutionOutput - The return type for the evaluateCodeSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateCodeSolutionInputSchema = z.object({
  code: z.string().describe('The code submitted by the candidate.'),
  problemDescription: z.string().describe('The description of the coding problem.'),
});
export type EvaluateCodeSolutionInput = z.infer<typeof EvaluateCodeSolutionInputSchema>;

const EvaluateCodeSolutionOutputSchema = z.object({
  correct: z.boolean().describe('Whether the code solves the problem correctly.'),
  feedback: z.string().describe('Feedback on the code solution, including areas for improvement.'),
  score: z.number().describe('A score representing the quality of the code (0-100).'),
});
export type EvaluateCodeSolutionOutput = z.infer<typeof EvaluateCodeSolutionOutputSchema>;

export async function evaluateCodeSolution(input: EvaluateCodeSolutionInput): Promise<EvaluateCodeSolutionOutput> {
  return evaluateCodeSolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateCodeSolutionPrompt',
  input: {schema: EvaluateCodeSolutionInputSchema},
  output: {schema: EvaluateCodeSolutionOutputSchema},
  prompt: `You are an expert software engineer reviewing code submissions from candidates.

You will evaluate the code based on whether it solves the problem correctly, the efficiency of the code, and the readability of the code.

Problem Description: {{{problemDescription}}}

Code: {{{code}}}

Determine if the code solves the problem correctly. Provide feedback on the code, including areas for improvement. Provide a score representing the quality of the code (0-100).
`,
});

const evaluateCodeSolutionFlow = ai.defineFlow(
  {
    name: 'evaluateCodeSolutionFlow',
    inputSchema: EvaluateCodeSolutionInputSchema,
    outputSchema: EvaluateCodeSolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
