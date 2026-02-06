import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMMessage, LLMCompletionOptions, LLMCompletionResult } from './types'

export class AnthropicClient implements LLMClient {
  private client: Anthropic
  private maxRetries = 3
  private retryDelay = 2000

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<LLMCompletionResult> {
    const {
      model = 'claude-sonnet-4-5-20250929',
      maxTokens = 16000,
      temperature = 0.7,
    } = options

    const systemMessage = messages.find((m) => m.role === 'system')?.content || ''
    const nonSystemMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemMessage,
          messages: nonSystemMessages,
        })

        const textBlock = response.content.find((b) => b.type === 'text')
        const content = textBlock && 'text' in textBlock ? textBlock.text : ''

        return {
          content: content.trim(),
          usage: {
            prompt_tokens: response.usage.input_tokens,
            completion_tokens: response.usage.output_tokens,
            total_tokens: response.usage.input_tokens + response.usage.output_tokens,
          },
        }
      } catch (error) {
        lastError = error as Error
        const msg = (error as Error).message || ''

        if (msg.includes('rate_limit') || msg.includes('overloaded')) {
          if (attempt < this.maxRetries) {
            await this.sleep(this.retryDelay * Math.pow(2, attempt - 1))
            continue
          }
        }

        if (attempt >= this.maxRetries) throw error
        await this.sleep(this.retryDelay * Math.pow(2, attempt - 1))
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
