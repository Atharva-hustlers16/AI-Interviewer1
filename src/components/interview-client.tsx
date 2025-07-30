
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, Loader2, LogOut, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateInterviewQuestion } from '@/ai/flows/generate-interview-question';
import { evaluateCodeSolution } from '@/ai/flows/evaluate-code-solution';
import { analyzeFacialExpression } from '@/ai/flows/analyze-facial-expression';
import { generateInterviewReport, GenerateInterviewReportOutput } from '@/ai/flows/generate-interview-report';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { AiAvatar } from '@/components/ai-avatar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

type Round = "Technical" | "Coding" | "HR";
const ROUNDS: Round[] = ["Technical", "Coding", "HR"];
const QUESTIONS_PER_ROUND = { "Technical": 3, "Coding": 1, "HR": 2 };
const USER_ROLE = "Software Engineer";

export function InterviewClient() {
  const { logout } = useAuth();
  const [round, setRound] = useState<Round>("Technical");
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ correct: boolean, feedback: string, score: number } | null>(null);
  const [report, setReport] = useState<GenerateInterviewReportOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  const [isMicOn, setIsMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [expressionAnalyses, setExpressionAnalyses] = useState<string[]>([]);
  const [isAnalyzingExpression, setIsAnalyzingExpression] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string) => {
    if (!isTTSEnabled) {
      setIsLoading(false);
      return;
    };
    
    // setLoading(true) is called in getNextQuestion
    try {
      setIsSpeaking(true);
      const { audioDataUri } = await textToSpeech(text);
      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast({ title: "Speech Error", description: "Could not play AI voice.", variant: "destructive" });
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, [isTTSEnabled, toast]);

  const startTypingEffect = useCallback((text: string) => {
    if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
    }
    setDisplayedQuestion('');
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
        setDisplayedQuestion(prev => {
            const nextChar = text[i];
            i++;
            if (i >= text.length) {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                }
                speak(text);
            }
            return prev + (nextChar || '');
        });
    }, 30);
  }, [speak]);

  const getNextQuestion = useCallback(async (currentHistory: typeof history, currentRound: Round) => {
    setIsLoading(true);
    setEvaluationResult(null);
    try {
      const res = await generateInterviewQuestion({
        history: currentHistory,
        interviewRound: currentRound,
        userRole: USER_ROLE,
      });
      setCurrentQuestion(res.question);
      startTypingEffect(res.question);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not generate a new question.", variant: "destructive" });
      setCurrentQuestion("I'm having trouble thinking of a question. Let's try submitting again.");
      setIsLoading(false);
    } 
  }, [toast, startTypingEffect]);

  useEffect(() => {
    getNextQuestion([], 'Technical');
    
    return () => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleFinish = useCallback(async () => {
    setIsLoading(true);
    setIsFinished(true);
    try {
      const res = await generateInterviewReport({
        history,
        userRole: USER_ROLE,
        expressionAnalysis: expressionAnalyses,
      });
      setReport(res);
    } catch (error)
    {
      console.error(error);
      toast({ title: "Report Error", description: "Could not generate the final report.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [history, expressionAnalyses, toast]);

  const handleNextPhase = useCallback(async (currentHistory: typeof history) => {
    let nextRound = round;
    let nextQuestionCount = questionCount;

    if (questionCount + 1 >= QUESTIONS_PER_ROUND[round]) {
      const currentRoundIndex = ROUNDS.indexOf(round);
      if (currentRoundIndex + 1 < ROUNDS.length) {
        nextRound = ROUNDS[currentRoundIndex + 1];
        nextQuestionCount = 0;
        setRound(nextRound);
        setQuestionCount(nextQuestionCount);
      } else {
        await handleFinish();
        return;
      }
    } else {
      nextQuestionCount = questionCount + 1;
      setQuestionCount(nextQuestionCount);
    }
    await getNextQuestion(currentHistory, nextRound);
  }, [questionCount, round, handleFinish, getNextQuestion]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Not Supported",
          description: "Your browser does not support camera access.",
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings to use this feature.",
        });
      }
    };

    getCameraPermission();

    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      }
    }

    if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => { setIsListening(false); setIsMicOn(false); };
        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          toast({ title: "Mic Error", description: `An error occurred: ${event.error}`, variant: "destructive" });
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setUserAnswer(prev => prev + finalTranscript);
        };
    } else {
        toast({ title: "Compatibility Error", description: "Speech recognition is not supported in your browser.", variant: "destructive" });
    }
  }, [toast]);
  
  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setUserAnswer(''); // Clear previous answer
      recognitionRef.current?.start();
    }
    setIsMicOn(!isMicOn);
  };

  const captureAndAnalyzeExpression = useCallback(async () => {
    if (!videoRef.current || !videoRef.current.srcObject || !hasCameraPermission) {
      console.log("Camera not ready for expression analysis.");
      return;
    };
    setIsAnalyzingExpression(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setIsAnalyzingExpression(false);
        return;
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');

    try {
      const { feedback } = await analyzeFacialExpression({ photoDataUri: dataUri });
      setExpressionAnalyses(prev => [...prev, feedback]);
      toast({ title: "Expression Feedback", description: feedback, duration: 2000 });
    } catch (error) {
      console.error("Expression analysis error:", error);
      // Silently fail for now to not distract user
    } finally {
      setIsAnalyzingExpression(false);
    }
  }, [toast, hasCameraPermission]);
  
  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      toast({ title: "Empty Answer", description: "Please provide an answer.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    await captureAndAnalyzeExpression();

    const newHistory = [...history, { question: currentQuestion, answer: userAnswer }];
    setHistory(newHistory);
    setUserAnswer('');
    
    if (round === "Coding") {
        try {
            const result = await evaluateCodeSolution({ code: userAnswer, problemDescription: currentQuestion });
            setEvaluationResult(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Evaluation Error", description: "Could not evaluate your solution.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    } else {
        await handleNextPhase(newHistory);
    }
  };

  const handleContinueAfterFeedback = async () => {
    await handleNextPhase(history);
  }
  
  const totalRounds = ROUNDS.length;
  const currentRoundIndex = ROUNDS.indexOf(round);
  const questionsInCurrentRound = QUESTIONS_PER_ROUND[round];
  
  const completedRoundsProgress = (currentRoundIndex / totalRounds) * 100;
  const currentRoundProgress = (questionCount / questionsInCurrentRound) * (100 / totalRounds);
  const progress = completedRoundsProgress + currentRoundProgress;


  if (isFinished) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-primary">Interview Complete!</CardTitle>
            <CardDescription className="text-center">Thank you for your time. Here is your performance report.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && !report && <div className="flex justify-center items-center gap-2"><Loader2 className="animate-spin" /> <p>Generating your report...</p></div>}
            {report && (
              <div className="space-y-4 text-left">
                <Alert>
                  <AlertTitle>Overall Assessment</AlertTitle>
                  <AlertDescription>{report.overallAssessment}</AlertDescription>
                </Alert>

                <div>
                    <h3 className="font-semibold mb-2">Strengths</h3>
                    <div className="flex flex-wrap gap-2">
                        {report.strengths.map((strength, i) => <Badge key={i} variant="secondary">{strength}</Badge>)}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                    <div className="flex flex-wrap gap-2">
                        {report.areasForImprovement.map((area, i) => <Badge key={i} variant="destructive">{area}</Badge>)}
                    </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/'} className="w-full">Start Over</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background dark:bg-gray-900">
      <audio ref={audioRef} className="hidden" />
      <aside className="w-full md:w-1/3 lg:w-1/4 p-4 md:p-8 bg-card border-r flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-primary font-headline">AI Interviewer</h2>
        </div>
        
        <div className="relative">
          <AiAvatar isSpeaking={isSpeaking} isThinking={isLoading && !isSpeaking} />
          <div className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover transition-opacity", hasCameraPermission ? 'opacity-20' : 'opacity-0')}></video>
          </div>
        </div>

        <div className="w-full space-y-2">
            <p className="text-center text-sm font-medium text-muted-foreground">{round} Round ({questionCount + 1}/{QUESTIONS_PER_ROUND[round]})</p>
            <Progress value={progress} />
        </div>
        {!hasCameraPermission && (
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature.
              </AlertDescription>
            </Alert>
        )}
        <div className="flex gap-2 mt-4">
            <Button variant={isMicOn ? "destructive" : "outline"} size="icon" onClick={toggleMic} disabled={isSpeaking || isLoading}>
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button variant={isTTSEnabled ? "default" : "outline"} size="icon" onClick={() => setIsTTSEnabled(!isTTSEnabled)}>
              {isTTSEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
        </div>
        <p className={`text-sm text-muted-foreground mt-2 transition-opacity ${isListening ? 'opacity-100' : 'opacity-0'}`}>Listening...</p>
      </aside>
      <main className="flex-1 p-4 md:p-8 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Question {history.length + 1}</CardTitle>
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
              className={`w-full text-base ${round === 'Coding' ? 'font-code bg-gray-900 text-gray-50 dark:bg-black' : ''}`}
              disabled={isLoading || isListening || isSpeaking}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4">
            {evaluationResult ? (
                <div className="w-full text-left space-y-3">
                  <Alert variant={evaluationResult.correct ? "default" : "destructive"}>
                    <AlertTitle>Evaluation Result</AlertTitle>
                    <AlertDescription>
                      <p><span className="font-semibold">Score:</span> {evaluationResult.score}/100</p>
                      <p>{evaluationResult.feedback}</p>
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleContinueAfterFeedback} className="w-full sm:w-auto">Continue</Button>
                </div>
            ) : (
                <Button onClick={handleSubmit} disabled={isLoading || isAnalyzingExpression || isListening || isSpeaking || !userAnswer.trim()}>
                    {(isLoading || isAnalyzingExpression) && !isSpeaking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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

    