import { patentTerms } from './patent-terms';
import { copyrightTerms } from './copyright-terms';
import { trademarkTerms } from './trademark-terms';
import { designTerms } from './design-terms';
import { treatiesTerms } from './treaties-terms';
import { otherTerms } from './other-terms';
import { DoomscrollTerm } from '@/types/question';

export const allDoomscrollTerms: DoomscrollTerm[] = [
  ...patentTerms,
  ...copyrightTerms,
  ...trademarkTerms,
  ...designTerms,
  ...treatiesTerms,
  ...otherTerms,
];

export { patentTerms, copyrightTerms, trademarkTerms, designTerms, treatiesTerms, otherTerms };
