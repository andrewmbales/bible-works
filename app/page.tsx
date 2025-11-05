'use client';

import React, { useState, useEffect } from 'react';
import { Search, Book, Info, Loader2, AlertCircle } from 'lucide-react';

interface Word {
  text: string;
  lemma: string;
  morph: string;
  gloss: string;
  strongs: string;
}

interface VerseData {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  words: Word[];
}

const parseMorph = (morph: string) => {
  const parts = {
    prefix: '',
    pos: '',
    details: ''
  };
  
  if (!morph) return parts;
  
  const code = morph.replace('H', '');
  
  let idx = 0;
  while (idx < code.length && 'RTC'.includes(code[idx])) {
    if (code[idx] === 'R') parts.prefix += 'prep+';
    if (code[idx] === 'T') parts.prefix += 'art+';
    if (code[idx] === 'C') parts.prefix += 'conj+';
    idx++;
  }
  
  if (code[idx] === 'V') {
    parts.pos = 'Verb';
    parts.details = code.substring(idx);
  } else if (code[idx] === 'N') {
    parts.pos = 'Noun';
    parts.details = code.substring(idx);
  } else if (code[idx] === 'A') {
    parts.pos = 'Adjective';
  } else if (code[idx] === 'D') {
    parts.pos = 'Adverb';
  } else {
    parts.pos = code.substring(idx);
  }
  
  return parts;
};

const HebrewWord = ({ word, onClick }: { word: Word; onClick: (word: Word) => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const morph = parseMorph(word.morph);
  
  return (
    <span
      className="relative inline-block mx-1 cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick(word)}
    >
      <span className="text-2xl hover:bg-blue-100 px-1 rounded transition-colors">
        {word.text}
      </span>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg z-10">
          <div className="space-y-1">
            <div><strong>Lemma:</strong> {word.lemma}</div>
            <div><strong>Gloss:</strong> {word.gloss}</div>
            <div><strong>POS:</strong> {morph.prefix}{morph.pos}</div>
            {morph.details && <div><strong>Morph:</strong> {morph.details}</div>}
            <div className="text-xs text-gray-400">Strong&apos;s: {word.strongs}</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </span>
  );
};

export default function HebrewBibleViewer() {
  const [selectedVerse, setSelectedVerse] = useState("Gen.1.1");
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableVerses = ["Gen.1.1", "Gen.1.2", "Gen.1.3"];

  useEffect(() => {
    async function fetchVerse() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/verses/${selectedVerse}`);
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
    }
    fetchVerse();
  }, [selectedVerse]);

  const handleWordClick = (word: Word) => {
    setSelectedWord(word);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Hebrew Bible Viewer</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">MVP v0.2</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search (coming soon)..."
                disabled
                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Verses
            </h2>
            <div className="space-y-1">
              {availableVerses.map(verseRef => (
                <button
                  key={verseRef}
                  onClick={() => setSelectedVerse(verseRef)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedVerse === verseRef
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {verseRef}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              <Info className="w-4 h-4 inline mr-1" />
              Hover over Hebrew words for details
            </div>
          </div>

          <div className="col-span-6 bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedVerse}</h2>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading verse...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && verseData && (
              <>
                <div className="bg-amber-50 rounded-lg p-6 mb-6 border border-amber-100">
                  <div className="text-right leading-loose" dir="rtl">
                    {verseData.words.map((word, idx) => (
                      <HebrewWord
                        key={idx}
                        word={word}
                        onClick={handleWordClick}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Word-for-word gloss:</p>
                  <p className="text-gray-700">
                    {verseData.words.map(w => w.gloss).join(' ')}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Word Details</h2>
            {selectedWord ? (
              <div className="space-y-3">
                <div className="text-3xl text-center py-4 bg-blue-50 rounded-lg" dir="rtl">
                  {selectedWord.text}
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Lemma:</span>
                    <div className="text-xl mt-1" dir="rtl">{selectedWord.lemma}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gloss:</span>
                    <div className="text-gray-900">{selectedWord.gloss}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Morphology:</span>
                    <div className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                      {selectedWord.morph}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Strong&apos;s:</span>
                    <div className="text-gray-900">{selectedWord.strongs}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                Click on a Hebrew word to see details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}