"use client";

import { cn } from "@/lib/utils";

interface AiAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
}

export function AiAvatar({ isSpeaking, isThinking }: AiAvatarProps) {
  return (
    <div
      className={cn(
        "relative h-40 w-40 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300",
        (isSpeaking || isThinking) && "bg-primary/20 scale-105"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-primary/20 animate-pulse",
          isSpeaking || isThinking ? "scale-100" : "scale-0"
        )}
        style={{ animationDuration: '2s' }}
      ></div>
      <div className="relative h-32 w-32 rounded-full bg-background flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/80 flex items-center justify-center transition-all duration-300">
            <div className={cn("h-3 w-8 bg-background rounded-full transition-all duration-300", isSpeaking ? 'h-1' : 'h-3' )}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
