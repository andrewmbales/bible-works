import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string }> }
) {
  try {
    const { book: bookName } = await params;
    
    const book = await prisma.book.findFirst({
      where: { 
        OR: [
          { name: { equals: bookName, mode: 'insensitive' } },
          { name: { contains: bookName, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, chapterCount: true }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bookId: book.id,
      bookName: book.name,
      totalChapters: book.chapterCount,
      chapters: Array.from({ length: book.chapterCount }, (_, i) => i + 1)
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}