# Bible Works

A modern web application for exploring and studying the Bible with advanced search and study tools.

## Features

- Browse books, chapters, and verses
- Search functionality
- Word-by-word analysis
- Responsive design for all devices
- Dark/Light mode support

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Prisma](https://www.prisma.io/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or remote)
- Supabase project (for production)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/bible-works.git
   cd bible-works
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Update the database connection string in `.env`

4. Set up the database
   ```bash
   # Push schema to database
   npm run db:push
   
   # Generate Prisma Client
   npm run db:generate
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio

## Database Schema

The database schema is defined in `prisma/schema.prisma`. It includes:

- Books
- Chapters
- Verses
- Words

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
