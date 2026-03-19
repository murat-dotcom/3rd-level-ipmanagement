import { Question } from '@/types/question';

// International treaties (条約) questions
export const treatiesQuestions: Question[] = [
  {
    id: 'treaties-001',
    subject: 'treaties',
    topic: 'パリ条約',
    type: 'gakka',
    difficulty: 2,
    question: 'パリ条約に基づく優先権の期間について、正しいものはどれか。',
    choices: [
      '特許および実用新案は12か月、意匠および商標は6か月',
      '特許および実用新案は6か月、意匠および商標は12か月',
      'すべての産業財産権について12か月',
    ],
    correctIndex: 0,
    explanation:
      'パリ条約第4条C(1)により、優先期間は特許および実用新案については12か月、意匠および商標については6か月と定められています。優先権を主張して他の同盟国に出願する場合、この期間内に出願しなければなりません。特許・実用新案と意匠・商標で期間が異なる点が重要なポイントです。',
    keyPoint: '優先期間：特許・実用新案＝12か月、意匠・商標＝6か月',
    relatedArticle: 'パリ条約第4条',
    tags: ['パリ条約', '優先権', '優先期間'],
  },
  {
    id: 'treaties-002',
    subject: 'treaties',
    topic: 'PCT',
    type: 'gakka',
    difficulty: 2,
    question: '特許協力条約（PCT）に基づく国際出願について、正しいものはどれか。',
    choices: [
      'PCT国際出願をすれば、自動的にすべての指定国で特許が付与される',
      'PCT国際出願は一つの出願で複数の国への出願の効果を得ることができるが、特許の付与は各国の国内段階で行われる',
      'PCT国際出願の国内移行期限は優先日から12か月である',
    ],
    correctIndex: 1,
    explanation:
      'PCT（特許協力条約）に基づく国際出願は、一つの出願により複数の指定国への出願の効果を得ることができますが、実際の特許付与は各国の国内段階における審査を経て行われます。国際出願だけで自動的に特許が付与されるわけではありません。また、国内移行期限は優先日から原則30か月です（PCT第22条）。',
    keyPoint: 'PCT国際出願は出願効果のみ、特許付与は各国の国内審査で決定',
    relatedArticle: 'PCT第11条、第22条',
    tags: ['PCT', '国際出願', '国内段階'],
  },
];
