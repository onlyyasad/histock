import OpenAI from 'openai'
import config from '../config'

const openai = new OpenAI({ apiKey: config.openai.apiKey })

export const MODEL = 'gpt-4o-mini'

export interface GenerationResult {
  text: string
  tokenCount: number
}

export async function generateText(prompt: string): Promise<GenerationResult> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  })

  const text = completion.choices[0]?.message?.content ?? ''
  const tokenCount = completion.usage?.total_tokens ?? 0

  return { text, tokenCount }
}
