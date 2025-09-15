import React, { useState, useEffect, useRef } from "react";
import { Token, Chapter, getProgressPercentage } from "@/lib/text/tokenize";
import { getPauseMultiplier } from "@/lib/util/pause";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RSVPPlayerProps {
  tokens: Token[];
  chapters: Chapter[];
  onProgressChange?: (progress: number) => void;
}

export default function RSVPPlayer({ tokens, onProgressChange }: RSVPPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentToken = tokens[currentIndex];
  const progress = getProgressPercentage(currentIndex, tokens.length);

  // Update progress when index changes
  useEffect(() => {
    onProgressChange?.(progress);
  }, [currentIndex, progress, onProgressChange]);

  // Calculate interval based on WPM and pause multiplier
  const getInterval = (token: Token) => {
    const baseInterval = 60000 / wpm; // Base interval in milliseconds
    const multiplier = getPauseMultiplier(token.text);
    return baseInterval * multiplier;
  };

  // Start/stop playing
  useEffect(() => {
    if (isPlaying && currentIndex < tokens.length && mounted) {
      const token = tokens[currentIndex];
      const interval = getInterval(token);

      intervalRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= tokens.length) {
            setIsPlaying(false);
            return prev;
          }
          return nextIndex;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, tokens, wpm, mounted]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleSkipBackward = () => {
    setIsPlaying(false);
    setCurrentIndex(Math.max(0, currentIndex - 10));
  };

  const handleSkipForward = () => {
    setIsPlaying(false);
    setCurrentIndex(Math.min(tokens.length - 1, currentIndex + 10));
  };

  const handleJumpTo = (percentage: number) => {
    setIsPlaying(false);
    const newIndex = Math.floor((percentage / 100) * tokens.length);
    setCurrentIndex(Math.min(tokens.length - 1, Math.max(0, newIndex)));
  };

  if (!mounted) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-16 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-glass backdrop-blur-xl border border-glass-border">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-pulse-glow"></div>
      
      <div className="relative z-10 p-8 space-y-6">
        {/* Reading Display Area */}
        <div className="min-h-[200px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-reading-bg/50 rounded-lg backdrop-blur-sm"></div>
          
          {/* Word Display */}
          <div className="relative z-10 text-center px-8 py-12">
            {currentToken ? (
              <div className="space-y-4">
                <h1 
                  key={currentIndex}
                  className="text-6xl font-reading font-bold text-foreground animate-word-reveal"
                  style={{
                    textShadow: '0 0 30px hsl(var(--word-highlight) / 0.3)',
                  }}
                >
                  {currentToken.text}
                </h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <span className="text-sm">Word {currentIndex + 1} of {tokens.length}</span>
                  <span className="text-xs">•</span>
                  <span className="text-sm">{Math.round(progress)}% complete</span>
                </div>
              </div>
            ) : (
              <p className="text-2xl text-muted-foreground">Ready to start reading</p>
            )}
          </div>
          
          {/* Visual focus guide */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-1 bg-gradient-smooth opacity-20 blur-xl"></div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-muted/50"
          />
          <Slider
            value={[progress]}
            onValueChange={([value]) => handleJumpTo(value)}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="bg-card/50 backdrop-blur-sm border-glass-border hover:bg-accent/20 hover:shadow-glow transition-all"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipBackward}
              className="bg-card/50 backdrop-blur-sm border-glass-border hover:bg-accent/20 hover:shadow-glow transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              onClick={handlePlayPause}
              className="bg-gradient-primary hover:shadow-glow transition-all px-8 py-6 text-lg font-semibold"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {currentIndex === 0 ? "Start" : "Resume"}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSkipForward}
              className="bg-card/50 backdrop-blur-sm border-glass-border hover:bg-accent/20 hover:shadow-glow transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Reading Speed</span>
              </div>
              <span className="text-sm font-bold text-accent">{wpm} WPM</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-12">100</span>
              <Slider
                value={[wpm]}
                onValueChange={([value]) => setWpm(value)}
                min={100}
                max={1000}
                step={50}
                className="flex-1"
                disabled={isPlaying}
              />
              <span className="text-xs text-muted-foreground w-12">1000</span>
            </div>
            
            {/* Speed presets */}
            <div className="flex gap-2 justify-center">
              {[200, 300, 500, 700].map(speed => (
                <Button
                  key={speed}
                  variant={wpm === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWpm(speed)}
                  disabled={isPlaying}
                  className={wpm === speed ? "bg-gradient-primary" : "bg-card/50 backdrop-blur-sm"}
                >
                  {speed}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-glass-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{tokens.length}</p>
              <p className="text-xs text-muted-foreground">Total Words</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {Math.round((tokens.length - currentIndex) / wpm)}
              </p>
              <p className="text-xs text-muted-foreground">Minutes Left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {Math.round(tokens.length / 300)}
              </p>
              <p className="text-xs text-muted-foreground">Est. Minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}