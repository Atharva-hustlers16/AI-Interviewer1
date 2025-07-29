'use server';

/**
 * @fileOverview A Genkit flow for analyzing facial expressions from an image.
 *
 * - analyzeFacialExpression - A function that analyzes the user's expression.
 * - AnalyzeFacialExpressionInput - The input type for the analyzeFacialExpression function.
 * - AnalyzeFacialExpressionOutput - The return type for the analyzeFacialExpression function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFacialExpressionInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of the candidate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeFacialExpressionInput = z.infer<typeof AnalyzeFacialExpressionInputSchema>;

const AnalyzeFacialExpressionOutputSchema = z.object({
    feedback: z.string().describe('Constructive feedback on the facial expression, e.g., "Appears confident and engaged." or "Seems distracted, try to maintain eye contact with the camera."'),
});
export type AnalyzeFacialExpressionOutput = z.infer<typeof AnalyzeFacialExpressionOutputSchema>;

export async function analyzeFacialExpression(input: AnalyzeFacialExpressionInput): Promise<AnalyzeFacialExpressionOutput> {
  return analyzeFacialExpressionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFacialExpressionPrompt',
  input: {schema: AnalyzeFacialExpressionInputSchema},
  output: {schema: AnalyzeFacialExpressionOutputSchema},
  prompt: `You are an expert interview coach. Analyze the user's facial expression from the provided photo.
Provide brief, constructive feedback on their professional appearance and demeanor.
Focus on cues like eye contact, confidence, and engagement.

Photo: {{media url=photoDataUri}}

Feedback:`,
});

const analyzeFacialExpressionFlow = ai.defineFlow(
  {
    name: 'analyzeFacialExpressionFlow',
    inputSchema: AnalyzeFacialExpressionInputSchema,
    outputSchema: AnalyzeFacialExpressionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
