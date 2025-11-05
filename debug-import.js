const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    
    // Test query
    const books = await prisma.book.findMany();
    console.log(`📚 Found ${books.length} books in the database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (error.code === 'P1001') {
      console.error('Cannot reach database server. Check your connection string and network.');
    } else if (error.code === 'P1012') {
      console.error('Schema validation error. Make sure your database matches your Prisma schema.');
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ Connection test successful! You can now run the import script.');
  } else {
    console.log('❌ Connection test failed. Please check the error messages above.');
  }
});