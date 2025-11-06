const https = require('https');

const OSHB_BASE_URL = 'https://git.door43.org/unfoldingWord/hbo_uhb/raw/branch/master/';

async function fetchAndInspect() {
  return new Promise((resolve, reject) => {
    const url = `${OSHB_BASE_URL}01-GEN.usfm`;
    
    console.log('🔍 Fetching Genesis from:', url);
    console.log('');
    
    https.get(url, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Data received: ${data.length} bytes\n`);
        
        // Show first 2000 characters
        console.log('📄 First 2000 characters:');
        console.log('='.repeat(80));
        console.log(data.substring(0, 2000));
        console.log('='.repeat(80));
        
        // Analyze structure
        console.log('\n🔍 Structure Analysis:');
        const lines = data.split('\n');
        console.log(`Total lines: ${lines.length}`);
        
        // Find chapter markers
        const chapterLines = lines.filter(l => l.match(/^\\c \d+/));
        console.log(`Chapter markers found: ${chapterLines.length}`);
        if (chapterLines.length > 0) {
          console.log(`First 5 chapter markers:`);
          chapterLines.slice(0, 5).forEach(l => console.log(`  ${l}`));
        }
        
        // Find verse markers
        const verseLines = lines.filter(l => l.match(/^\\v \d+/));
        console.log(`\nVerse markers found: ${verseLines.length}`);
        if (verseLines.length > 0) {
          console.log(`First 5 verse markers:`);
          verseLines.slice(0, 5).forEach(l => console.log(`  ${l.substring(0, 100)}...`));
        }
        
        // Find word markers
        const wordMatches = data.match(/\\w\s*[^|]+\|[^\\]+\\w\*/g);
        console.log(`\nWord markers found: ${wordMatches ? wordMatches.length : 0}`);
        if (wordMatches && wordMatches.length > 0) {
          console.log(`First 5 word markers:`);
          wordMatches.slice(0, 5).forEach(w => console.log(`  ${w}`));
        }
        
        // Try parsing
        console.log('\n🧪 Testing parse function...');
        try {
          const parsed = parseUSFM(data);
          console.log(`Chapters parsed: ${Object.keys(parsed).length}`);
          
          if (Object.keys(parsed).length > 0) {
            const firstChapter = Object.keys(parsed)[0];
            console.log(`\nFirst chapter: ${firstChapter}`);
            console.log(`Verses in first chapter: ${Object.keys(parsed[firstChapter]).length}`);
            
            if (Object.keys(parsed[firstChapter]).length > 0) {
              const firstVerse = Object.keys(parsed[firstChapter])[0];
              console.log(`\nFirst verse (${firstChapter}:${firstVerse}):`);
              console.log(`Words: ${parsed[firstChapter][firstVerse].length}`);
              console.log(`First word data:`, parsed[firstChapter][firstVerse][0]);
            }
          }
        } catch (error) {
          console.error('❌ Parse error:', error.message);
        }
        
        resolve();
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function parseUSFM(usfmText) {
  const chapters = {};
  const lines = usfmText.split('\n');
  let currentChapter = null;
  let currentVerse = null;
  let currentText = '';
  
  for (const line of lines) {
    const chapterMatch = line.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      if (currentChapter && currentVerse && currentText.trim()) {
        if (!chapters[currentChapter]) chapters[currentChapter] = {};
        chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
      }
      currentChapter = chapterMatch[1];
      currentVerse = null;
      currentText = '';
      continue;
    }
    
    const verseMatch = line.match(/^\\v\s+(\d+)\s*(.*)$/);
    if (verseMatch) {
      if (currentChapter && currentVerse && currentText.trim()) {
        if (!chapters[currentChapter]) chapters[currentChapter] = {};
        chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
      }
      currentVerse = verseMatch[1];
      currentText = verseMatch[2];
      continue;
    }
    
    if (currentChapter && currentVerse && line.trim() && !line.match(/^\\[a-z]/)) {
      currentText += ' ' + line.trim();
    } else if (currentChapter && currentVerse && line.match(/^\\w\s/)) {
      currentText += ' ' + line.trim();
    }
  }
  
  if (currentChapter && currentVerse && currentText.trim()) {
    if (!chapters[currentChapter]) chapters[currentChapter] = {};
    chapters[currentChapter][currentVerse] = parseHebrewWords(currentText.trim());
  }
  
  return chapters;
}

function parseHebrewWords(text) {
  const words = [];
  const wordRegex = /\\w\s*([^|]+)\|([^\\]+)\\w\*/g;
  let match;
  
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[1].trim();
    const attributes = match[2].trim();
    
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

fetchAndInspect()
  .then(() => console.log('\n✅ Test complete!'))
  .catch(err => console.error('\n❌ Error:', err));