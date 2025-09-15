export interface Token {
  text: string;
  isSentenceEnd: boolean;
  index: number;
  chapterIndex?: number;
  chapterTitle?: string;
  paragraphIndex?: number;
}

export interface Chapter {
  title: string;
  startIndex: number;
  endIndex: number;
  progress: number;
}

export function tokenizeText(text: string): { tokens: Token[], chapters: Chapter[] } {
  // First pass: identify chapters and structure
  const lines = text.split('\n');
  const chapters: Chapter[] = [];
  let currentChapterIndex = 0;
  let currentChapterTitle = 'Beginning';
  let currentChapterStart = 0;
  
  // Collect all text with chapter markers
  const structuredText: { text: string; isChapterTitle: boolean }[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine) {
      // Detect chapter headings
      const isChapterTitle = 
        /^(Chapter|Part|Section|Prologue|Epilogue|Introduction|Conclusion)\s+/i.test(trimmedLine) ||
        (/^[IVXLCDM]+[\s.:]/i.test(trimmedLine) && trimmedLine.length < 30) || // Roman numerals
        (/^\d+[\s.:]/i.test(trimmedLine) && trimmedLine.length < 30); // Numbers
      
      if (isChapterTitle) {
        currentChapterTitle = trimmedLine;
        structuredText.push({ text: trimmedLine, isChapterTitle: true });
      } else {
        structuredText.push({ text: trimmedLine, isChapterTitle: false });
      }
    }
  }
  
  // Second pass: tokenize with chapter information
  const tokens: Token[] = [];
  let paragraphIndex = 0;
  let tokenIndex = 0;
  let activeChapterStart = 0;
  let activeChapterTitle = 'Beginning';
  
  for (const { text, isChapterTitle } of structuredText) {
    if (isChapterTitle) {
      // Save previous chapter
      if (tokenIndex > activeChapterStart) {
        chapters.push({
          title: activeChapterTitle,
          startIndex: activeChapterStart,
          endIndex: tokenIndex - 1,
          progress: (activeChapterStart / Math.max(1, tokenIndex)) * 100
        });
      }
      
      activeChapterTitle = text;
      activeChapterStart = tokenIndex;
      currentChapterIndex++;
    }
    
    // Tokenize the text
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    for (const word of words) {
      const isSentenceEnd = /[.!?]$/.test(word);
      
      tokens.push({
        text: word,
        isSentenceEnd,
        index: tokenIndex,
        chapterIndex: currentChapterIndex,
        chapterTitle: activeChapterTitle,
        paragraphIndex
      });
      
      tokenIndex++;
    }
    
    if (!isChapterTitle) {
      paragraphIndex++;
    }
  }
  
  // Add the last chapter
  if (tokenIndex > activeChapterStart || chapters.length === 0) {
    chapters.push({
      title: activeChapterTitle,
      startIndex: activeChapterStart,
      endIndex: tokens.length - 1,
      progress: (activeChapterStart / Math.max(1, tokens.length)) * 100
    });
  }
  
  // Update progress percentages
  chapters.forEach(chapter => {
    chapter.progress = (chapter.startIndex / Math.max(1, tokens.length)) * 100;
  });
  
  return { tokens, chapters };
}

export function getProgressPercentage(currentIndex: number, totalTokens: number): number {
  if (totalTokens === 0) return 0;
  return Math.round((currentIndex / totalTokens) * 100);
}
