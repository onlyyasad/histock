import type { AI_GENERATION_TYPES } from './ai.constants'

export type AiGenerationType = (typeof AI_GENERATION_TYPES)[number]

export type IGenerateInput = {
  type: AiGenerationType
  payload: Record<string, string>
}
