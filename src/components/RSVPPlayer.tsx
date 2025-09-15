import React, { useState, useEffect, useRef } from "react";
import { Token, getProgressPercentage } from "@/lib/text/tokenize";
import { getPauseMultiplier } from "@/lib/util/pause";

interface RSVPPlayerProps {
  tokens: Token[];
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
    } else {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentIndex, tokens, wpm, mounted]);

  const handlePlayPause = () => {
    if (currentIndex >= tokens.length) {
      // If at the end, restart
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < tokens.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No text available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Current word display */}
      <div className="text-center mb-12">
        <div className="relative">
          <div className="text-6xl font-bold text-gray-900 mb-4 min-h-[120px] flex items-center justify-center">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {mounted ? (currentToken?.text || "") : ""}
            </span>
          </div>
          {currentToken?.isSentenceEnd && mounted && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* WPM slider */}
      <div className="mb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-medium text-gray-900">
              Reading Speed
            </label>
            <div className="bg-gray-100 rounded-full px-4 py-2">
              <span className="text-gray-900 font-semibold text-lg">{wpm} WPM</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="range"
              min={100}
              max={1000}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="group relative px-6 py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Previous</span>
          </div>
        </button>

        <button
          onClick={handlePlayPause}
          className="group relative px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
        >
          <div className="flex items-center gap-3">
            {isPlaying ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pause</span>
              </>
            ) : currentIndex >= tokens.length ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restart</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Play</span>
              </>
            )}
          </div>
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= tokens.length - 1}
          className="group relative px-6 py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={handleRestart}
          className="group relative px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">Reset</span>
          </div>
        </button>
      </div>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span className="font-medium">Progress: {progress}%</span>
          <span className="font-medium">{currentIndex + 1} / {tokens.length} words</span>
        </div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status info */}
      <div className="text-center mt-8">
        <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full px-6 py-3">
          <div className={`w-3 h-3 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
          <span className="text-gray-700 font-medium">
            {isPlaying ? "Reading..." : "Paused"}
          </span>
          {currentToken?.isSentenceEnd && mounted && (
            <span className="text-blue-600 font-medium"> End of sentence</span>
          )}
        </div>
      </div>
    </div>
  );
}
