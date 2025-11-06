// app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Copy } from 'lucide-react';
import { ChevronLeft, ChevronRight, Book, Search, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { ChapterNavigator } from '@/components/ChapterNavigator';
import type { Word, VerseData } from '@/types/bible';
import { BookSelector } from '@/components/BookSelector';
import { VerseSkeleton } from '@/components/VerseSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const DEFAULT_VERSE = 'Gen.1.1';

export default function HebrewBibleViewer() {
  const router = useRouter();
  const [selectedVerse, setSelectedVerse] = useState(DEFAULT_VERSE);
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerseNum, setCurrentVerseNum] = useState(1);
  const [chapters, setChapters] = useState<number[]>([]);
  const [availableVerses, setAvailableVerses] = useState<number[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  

  // Parse reference and update state
  useEffect(() => {
    const [book, chapter, verse] = selectedVerse.split('.');
    setCurrentBook(book);
    setCurrentChapter(parseInt(chapter));
    setCurrentVerseNum(parseInt(verse));
  }, [selectedVerse]);

  // Update available verses when chapter changes
  useEffect(() => {
    if (currentChapter > 0) {
      // Create an array of verse numbers (1 to verseCount)
      // For now, using a default of 30 verses per chapter
      // You might want to fetch the actual verse count from your API
      const verseCount = 30; // Default verse count, adjust as needed
      const verses = Array.from({ length: verseCount }, (_, i) => i + 1);
      setAvailableVerses(verses);
    }
  }, [currentChapter]);

  // Load chapters when book changes
  useEffect(() => {
    const loadChapters = async () => {
      if (!currentBook) return;
      
      setIsLoadingChapters(true);
      try {
        const response = await fetch(`/api/books/${currentBook}/chapters`);
        if (response.ok) {
          const data = await response.json();
          setChapters(data.chapters);
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        setIsLoadingChapters(false);
      }
    };
    
    loadChapters();
  }, [currentBook]);

  // Fetch verse data
  const fetchVerse = useCallback(async (verseRef: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/verses/${verseRef}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load verse');
      }
      const data = await response.json();
      setVerseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verse');
      setVerseData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerse(selectedVerse);
  }, [selectedVerse, fetchVerse]);

  
  const navigateToAdjacentVerse = useCallback(async (direction: number) => {
    const nextVerseNum = currentVerseNum + direction;
    const reference = `${currentBook}.${currentChapter}.${nextVerseNum}`;
    
    try {
      const response = await fetch(`/api/verses/${reference}`);
      if (response.ok) {
        setSelectedVerse(reference);
      }
    } catch (error) {
      console.error('Error navigating verses:', error);
    }
  }, [currentBook, currentChapter, currentVerseNum]);

  const handleChapterSelect = useCallback((chapter: number) => {
  // Validate chapter number
  if (chapter < 1) {
    console.warn('Chapter number cannot be less than 1');
    return;
  }

  // Add this effect to your component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    if (document.activeElement?.tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowLeft':
        if (currentVerseNum > 1) {
          navigateToAdjacentVerse(-1);
        } else if (currentChapter > 1) {
          // Go to last verse of previous chapter
          handleChapterSelect(currentChapter - 1);
          // We'll need to know the last verse number of the previous chapter
          // You might need to fetch this or have it in state
        }
        break;
      case 'ArrowRight':
        navigateToAdjacentVerse(1);
        break;
      case 'ArrowUp':
        if (currentChapter > 1) {
          handleChapterSelect(currentChapter - 1);
        }
        break;
      case 'ArrowDown':
        if (currentChapter < chapters[chapters.length - 1]) {
          handleChapterSelect(currentChapter + 1);
        }
        break;
      case 'Escape':
        setSelectedWord(null);
        break;
      default:
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentChapter, currentVerseNum, chapters, navigateToAdjacentVerse, handleChapterSelect]);


// Get the current book's chapter count (you'll need to pass this as a prop or from state)
  const maxChapter = chapters.length > 0 ? Math.max(...chapters) : 50; // Fallback to 50 if chapters not loaded
  
  if (chapter > maxChapter) {
    console.warn(`Chapter number cannot exceed ${maxChapter} for ${currentBook}`);
    return;
  }

  // Update all related states
  setCurrentChapter(chapter);
  setCurrentVerseNum(1); // Reset to first verse of the new chapter
  setSelectedVerse(`${currentBook}.${chapter}.1`);
  
  // Optional: Scroll to top of the content area when changing chapters
  const contentArea = document.getElementById('verse-content');
  if (contentArea) {
    contentArea.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, [currentBook, chapters]); // Add dependencies

  const handleWordClick = useCallback((word: Word) => {
    setSelectedWord(word);
  }, []);

  // Add this state
const [copied, setCopied] = useState(false);

const copyToClipboard = () => {
  const verseRef = `${currentBook} ${currentChapter}:${currentVerseNum}`;
  navigator.clipboard.writeText(verseRef);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

{loading ? (
  <div className="space-y-6 p-6">
    <VerseSkeleton />
    <VerseSkeleton />
  </div>
) : (
  // Your existing verse content
  <div>Your verse content here</div>
)}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hebrew Bible Viewer</h1>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">MVP v0.3</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search (coming soon)..."
                disabled
                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateToAdjacentVerse(-1)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              disabled={currentVerseNum <= 1}
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {currentBook} {currentChapter}:{currentVerseNum}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a verse to view details</p>
            </div>
            
            <button 
              onClick={() => navigateToAdjacentVerse(1)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title="Copy reference to clipboard"
            >
              <Copy className="w-4 h-4" />
  {copied ? 'Copied!' : 'Copy Ref'}
</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Verse Navigator */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Navigation
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Book
              </label>
              <BookSelector 
                onSelect={(bookName) => setCurrentBook(bookName)}
                currentBook={currentBook}
    />
  </div>
            
            <ChapterNavigator 
              chapters={chapters}
              currentChapter={currentChapter}
              isLoading={isLoadingChapters}
              onChapterSelect={handleChapterSelect}
              currentBook={currentBook}
            />
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verses
              </h3>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {availableVerses.map((verseNum) => (
                  <button
                    key={verseNum}
                    onClick={() => setSelectedVerse(`${currentBook}.${currentChapter}.${verseNum}`)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                      selectedVerse === `${currentBook}.${currentChapter}.${verseNum}`
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {verseNum}
                  </button>
                ))}
              </div>
            </div>
          </div>

         {/* Verse Display */}
<div 
  id="verse-content" 
  className="col-span-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 overflow-y-auto max-h-[80vh]"
>
  {loading && (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading verse...</span>
    </div>
  )}

  {error && (
    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
      <AlertCircle className="w-5 h-5" />
      <span>{error}</span>
    </div>
  )}

  {!loading && !error && verseData && (
    <>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 mb-6 border border-amber-100 dark:border-amber-800/30">
        <div className="text-right leading-loose" dir="rtl">
          {verseData.words.reduce((acc, word, idx) => {
      // Add verse number if this is the first word of a verse
      if (idx === 0 || word.verseStart) {
        acc.push(
          <span 
            key={`verse-${verseData.verse}`} 
            className="verse-number mr-2 text-blue-600 dark:text-blue-400 font-bold"
            style={{ unicodeBidi: 'plaintext' }}
          >
            {verseData.verse}׃
          </span>
        );
      }
      
      // Add the word
      acc.push(
        <span
          key={`word-${idx}`}
          onClick={() => handleWordClick(word)}
          className={`cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 mx-0.5 ${
            selectedWord?.id === word.id ? 'font-bold text-blue-700 dark:text-blue-300' : ''
          }`}
        >
          {word.text}
        </span>
      );
      
      return acc;
    }, [] as React.ReactNode[])}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">Word-for-word gloss:</p>
        <p className="text-gray-800 dark:text-gray-200">
          {verseData.words.map((w, i) => (
            <span
              key={i}
              className={`cursor-pointer hover:underline ${
                selectedWord?.id === w.id ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
              }`}
              onClick={() => handleWordClick(w)}
            >
              {w.gloss || w.text}{' '}
            </span>
          ))}
        </p>
      </div>
    </>
  )}
</div>

          {/* Word Details Panel */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Word Details</h2>
            {selectedWord ? (
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 text-right" dir="rtl">
                  {selectedWord.text}
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Lemma:</span>
                    <div className="text-xl mt-1 text-right" dir="rtl">{selectedWord.lemma}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Gloss:</span>
                    <div className="text-gray-900 dark:text-gray-100">{selectedWord.gloss}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Morphology:</span>
                    <div className="text-gray-900 dark:text-gray-100 font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                      {selectedWord.morph}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Strong's:</span>
                    <div className="text-gray-900 dark:text-gray-100 font-mono">{selectedWord.strongs}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                Click on a Hebrew word to see details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}