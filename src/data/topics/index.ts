import { patentTopics } from './patent-topics';
import { copyrightTopics } from './copyright-topics';
import { trademarkTopics } from './trademark-topics';
import { designTopics } from './design-topics';
import { treatiesTopics } from './treaties-topics';
import { otherTopics } from './other-topics';
import { TopicLesson } from '@/types/question';

export const allTopics: TopicLesson[] = [
  ...patentTopics,
  ...copyrightTopics,
  ...trademarkTopics,
  ...designTopics,
  ...treatiesTopics,
  ...otherTopics,
];

export { patentTopics, copyrightTopics, trademarkTopics, designTopics, treatiesTopics, otherTopics };
