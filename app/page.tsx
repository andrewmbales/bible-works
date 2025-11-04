'use client';

import React, { useState } from 'react';
import { Search, Book, Info } from 'lucide-react';

// Sample data structure based on OSHB format
// In production, this would come from your database
const sampleVerses = {
  "Gen.1.1": {
    text: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    words: [
      { text: "בְּרֵאשִׁית", lemma: "רֵאשִׁית", morph: "HR/Ncfsa", gloss: "in beginning", strong: "H7225" },
      { text: "בָּרָא", lemma: "בָּרָא", morph: "HVqp3ms", gloss: "created", strong: "H1254" },
      { text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strong: "H430" },
      { text: "אֵת", lemma: "אֵת", morph: "HTo", gloss: "[marker]", strong: "H853" },
      { text: "הַשָּׁמַיִם", lemma: "שָׁמַיִם", morph: "HTd/Ncmpa", gloss: "the heavens", strong: "H8064" },
      { text: "וְאֵת", lemma: "אֵת", morph: "HC/To", gloss: "and [marker]", strong: "H853" },
      { text: "הָאָרֶץ", lemma: "אֶרֶץ", morph: "HTd/Ncbsa", gloss: "the earth", strong: "H776" }
    ]
  },
  "Gen.1.2": {
    text: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם",
    words: [
      { text: "וְהָאָרֶץ", lemma: "אֶרֶץ", morph: "HC/Td/Ncbsa", gloss: "and the earth", strong: "H776" },
      { text: "הָיְתָה", lemma: "הָיָה", morph: "HVqp3fs", gloss: "was", strong: "H1961" },
      { text: "תֹהוּ", lemma: "תֹּהוּ", morph: "HNcmsa", gloss: "formless", strong: "H8414" },
      { text: "וָבֹהוּ", lemma: "בֹּהוּ", morph: "HC/Ncmsa", gloss: "and void", strong: "H922" },
      { text: "וְחֹשֶׁךְ", lemma: "חֹשֶׁךְ", morph: "HC/Ncmsa", gloss: "and darkness", strong: "H2822" },
      { text: "עַל־פְּנֵי", lemma: "פָּנִים", morph: "HR/Ncbpc", gloss: "on face of", strong: "H6440" },
      { text: "תְהוֹם", lemma: "תְּהוֹם", morph: "HNcbsa", gloss: "the deep", strong: "H8415" },
      { text: "וְרוּחַ", lemma: "רוּחַ", morph: "HC/Ncbsc", gloss: "and spirit of", strong: "H7307" },
      { text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strong: "H430" },
      { text: "מְרַחֶפֶת", lemma: "רָחַף", morph: "HVprfsa", gloss: "hovering", strong: "H7363" },
      { text: "עַל־פְּנֵי", lemma: "פָּנִים", morph: "HR/Ncbpc", gloss: "on face of", strong: "H6440" },
      { text: "הַמָּיִם", lemma: "מַיִם", morph: "HTd/Ncmpa", gloss: "the waters", strong: "H4325" }
    ]
  },
  "Gen.1.3": {
    text: "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי־אוֹר",
    words: [
      { text: "וַיֹּאמֶר", lemma: "אָמַר", morph: "HC/Vqw3ms", gloss: "and said", strong: "H559" },
      { text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strong: "H430" },
      { text: "יְהִי", lemma: "הָיָה", morph: "HVqj3ms", gloss: "let there be", strong: "H1961" },
      { text: "אוֹר", lemma: "אוֹר", morph: "HNcms", gloss: "light", strong: "H216" },
      { text: "וַיְהִי־אוֹר", lemma: "אוֹר", morph: "HC/Vqw3ms-Ncms", gloss: "and there was light", strong: "H216" }
    ]
  }
};

interface Word {
  text: string;
  lemma: string;
  morph: string;
  gloss: string;
  strong: string;
}

const parseMorph = (morph: string) => {
  // Simplified morphology parser for OSHB format
  const parts = {
    prefix: '',
    pos: '',
    details: ''
  };
  
  if (!morph) return parts;
  
  // Remove 'H' prefix
  const code = morph.replace('H', '');
  
  // Parse prefix (R=preposition, T=article, C=conjunction)
  let idx = 0;
  while (idx < code.length && 'RTC'.includes(code[idx])) {
    if (code[idx] === 'R') parts.prefix += 'prep+';
    if (code[idx] === 'T') parts.prefix += 'art+';
    if (code[idx] === 'C') parts.prefix += 'conj+';
    idx++;
  }
  
  // Part of speech
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
            <div className="text-xs text-gray-400">Strong&apos;s: {word.strong}</div>
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
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const currentVerse = sampleVerses[selectedVerse as keyof typeof sampleVerses];
  const verseList = Object.keys(sampleVerses);

  const handleWordClick = (word: Word) => {
    setSelectedWord(word);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Hebrew Bible Viewer</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">MVP v0.1</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search (coming soon)..."
                disabled
                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Verse Navigator */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Verses
            </h2>
            <div className="space-y-1">
              {verseList.map(verseRef => (
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

          {/* Main Text Display */}
          <div className="col-span-6 bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{selectedVerse}</h2>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-6 mb-6 border border-amber-100">
              <div className="text-right leading-loose" dir="rtl">
                {currentVerse.words.map((word, idx) => (
                  <HebrewWord
                    key={idx}
                    word={word}
                    onClick={handleWordClick}
                  />
                ))}
              </div>
            </div>

            {/* English Gloss */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-2">Word-for-word gloss:</p>
              <p className="text-gray-700">
                {currentVerse.words.map(w => w.gloss).join(' ')}
              </p>
            </div>
          </div>

          {/* Word Details Panel */}
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
                    <div className="text-gray-900">{selectedWord.strong}</div>
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