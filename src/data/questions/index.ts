import { patentQuestions } from './patent-questions';
import { copyrightQuestions } from './copyright-questions';
import { trademarkQuestions } from './trademark-questions';
import { designQuestions } from './design-questions';
import { treatiesQuestions } from './treaties-questions';
import { otherQuestions } from './other-questions';
import { Question } from '@/types/question';

export const allQuestions: Question[] = [
  ...patentQuestions,
  ...copyrightQuestions,
  ...trademarkQuestions,
  ...designQuestions,
  ...treatiesQuestions,
  ...otherQuestions,
];

export { patentQuestions, copyrightQuestions, trademarkQuestions, designQuestions, treatiesQuestions, otherQuestions };
