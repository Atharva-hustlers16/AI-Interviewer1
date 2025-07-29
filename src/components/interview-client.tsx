"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, Loader2, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateInterviewQuestion } from '@/ai/flows/generate-interview-question';
import { evaluateCodeSolution } from '@/ai/flows/evaluate-code-solution';
import { AiAvatar } from '@/components/ai-avatar';

type Round = "Technical" | "Coding" | "HR";
const ROUNDS: Round[] = ["Technical", "Coding", "HR"];
const QUESTIONS_PER_ROUND = { "Technical": 3, "Coding": 1, "HR": 2 };
const USER_ROLE = "Software Engineer";

export function InterviewClient() {
  const [round, setRound] = useState<Round>("Technical");
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ correct: boolean, feedback: string, score: number } | null>(null);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const speak = useCallback((text: string) => {
    if (!isTTSEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isTTSEnabled]);
  
  const startTypingEffect = useCallback((text: string) => {
    setDisplayedQuestion('');
    let i = 0;
    const interval = setInterval(() => {
        setDisplayedQuestion(prev => prev + (text[i] || ''));
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            speak(text);
        }
    }, 30);
    return () => clearInterval(interval);
  }, [speak]);

  const getNextQuestion = useCallback(async () => {
    setIsLoading(true);
    setEvaluationResult(null);
    try {
      const lastAnswer = history.length > 0 ? history[history.length - 1].answer : "Let's begin the interview.";
      const res = await generateInterviewQuestion({
        previousAnswer: lastAnswer,
        interviewRound: round,
        userRole: USER_ROLE,
      });
      setCurrentQuestion(res.question);
      startTypingEffect(res.question);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not generate a new question.", variant: "destructive" });
      setCurrentQuestion("I'm having trouble thinking of a question. Let's try submitting again.");
    } finally {
      setIsLoading(false);
    }
  }, [round, history, toast, startTypingEffect]);

  const handleNextPhase = useCallback(() => {
    if (questionCount + 1 >= QUESTIONS_PER_ROUND[round]) {
      const currentRoundIndex = ROUNDS.indexOf(round);
      if (currentRoundIndex + 1 < ROUNDS.length) {
        setRound(ROUNDS[currentRoundIndex + 1]);
        setQuestionCount(0);
      } else {
        setIsFinished(true);
      }
    } else {
      setQuestionCount(prev => prev + 1);
    }
  }, [questionCount, round]);

  useEffect(() => {
    getNextQuestion();
  }, [round]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
        toast({ title: "Compatibility Error", description: "Speech recognition is not supported in your browser.", variant: "destructive" });
        return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast({ title: "Mic Error", description: `An error occurred: ${event.error}`, variant: "destructive" });
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setUserAnswer(prev => prev + finalTranscript);
    };
  }, [toast]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsMicOn(!isMicOn);
  };
  
  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      toast({ title: "Empty Answer", description: "Please provide an answer.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const newHistory = [...history, { question: currentQuestion, answer: userAnswer }];
    setHistory(newHistory);

    if (round === "Coding") {
        try {
            const result = await evaluateCodeSolution({ code: userAnswer, problemDescription: currentQuestion });
            setEvaluationResult(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Evaluation Error", description: "Could not evaluate your solution.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setUserAnswer('');
            // After evaluation, we let user see feedback, then they can click to continue
        }
    } else {
        setUserAnswer('');
        handleNextPhase();
        if(!isFinished) {
            await getNextQuestion();
        }
    }
    setIsLoading(false);
  };
  
  const progress = (ROUNDS.indexOf(round) / ROUNDS.length) * 100 + ((questionCount + 1) / QUESTIONS_PER_ROUND[round]) * (100 / ROUNDS.length);

  if (isFinished) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-primary">Interview Complete!</CardTitle>
            <CardDescription className="text-center">Thank you for your time. Here is a summary of your interview.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.map((item, index) => (
              <div key={index}>
                <p className="font-semibold">Q: {item.question}</p>
                <p className="text-muted-foreground pl-4">A: {item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <aside className="w-full md:w-1/3 lg:w-1/4 p-8 bg-card border-r flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-primary font-headline">Elysian AI</h2>
        </div>
        <AiAvatar isSpeaking={isSpeaking} isThinking={isLoading} />
        <div className="w-full space-y-2">
            <p className="text-center text-sm font-medium text-muted-foreground">{round} Round ({questionCount + 1}/{QUESTIONS_PER_ROUND[round]})</p>
            <Progress value={progress} />
        </div>
        <div className="flex gap-2 mt-4">
            <Button variant={isMicOn ? "default" : "outline"} size="icon" onClick={toggleMic} disabled={isSpeaking}>
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button variant={isTTSEnabled ? "default" : "outline"} size="icon" onClick={() => setIsTTSEnabled(!isTTSEnabled)}>
              {isTTSEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
        </div>
        <p className={`text-sm text-muted-foreground mt-2 transition-opacity ${isListening ? 'opacity-100' : 'opacity-0'}`}>Listening...</p>
      </aside>
      <main className="flex-1 p-4 md:p-8 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Question {questionCount + 1}</CardTitle>
            <CardDescription className="min-h-[60px] text-lg text-foreground pt-2">
                {displayedQuestion}
                {isLoading && !displayedQuestion && <span className="animate-pulse">Thinking...</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={round === 'Coding' ? 'Write your code here...' : 'Type your answer here...'}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={round === 'Coding' ? 15 : 5}
              className={`w-full text-base ${round === 'Coding' ? 'font-code bg-gray-800 text-gray-50 dark:bg-black' : ''}`}
              disabled={isLoading || isListening}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            {evaluationResult ? (
                <div className="w-full text-left">
                  <p className="font-bold">Evaluation:</p>
                  <p><span className="font-semibold">Correct:</span> {evaluationResult.correct ? "Yes" : "No"}</p>
                  <p><span className="font-semibold">Score:</span> {evaluationResult.score}/100</p>
                  <p><span className="font-semibold">Feedback:</span> {evaluationResult.feedback}</p>
                  <Button onClick={handleNextPhase} className="mt-4">Continue to Next Round</Button>
                </div>
            ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit {round === 'Coding' ? 'Solution' : 'Answer'}
                </Button>
            )}
          </CardFooter>
        </Card>
        </div>
      </main>
    </div>
  );
}
