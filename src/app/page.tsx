"use client";

import React, { useState, useCallback, useEffect } from "react";
import { parseEpub, ParsedEpub } from "@/lib/epub/parseEpub";
import { tokenizeText, Token } from "@/lib/text/tokenize";
import RSVPPlayer from "@/components/RSVPPlayer";

type AppState = "upload" | "parsing" | "ready" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [epubData, setEpubData] = useState<ParsedEpub | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".epub")) {
      setError("Please select a valid EPUB file");
      setAppState("error");
      return;
    }

    setAppState("parsing");
    setError("");

    try {
      const parsed = await parseEpub(file);
      setEpubData(parsed);
      
      const tokenized = tokenizeText(parsed.text);
      setTokens(tokenized);
      
      setAppState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse EPUB");
      setAppState("error");
    }
  }, []);

  const handleRestart = useCallback(() => {
    setAppState("upload");
    setEpubData(null);
    setTokens([]);
    setError("");
    setProgress(0);
  }, []);

  const handleProgressChange = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  // Always render the same structure to prevent hydration issues
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">RSVP Reader</h1>
                <p className="text-sm text-gray-500">Rapid Serial Visual Presentation</p>
              </div>
            </div>
            {appState === "ready" && mounted && (
              <button
                onClick={handleRestart}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Book
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === "upload" && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upload Your EPUB Book
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience reading like never before with our advanced Rapid Serial Visual Presentation technology. 
                Upload an EPUB file to start your personalized reading journey.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                  <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <input
                  type="file"
                  accept=".epub"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="epub-upload"
                />
                <label
                  htmlFor="epub-upload"
                  className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose EPUB File
                </label>
                
                <div className="mt-6 text-sm text-gray-500">
                  <p>Supported formats: .epub</p>
                  <p>Maximum file size: 50MB</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Reading</h3>
                <p className="text-gray-600">Read up to 1000 words per minute with our RSVP technology</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Easy Controls</h3>
                <p className="text-gray-600">Simple play, pause, and navigation controls</p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 mb-4">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Track your reading progress and completion percentage</p>
              </div>
            </div>
          </div>
        )}

        {appState === "parsing" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Processing Your Book
              </h2>
              <p className="text-gray-600">
                We are extracting and optimizing the text from your EPUB file. 
                This usually takes just a few seconds...
              </p>
            </div>
          </div>
        )}

        {appState === "error" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Error Processing File
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <button
                onClick={handleRestart}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {appState === "ready" && epubData && mounted && (
          <div className="space-y-8">
            {/* Book Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {epubData.metadata.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                      by {epubData.metadata.creator}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {Math.round(epubData.metadata.size / 1024)} KB
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {tokens.length} words
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{Math.round(tokens.length / 300)} min read
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RSVP Player */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <RSVPPlayer 
                tokens={tokens} 
                onProgressChange={handleProgressChange}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
