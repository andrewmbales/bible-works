// components/ChapterNavigator.tsx
import { Loader2 } from 'lucide-react';
import { useCallback } from 'react';

interface ChapterNavigatorProps {
  chapters: number[];
  currentChapter: number;
  isLoading: boolean;
  onChapterSelect: (chapter: number) => void;
  currentBook: string;
}

export const ChapterNavigator = ({
  chapters,
  currentChapter,
  isLoading,
  onChapterSelect,
  currentBook
}: ChapterNavigatorProps) => {
  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Jump to Chapter
      </h3>
      <div className="flex flex-wrap gap-2">
        {chapters.map((chapter) => (
          <button
            key={chapter}
            onClick={() => onChapterSelect(chapter)}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
              chapter === currentChapter
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            aria-label={`${currentBook} Chapter ${chapter}`}
          >
            {chapter}
          </button>
        ))}
      </div>
    </div>
  );
};