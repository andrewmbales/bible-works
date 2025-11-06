const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Using unfoldingWord's Hebrew Bible (UHB) in USFM format
const OSHB_BASE_URL = 'https://git.door43.org/unfoldingWord/hbo_uhb/raw/branch/master/';

// All 39 OT books with USFM file codes
const books = [
  { abbr: 'Gen', usfmCode: '01-GEN', name: 'Genesis', chapters: 50 },
  { abbr: 'Exod', usfmCode: '02-EXO', name: 'Exodus', chapters: 40 },
  { abbr: 'Lev', usfmCode: '03-LEV', name: 'Leviticus', chapters: 27 },
  { abbr: 'Num', usfmCode: '04-NUM', name: 'Numbers', chapters: 36 },
  { abbr: 'Deut', usfmCode: '05-DEU', name: 'Deuteronomy', chapters: 34 },
  { abbr: 'Josh', usfmCode: '06-JOS', name: 'Joshua', chapters: 24 },
  { abbr: 'Judg', usfmCode: '07-JDG', name: 'Judges', chapters: 21 },
  { abbr: 'Ruth', usfmCode: '08-RUT', name: 'Ruth', chapters: 4 },
  { abbr: '1Sam', usfmCode: '09-1SA', name: '1 Samuel', chapters: 31 },
  { abbr: '2Sam', usfmCode: '10-2SA', name: '2 Samuel', chapters: 24 },
  { abbr: '1Kgs', usfmCode: '11-1KI', name: '1 Kings', chapters: 22 },
  { abbr: '2Kgs', usfmCode: '12-2KI', name: '2 Kings', chapters: 25 },
  { abbr: '1Chr', usfmCode: '13-1CH', name: '1 Chronicles', chapters: 29 },
  { abbr: '2Chr', usfmCode: '14-2CH', name: '2 Chronicles', chapters: 36 },
  { abbr: 'Ezra', usfmCode: '15-EZR', name: 'Ezra', chapters: 10 },
  { abbr: 'Neh', usfmCode: '16-NEH', name: 'Nehemiah', chapters: 13 },
  { abbr: 'Esth', usfmCode: '17-EST', name: 'Esther', chapters: 10 },
  { abbr: 'Job', usfmCode: '18-JOB', name: 'Job', chapters: 42 },
  { abbr: 'Psa', usfmCode: '19-PSA', name: 'Psalms', chapters: 150 },
  { abbr: 'Prov', usfmCode: '20-PRO', name: 'Proverbs', chapters: 31 },
  { abbr: 'Eccles', usfmCode: '21-ECC', name: 'Ecclesiastes', chapters: 12 },
  { abbr: 'Song', usfmCode: '22-SNG', name: 'Song of Solomon', chapters: 8 },
  { abbr: 'Isa', usfmCode: '23-ISA', name: 'Isaiah', chapters: 66 },
  { abbr: 'Jer', usfmCode: '24-JER', name: 'Jeremiah', chapters: 52 },
  { abbr: 'Lam', usfmCode: '25-LAM', name: 'Lamentations', chapters: 5 },
  { abbr: 'Ezek', usfmCode: '26-EZK', name: 'Ezekiel', chapters: 48 },
  { abbr: 'Dan', usfmCode: '27-DAN', name: 'Daniel', chapters: 12 },
  { abbr: 'Hos', usfmCode: '28-HOS', name: 'Hosea', chapters: 14 },
  { abbr: 'Joel', usfmCode: '29-JOL', name: 'Joel', chapters: 3 },
  { abbr: 'Amos', usfmCode: '30-AMO', name: 'Amos', chapters: 9 },
  { abbr: 'Obad', usfmCode: '31-OBA', name: 'Obadiah', chapters: 1 },
  { abbr: 'Jonah', usfmCode: '32-JON', name: 'Jonah', chapters: 4 },
  { abbr: 'Mic', usfmCode: '33-MIC', name: 'Micah', chapters: 7 },
  { abbr: 'Nahum', usfmCode: '34-NAM', name: 'Nahum', chapters: 3 },
  { abbr: 'Hab', usfmCode: '35-HAB', name: 'Habakkuk', chapters: 3 },
  { abbr: 'Zeph', usfmCode: '36-ZEP', name: 'Zephaniah', chapters: 3 },
  { abbr: 'Hag', usfmCode: '37-HAG', name: 'Haggai', chapters: 2 },
  { abbr: 'Zech', usfmCode: '38-ZEC', name: 'Zechariah', chapters: 14 },
  { abbr: 'Mal', usfmCode: '39-MAL', name: 'Malachi', chapters: 4 },
];

