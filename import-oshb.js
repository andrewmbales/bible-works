const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// Sample Genesis data - in production you'd fetch from OSHB GitHub
const genesisData = {
  "Gen.1.1": {
    chapter: 1,
    verse: 1,
    text: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    words: [
      { position: 1, text: "בְּרֵאשִׁית", lemma: "רֵאשִׁית", morph: "HR/Ncfsa", gloss: "in beginning", strongs: "H7225" },
      { position: 2, text: "בָּרָא", lemma: "בָּרָא", morph: "HVqp3ms", gloss: "created", strongs: "H1254" },
      { position: 3, text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strongs: "H430" },
      { position: 4, text: "אֵת", lemma: "אֵת", morph: "HTo", gloss: "[marker]", strongs: "H853" },
      { position: 5, text: "הַשָּׁמַיִם", lemma: "שָׁמַיִם", morph: "HTd/Ncmpa", gloss: "the heavens", strongs: "H8064" },
      { position: 6, text: "וְאֵת", lemma: "אֵת", morph: "HC/To", gloss: "and [marker]", strongs: "H853" },
      { position: 7, text: "הָאָרֶץ", lemma: "אֶרֶץ", morph: "HTd/Ncbsa", gloss: "the earth", strongs: "H776" }
    ]
  },
  "Gen.1.2": {
    chapter: 1,
    verse: 2,
    text: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם",
    words: [
      { position: 1, text: "וְהָאָרֶץ", lemma: "אֶרֶץ", morph: "HC/Td/Ncbsa", gloss: "and the earth", strongs: "H776" },
      { position: 2, text: "הָיְתָה", lemma: "הָיָה", morph: "HVqp3fs", gloss: "was", strongs: "H1961" },
      { position: 3, text: "תֹהוּ", lemma: "תֹּהוּ", morph: "HNcmsa", gloss: "formless", strongs: "H8414" },
      { position: 4, text: "וָבֹהוּ", lemma: "בֹּהוּ", morph: "HC/Ncmsa", gloss: "and void", strongs: "H922" },
      { position: 5, text: "וְחֹשֶׁךְ", lemma: "חֹשֶׁךְ", morph: "HC/Ncmsa", gloss: "and darkness", strongs: "H2822" },
      { position: 6, text: "עַל־פְּנֵי", lemma: "פָּנִים", morph: "HR/Ncbpc", gloss: "on face of", strongs: "H6440" },
      { position: 7, text: "תְהוֹם", lemma: "תְּהוֹם", morph: "HNcbsa", gloss: "the deep", strongs: "H8415" },
      { position: 8, text: "וְרוּחַ", lemma: "רוּחַ", morph: "HC/Ncbsc", gloss: "and spirit of", strongs: "H7307" },
      { position: 9, text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strongs: "H430" },
      { position: 10, text: "מְרַחֶפֶת", lemma: "רָחַף", morph: "HVprfsa", gloss: "hovering", strongs: "H7363" },
      { position: 11, text: "עַל־פְּנֵי", lemma: "פָּנִים", morph: "HR/Ncbpc", gloss: "on face of", strongs: "H6440" },
      { position: 12, text: "הַמָּיִם", lemma: "מַיִם", morph: "HTd/Ncmpa", gloss: "the waters", strongs: "H4325" }
    ]
  },
  "Gen.1.3": {
    chapter: 1,
    verse: 3,
    text: "וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי־אוֹר",
    words: [
      { position: 1, text: "וַיֹּאמֶר", lemma: "אָמַר", morph: "HC/Vqw3ms", gloss: "and said", strongs: "H559" },
      { position: 2, text: "אֱלֹהִים", lemma: "אֱלֹהִים", morph: "HNcmpa", gloss: "God", strongs: "H430" },
      { position: 3, text: "יְהִי", lemma: "הָיָה", morph: "HVqj3ms", gloss: "let there be", strongs: "H1961" },
      { position: 4, text: "אוֹר", lemma: "אוֹר", morph: "HNcms", gloss: "light", strongs: "H216" },
      { position: 5, text: "וַיְהִי־אוֹר", lemma: "אוֹר", morph: "HC/Vqw3ms-Ncms", gloss: "and there was light", strongs: "H216" }
    ]
  }
};

async function importData() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');

    // 1. Create the Book
    console.log('📖 Creating book: Genesis');
    const book = await prisma.book.upsert({
      where: { name: 'Genesis' },
      update: {},
      create: {
        name: 'Genesis',
        testament: 'OT',
        chapterCount: 50
      }
    });
    console.log(`✅ Book created: ${book.name} (ID: ${book.id})\n`);

    // 2. Import verses and words
    let verseCount = 0;
    let wordCount = 0;

    for (const [ref, data] of Object.entries(genesisData)) {
      console.log(`📝 Importing ${ref}...`);

      // Create verse
      const verse = await prisma.verse.create({
        data: {
          bookId: book.id,
          chapter: data.chapter,
          verse: data.verse,
          text: data.text,
          words: {
            create: data.words.map(word => ({
              position: word.position,
              text: word.text,
              lemma: word.lemma,
              morph: word.morph,
              gloss: word.gloss,
              strongs: word.strongs
            }))
          }
        },
        include: {
          words: true
        }
      });

      verseCount++;
      wordCount += verse.words.length;
      console.log(`   ✓ Created verse with ${verse.words.length} words`);
    }

    console.log('\n🎉 Import complete!');
    console.log(`   📚 Books: 1`);
    console.log(`   📄 Verses: ${verseCount}`);
    console.log(`   📝 Words: ${wordCount}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importData();