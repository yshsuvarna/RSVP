import React, { useState, useCallback, useEffect } from "react";
import { parseEpub, ParsedEpub } from "@/lib/epub/parseEpub";
import { tokenizeText, Token, Chapter } from "@/lib/text/tokenize";
import RSVPPlayer from "@/components/RSVPPlayer";
import { BookOpen, Upload, AlertCircle, Sparkles, Zap, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type AppState = "upload" | "parsing" | "ready" | "error";

export default function Index() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [epubData, setEpubData] = useState<ParsedEpub | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".epub")) {
      setError("Please select a valid EPUB file");
      setAppState("error");
      toast({
        title: "Invalid file",
        description: "Please upload an EPUB file",
        variant: "destructive",
      });
      return;
    }

    setAppState("parsing");
    setError("");

    try {
      const parsed = await parseEpub(file);
      setEpubData(parsed);

      const { tokens: tokenized, chapters: extractedChapters } = tokenizeText(parsed.text);
      setTokens(tokenized);
      setChapters(extractedChapters);

      setAppState("ready");
      toast({
        title: "Book loaded successfully!",
        description: `"${parsed.metadata.title}" by ${parsed.metadata.creator}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse EPUB");
      setAppState("error");
      toast({
        title: "Error loading book",
        description: err instanceof Error ? err.message : "Failed to parse EPUB",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRestart = useCallback(() => {
    setAppState("upload");
    setEpubData(null);
    setTokens([]);
    setChapters([]);
    setError("");
    setProgress(0);
  }, []);

  const handleProgressChange = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/20 via-background to-background animate-pulse-glow"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-glass-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur-md opacity-50"></div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
                  RSVP Reader
                </h1>
                <p className="text-sm text-muted-foreground">Speed Reading Reimagined</p>
              </div>
            </div>
            {appState === "ready" && mounted && (
              <Button
                onClick={handleRestart}
                variant="outline"
                className="bg-card/50 backdrop-blur-sm border-glass-border hover:bg-accent/20 hover:shadow-glow transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                New Book
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {appState === "upload" && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-5xl font-display font-bold text-foreground">
                Read <span className="bg-gradient-primary bg-clip-text text-transparent">Faster</span>,
                Remember <span className="bg-gradient-primary bg-clip-text text-transparent">More</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of reading with our advanced Rapid Serial Visual Presentation technology.
                Upload your EPUB and start your speed reading journey.
              </p>
            </div>

            {/* Upload Area */}
            <div 
              className={`relative bg-card/50 backdrop-blur-xl rounded-2xl border-2 ${
                isDragging ? 'border-primary shadow-glow' : 'border-dashed border-glass-border'
              } p-12 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-elegant`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-2xl"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="mx-auto h-24 w-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse-glow">
                  <Upload className="h-12 w-12 text-primary-foreground" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {isDragging ? "Drop your EPUB here" : "Upload Your Book"}
                  </h3>
                  <p className="text-muted-foreground">
                    Drag and drop your EPUB file here, or click to browse
                  </p>
                </div>

                <input
                  type="file"
                  accept=".epub"
                  onChange={handleFileChange}
                  className="hidden"
                  id="epub-upload"
                />
                <label
                  htmlFor="epub-upload"
                  className="cursor-pointer inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-primary-foreground bg-gradient-primary hover:shadow-glow transition-all duration-300 transform hover:scale-105"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose EPUB File
                </label>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Supported format: .epub</p>
                  <p>Maximum file size: 50MB</p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-card/50 backdrop-blur-xl rounded-xl p-6 border border-glass-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Read up to 1000 words per minute with adjustable speed control</p>
              </div>

              <div className="group bg-card/50 backdrop-blur-xl rounded-xl p-6 border border-glass-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Better Focus</h3>
                <p className="text-sm text-muted-foreground">Eliminate distractions with single-word presentation</p>
              </div>

              <div className="group bg-card/50 backdrop-blur-xl rounded-xl p-6 border border-glass-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                  <Clock className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Save Time</h3>
                <p className="text-sm text-muted-foreground">Finish books in a fraction of the usual time</p>
              </div>

              <div className="group bg-card/50 backdrop-blur-xl rounded-xl p-6 border border-glass-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Smart Pacing</h3>
                <p className="text-sm text-muted-foreground">Intelligent pauses at punctuation for better comprehension</p>
              </div>
            </div>
          </div>
        )}

        {appState === "parsing" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-glass-border p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
                <div className="h-10 w-10 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Processing Your Book
              </h2>
              <p className="text-lg text-muted-foreground">
                Extracting and optimizing text for the best reading experience...
              </p>
              <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}

        {appState === "error" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-destructive/10 backdrop-blur-xl rounded-2xl border border-destructive/20 p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-destructive/20 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-3xl font-semibold text-foreground mb-4">
                Oops! Something went wrong
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {error}
              </p>
              <Button
                onClick={handleRestart}
                className="bg-gradient-primary hover:shadow-glow"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {appState === "ready" && epubData && mounted && (
          <div className="space-y-8 animate-fade-in">
            {/* Book Info Card */}
            <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-glass-border overflow-hidden">
              <div className="bg-gradient-primary p-1">
                <div className="bg-card p-6">
                  <div className="flex items-start gap-6">
                    <div className="h-20 w-20 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
                      <BookOpen className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                        {epubData.metadata.title}
                      </h2>
                      <p className="text-xl text-muted-foreground mb-4">
                        by {epubData.metadata.creator}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                          <BookOpen className="h-4 w-4 text-accent" />
                          <span>{tokens.length} words</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                          <Clock className="h-4 w-4 text-accent" />
                          <span>~{Math.round(tokens.length / 300)} min read</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
                          <Zap className="h-4 w-4 text-accent" />
                          <span>{Math.round(epubData.metadata.size / 1024)} KB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RSVP Player */}
            <RSVPPlayer
              tokens={tokens}
              chapters={chapters}
              onProgressChange={handleProgressChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}