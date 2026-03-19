import { patentFlashcards } from './patent-flashcards';
import { copyrightFlashcards } from './copyright-flashcards';
import { trademarkFlashcards } from './trademark-flashcards';
import { designFlashcards } from './design-flashcards';
import { treatiesFlashcards } from './treaties-flashcards';
import { otherFlashcards } from './other-flashcards';
import { Flashcard } from '@/types/question';

export const allFlashcards: Flashcard[] = [
  ...patentFlashcards,
  ...copyrightFlashcards,
  ...trademarkFlashcards,
  ...designFlashcards,
  ...treatiesFlashcards,
  ...otherFlashcards,
];

export { patentFlashcards, copyrightFlashcards, trademarkFlashcards, designFlashcards, treatiesFlashcards, otherFlashcards };
