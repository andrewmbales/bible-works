import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Book abbreviation mapping
const bookAbbreviations: { [key: string]: string } = {
  'Gen': 'Genesis',
  'Exod': 'Exodus',
  'Lev': 'Leviticus',
  'Num': 'Numbers',
  'Deut': 'Deuteronomy',
  'Josh': 'Joshua',
  'Judg': 'Judges',
  'Ruth': 'Ruth',
  '1Sam': '1 Samuel',
  '2Sam': '2 Samuel',
  '1Kgs': '1 Kings',
  '2Kgs': '2 Kings',
  '1Chr': '1 Chronicles',
  '2Chr': '2 Chronicles',
  'Ezra': 'Ezra',
  'Neh': 'Nehemiah',
  'Esth': 'Esther',
  'Job': 'Job',
  'Psa': 'Psalms',
  'Prov': 'Proverbs',
  'Eccles': 'Ecclesiastes',
  'Song': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Jer': 'Jeremiah',
  'Lam': 'Lamentations',
  'Ezek': 'Ezekiel',
  'Dan': 'Daniel',
  'Hos': 'Hosea',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obad': 'Obadiah',
  'Jonah': 'Jonah',
  'Mic': 'Micah',
  'Nahum': 'Nahum',
  'Hab': 'Habakkuk',
  'Zeph': 'Zephaniah',
  'Hag': 'Haggai',
  'Zech': 'Zechariah',
  'Mal': 'Malachi',
};

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { reference: string } }
) {
  try {
    // This is the correct way to get the reference
    const { reference } = await Promise.resolve(params);
      
    // Now you can use the reference variable
    const match = reference.match(/^([A-Za-z]+)\.(\d+)\.(\d+)$/);
    
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid reference format. Use format: Book.Chapter.Verse (e.g., Gen.1.1)' },
        { status: 400 }
      );
    }

    const [, bookName, chapterStr, verseStr] = match;
    const chapter = parseInt(chapterStr);
    const verse = parseInt(verseStr);

    // Find the book
    const fullBookName = bookAbbreviations[bookName] || bookName;
    console.log('Looking for book:', bookName, '-> mapped to:', fullBookName);
    
    const book = await prisma.book.findUnique({
      where: { name: fullBookName }
    });

    if (!book) {
      return NextResponse.json(
        { error: `Book "${bookName}" not found` },
        { status: 404 }
      );
    }

    // Find the verse with all words
    const verseData = await prisma.verse.findUnique({
      where: {
        bookId_chapter_verse: {
          bookId: book.id,
          chapter,
          verse
        }
      },
      include: {
        words: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!verseData) {
      return NextResponse.json(
        { error: `Verse ${reference} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reference,
      book: book.name,
      chapter: verseData.chapter,
      verse: verseData.verse,
      text: verseData.text,
      words: verseData.words
    });

  } catch (error) {
    console.error('Error fetching verse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}