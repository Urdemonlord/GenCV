import { GoogleGenAI } from '@google/genai';
import { postprocess } from './postprocess';
import { buildPrompt } from './prompts';
import { AI_OUTPUTS, type AiInput, type AiOutput, type AiTask } from './tasks';

/** Server only: the single place GenCV talks to a model. */

const MODEL = 'gemini-2.5-flash';

let client: GoogleGenAI | null = null;

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate<T extends AiTask>(task: T, input: AiInput<T>): Promise<AiOutput<T>> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { systemInstruction, contents, responseJsonSchema } = buildPrompt(task, input);
  const response = await client.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema,
      temperature: 0.4,
      maxOutputTokens: 2048,
      // Short rewriting tasks: thinking adds latency and cost without better results.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const output = AI_OUTPUTS[task].parse(JSON.parse(response.text ?? '')) as AiOutput<T>;
  return postprocess(task, input, output);
}
