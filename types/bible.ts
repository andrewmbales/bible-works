// types/bible.ts
export interface Word {
  id: string;
  position: number;
  text: string;
  lemma: string;
  morph: string;
  gloss: string;
  strongs: string;
  verseStart?: boolean; // Indicates if this is the first word of a verse
}

export interface VerseData {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  words: Word[];
}

export interface ChapterData {
  bookId: string;
  bookName: string;
  totalChapters: number;
  chapters: number[];
}

export interface Book {
  id: string;
  name: string;
  chapterCount: number;
}