async function fetchOSHBBook(usfmCode) {
  return new Promise((resolve, reject) => {
    const url = `${OSHB_BASE_URL}${usfmCode}.usfm`;
    
    console.log(`    Fetching: ${url}`);
    
    https.get(url, (res) => {
      if (res.statusCode === 404) {
        reject(new Error(`File not found (404): ${url}`));
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Parse USFM format - returns all chapters and verses
          const chaptersData = parseUSFM(data);
          resolve(chaptersData);
        } catch (error) {
          reject(new Error(`Failed to parse USFM for ${usfmCode}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch ${usfmCode}: ${error.message}`));
    });
  });
}

function parseUSFM(usfmText) {
  // Parse USFM format into chapters and verses
  // Returns: { "1": { "1": [[word data], ...], "2": [...] }, "2": { ... } }
  const chapters = {};
  const lines = usfmText.split('\n');
  let currentChapter = null;
  let currentVerse = null;
  let currentText = '';
  
  for (const line of lines) {
    // Chapter marker: \c 1 (note: single backslash in the actual text)
    const chapterMatch = line.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      // Save previous verse if exists
      if (currentChapter && currentVerse && currentText.trim()) {
        if (!chapters[currentChapter]) chapters[currentChapter] = {};
        chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
      }
      currentChapter = chapterMatch[1];
      currentVerse = null;
      currentText = '';
      continue;
    }
    
    // Verse marker: \v 1 (note: may have no space after number)
    const verseMatch = line.match(/^\\v\s+(\d+)\s*(.*)$/);
    if (verseMatch) {
      // Save previous verse if exists
      if (currentChapter && currentVerse && currentText.trim()) {
        if (!chapters[currentChapter]) chapters[currentChapter] = {};
        chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
      }
      currentVerse = verseMatch[1];
      currentText = verseMatch[2];
      continue;
    }
    
    // Continue current verse text (lines starting with \w are word markers)
    if (currentChapter && currentVerse && line.trim() && !line.match(/^\\[a-z]/)) {
      currentText += ' ' + line.trim();
    } else if (currentChapter && currentVerse && line.match(/^\\w\s/)) {
      // Word markers are part of the verse
      currentText += ' ' + line.trim();
    }
  }
  
  // Save last verse
  if (currentChapter && currentVerse && currentText.trim()) {
    if (!chapters[currentChapter]) chapters[currentChapter] = {};
    chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
  }
  
  return chapters;
}

function parseHebrewWords(text) {
  // Parse USFM word markup: \w word|lemma="..." strong="..." x-morph="..."\w*
  const words = [];
  const wordRegex = /\\w\s*([^|]+)\|([^\\]+)\\w\*/g;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[1].trim();
    const attributes = match[2].trim();
    
    // Parse attributes
    const lemmaMatch = attributes.match(/lemma="([^"]+)"/);
    const strongMatch = attributes.match(/strong="([^"]+)"/);
    const morphMatch = attributes.match(/x-morph="([^"]+)"/);
    
    words.push([
      word,
      lemmaMatch ? lemmaMatch[1] : '',
      morphMatch ? morphMatch[1] : '',
      strongMatch ? strongMatch[1] : ''
    ]);
  }
  
  return words;
}

function parseOSHBWord(wordData) {
  // OSHB format: ["word", "lemma", "morph", "strongs"]
  if (Array.isArray(wordData)) {
    return {
      text: wordData[0] || '',
      lemma: wordData[1] || '',
      morph: wordData[2] || '',
      strongs: wordData[3] || ''
    };
  }
  return null;
}

async function importFullBible() {
  try {
    console.log('🚀 Starting full Hebrew Bible import...\n');
    console.log('⚠️  This will take several minutes. Please be patient.\n');

    let totalBooks = 0;
    let totalChapters = 0;
    let totalVerses = 0;
    let totalWords = 0;

    for (const book of books) {
      console.log(`\n📖 Importing ${book.name} (${book.chapters} chapters)...`);
      
      // Create book
      const bookRecord = await prisma.book.upsert({
        where: { name: book.name },
        update: { chapterCount: book.chapters },
        create: {
          name: book.name,
          testament: 'OT',
          chapterCount: book.chapters
        }
      });
      
      totalBooks++;
      
      // Fetch entire book at once (USFM files contain all chapters)
      try {
        console.log(`  📥 Fetching entire book...`);
        const bookData = await fetchOSHBBook(book.usfmCode);
        
        // Process each chapter
        for (let ch = 1; ch <= book.chapters; ch++) {
          const chapterData = bookData[ch.toString()];
          
          if (!chapterData) {
            console.log(`  ⚠️  Chapter ${ch} not found, skipping...`);
            continue;
          }
          
          console.log(`  📄 Processing chapter ${ch}/${book.chapters}...`);
          
          // Process each verse in the chapter
          for (const [verseNum, verseWords] of Object.entries(chapterData)) {
            const verseNumber = parseInt(verseNum);
            
            if (isNaN(verseNumber) || !Array.isArray(verseWords)) {
              continue;
            }

            // Parse words
            const words = [];
            let hebrewText = '';
            
            for (let i = 0; i < verseWords.length; i++) {
              const wordData = parseOSHBWord(verseWords[i]);
              if (wordData && wordData.text) {
                words.push({
                  position: i + 1,
                  text: wordData.text,
                  lemma: wordData.lemma,
                  morph: wordData.morph,
                  gloss: '', // We'll need to add glosses separately
                  strongs: wordData.strongs
                });
                hebrewText += (i > 0 ? ' ' : '') + wordData.text;
              }
            }

            if (words.length > 0) {
              // Create verse with words
              await prisma.verse.upsert({
                where: {
                  bookId_chapter_verse: {
                    bookId: bookRecord.id,
                    chapter: ch,
                    verse: verseNumber
                  }
                },
                update: {
                  text: hebrewText,
                  words: {
                    deleteMany: {},
                    create: words
                  }
                },
                create: {
                  bookId: bookRecord.id,
                  chapter: ch,
                  verse: verseNumber,
                  text: hebrewText,
                  words: {
                    create: words
                  }
                }
              });

              totalVerses++;
              totalWords += words.length;
            }
          }
          
          totalChapters++;
        }
        
        console.log(`  ✅ ${book.name} complete!`);
        
        // Small delay between books
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`    ❌ Error importing ${book.name}: ${error.message}`);
        console.log(`    ⏭️  Skipping to next book...`);
      }
    }

    console.log('\n🎉 Import complete!');
    console.log(`   📚 Books: ${totalBooks}`);
    console.log(`   📑 Chapters: ${totalChapters}`);
    console.log(`   📄 Verses: ${totalVerses}`);
    console.log(`   📝 Words: ${totalWords}`);

  } catch (error) {
    console.error('❌ Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importFullBible();