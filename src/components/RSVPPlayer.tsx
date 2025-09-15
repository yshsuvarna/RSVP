import React, { useState, useEffect, useRef } from "react";
import { Token, Chapter, getProgressPercentage } from "@/lib/text/tokenize";
import { getPauseMultiplier } from "@/lib/util/pause";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap, BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface RSVPPlayerProps {
  tokens: Token[];
  chapters: Chapter[];
  onProgressChange?: (progress: number) => void;
}

export default function RSVPPlayer({ tokens, chapters, onProgressChange }: RSVPPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [mounted, setMounted] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [showChapterMarkers, setShowChapterMarkers] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

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

  const jumpToChapter = (chapterIndex: number) => {
    setIsPlaying(false);
    const chapter = chapters[chapterIndex];
    if (chapter) {
      setCurrentIndex(chapter.startIndex);
    }
  };

  // Get preview text for hover
  const getPreviewText = (percentage: number) => {
    const index = Math.floor((percentage / 100) * tokens.length);
    const previewStart = Math.max(0, index - 20);
    const previewEnd = Math.min(tokens.length, index + 30);
    
    const previewTokens = tokens.slice(previewStart, previewEnd);
    const currentTokenIndex = index - previewStart;
    
    let text = '';
    let words: { text: string; isHighlight: boolean }[] = [];
    
    for (let i = 0; i < previewTokens.length; i++) {
      const token = previewTokens[i];
      words.push({
        text: token.text,
        isHighlight: i === currentTokenIndex
      });
    }
    
    return words;
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setHoveredPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleProgressBarLeave = () => {
    setHoveredPosition(null);
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

        {/* Context View */}
        {currentToken && (
          <Tabs defaultValue="context" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-muted/50">
              <TabsTrigger value="context" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground">
                <Eye className="h-4 w-4 mr-2" />
                Context View
              </TabsTrigger>
              <TabsTrigger value="chapters" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4 mr-2" />
                Chapters
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="context" className="mt-4">
              <ScrollArea className="h-32 w-full rounded-lg bg-muted/30 p-4">
                <div className="flex flex-wrap gap-1 text-sm leading-relaxed">
                  {/* Show 50 words before and after current position */}
                  {tokens.slice(Math.max(0, currentIndex - 50), currentIndex).map((token, idx) => (
                    <span key={`before-${idx}`} className="text-muted-foreground">
                      {token.text}
                    </span>
                  ))}
                  <span className="font-bold text-primary bg-primary/20 px-1 rounded animate-pulse">
                    {currentToken.text}
                  </span>
                  {tokens.slice(currentIndex + 1, Math.min(tokens.length, currentIndex + 50)).map((token, idx) => (
                    <span key={`after-${idx}`} className="text-muted-foreground">
                      {token.text}
                    </span>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="chapters" className="mt-4">
              <ScrollArea className="h-32 w-full rounded-lg bg-muted/30 p-2">
                <div className="space-y-1">
                  {chapters.map((chapter, idx) => {
                    const isCurrentChapter = currentIndex >= chapter.startIndex && currentIndex <= chapter.endIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => jumpToChapter(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all hover:bg-accent/20 ${
                          isCurrentChapter ? 'bg-primary/20 border-l-2 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isCurrentChapter ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                            {chapter.title}
                          </span>
                          <Badge variant={isCurrentChapter ? "default" : "secondary"} className="text-xs">
                            {Math.round(chapter.progress)}%
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Progress Bar with Hover Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChapterMarkers(!showChapterMarkers)}
                className="h-6 px-2 text-xs"
              >
                {showChapterMarkers ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Hide Markers
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Show Markers
                  </>
                )}
              </Button>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          {/* Progress bar container with hover preview */}
          <div 
            ref={progressBarRef}
            className="relative"
            onMouseMove={handleProgressBarHover}
            onMouseLeave={handleProgressBarLeave}
          >
            {/* Hover Preview Card */}
            {hoveredPosition !== null && (
              <div 
                className="absolute bottom-full mb-4 -translate-x-1/2 z-50 pointer-events-none"
                style={{ left: `${hoveredPosition}%` }}
              >
                <div className="bg-card/95 backdrop-blur-xl border border-glass-border rounded-lg p-4 shadow-glow max-w-md">
                  <div className="flex flex-wrap gap-1 text-sm">
                    {getPreviewText(hoveredPosition).map((word, idx) => (
                      <span
                        key={idx}
                        className={`${
                          word.isHighlight 
                            ? "font-bold text-primary bg-primary/20 px-1 rounded" 
                            : "text-muted-foreground"
                        }`}
                      >
                        {word.text}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-glass-border text-xs text-muted-foreground">
                    Position: {Math.round((hoveredPosition / 100) * tokens.length)} / {tokens.length} words
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress bar with chapter segments */}
            <div className="relative">
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                {/* Chapter segments */}
                {showChapterMarkers && chapters.map((chapter, idx) => {
                  const nextChapter = chapters[idx + 1];
                  const width = nextChapter 
                    ? nextChapter.progress - chapter.progress 
                    : 100 - chapter.progress;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 h-full border-l border-border/50 hover:bg-accent/10 transition-colors cursor-pointer group"
                      style={{ 
                        left: `${chapter.progress}%`,
                        width: `${width}%`
                      }}
                      onClick={() => jumpToChapter(idx)}
                      title={chapter.title}
                    >
                      <span className="absolute -bottom-6 left-2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {chapter.title.length > 20 ? chapter.title.substring(0, 20) + '...' : chapter.title}
                      </span>
                    </div>
                  );
                })}
                
                {/* Progress fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <Slider
              value={[progress]}
              onValueChange={([value]) => handleJumpTo(value)}
              max={100}
              step={0.1}
              className="cursor-pointer mt-2"
            />
          </div>
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