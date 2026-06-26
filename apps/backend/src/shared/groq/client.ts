import Groq from 'groq-sdk'
import config from '../../config'

// Single platform API key — not per-business. Groq free tier is rate-limited
// but sufficient for the usage volumes at Growth/Business tier.
const groq = new Groq({ apiKey: config.groq.apiKey })

export const MODEL = 'llama3-8b-8192'

export interface GenerationResult {
  text: string
  tokenCount: number
}

export async function generateText(prompt: string): Promise<GenerationResult> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  })

  const text = completion.choices[0]?.message?.content ?? ''
  const tokenCount = completion.usage?.total_tokens ?? 0

  return { text, tokenCount }
}
