import { NextRequest, NextResponse } from 'next/server';
import { SubjectSlug, TermCategory } from '@/types/question';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const CATEGORY_ORDER: TermCategory[] = ['定義', '手続', '期間', '権利', '要件', '制度', '条約', '比較'];

interface GeneratedTerm {
  term: string;
  reading?: string;
  definition: string;
  subject: SubjectSlug;
  category: TermCategory;
  keyPoint: string;
  difficulty: 1 | 2 | 3;
  relatedKeywords: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'gpt-5-mini';
    const subject = typeof body.subject === 'string' ? body.subject : 'other';
    const count = Math.min(Math.max(Number(body.count) || 3, 1), 5);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required.' }, { status: 400 });
    }

    const prompt = [
      'You are generating Japanese study content for the Intellectual Property Management Skills Test Level 3.',
      `Return exactly ${count} doomscroll study terms as JSON.`,
      `Focus on the subject "${subject}" and use recent reliable web sources when useful.`,
      'Each item must include: term, reading, definition, subject, category, keyPoint, difficulty, relatedKeywords.',
      `category must be one of: ${CATEGORY_ORDER.join(', ')}.`,
      'difficulty must be 1, 2, or 3.',
      'definition and keyPoint must be concise Japanese for learners.',
      'Do not include markdown fences or explanatory prose. Output valid JSON matching {"terms": GeneratedTerm[]}.',
    ].join(' ');

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        tools: [{ type: 'web_search_preview' }],
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'doomscroll_terms',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                terms: {
                  type: 'array',
                  minItems: count,
                  maxItems: count,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      term: { type: 'string' },
                      reading: { type: 'string' },
                      definition: { type: 'string' },
                      subject: { type: 'string', enum: ['patent', 'copyright', 'trademark', 'design', 'treaties', 'other'] },
                      category: { type: 'string', enum: CATEGORY_ORDER },
                      keyPoint: { type: 'string' },
                      difficulty: { type: 'integer', enum: [1, 2, 3] },
                      relatedKeywords: {
                        type: 'array',
                        items: { type: 'string' },
                        maxItems: 4,
                      },
                    },
                    required: ['term', 'definition', 'subject', 'category', 'keyPoint', 'difficulty', 'relatedKeywords'],
                  },
                },
              },
              required: ['terms'],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || 'Generation failed.' }, { status: response.status });
    }

    const data = await response.json();
    const outputText = data.output_text;
    if (!outputText) {
      return NextResponse.json({ error: 'No structured content returned from model.' }, { status: 502 });
    }

    const parsed = JSON.parse(outputText) as { terms: GeneratedTerm[] };
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
