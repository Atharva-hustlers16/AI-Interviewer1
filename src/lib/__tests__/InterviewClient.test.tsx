import React from 'react';
import { render, screen } from '@testing-library/react';
import { InterviewClient } from '@/components/interview-client';
import { useToast } from '@/hooks/use-toast';

// Mock the AI flows
jest.mock('@/ai/flows/generate-interview-question', () => ({
  generateInterviewQuestion: jest.fn().mockResolvedValue({ question: 'This is a test question.' }),
}));
jest.mock('@/ai/flows/evaluate-code-solution', () => ({
  evaluateCodeSolution: jest.fn(),
}));
jest.mock('@/ai/flows/analyze-facial-expression', () => ({
    analyzeFacialExpression: jest.fn(),
}));
jest.mock('@/ai/flows/generate-interview-report', () => ({
    generateInterviewReport: jest.fn(),
}));
jest.mock('@/ai/flows/text-to-speech', () => ({
  textToSpeech: jest.fn().mockResolvedValue({ audioDataUri: 'test_uri' }),
}));


// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock navigator.mediaDevices.getUserMedia
if (!navigator.mediaDevices) {
    (navigator as any).mediaDevices = {};
}
navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }],
});


describe('InterviewClient', () => {
  it('renders the initial interview screen', async () => {
    render(<InterviewClient />);
    
    // Check for the initial question text
    expect(await screen.findByText(/Question 1/i)).toBeInTheDocument();
    
    // Check for the "Thinking..." state initially
    expect(screen.getByText(/Thinking.../i)).toBeInTheDocument();

    // After loading, check if the question is displayed
    expect(await screen.findByText('This is a test question.')).toBeInTheDocument();
  });
});
