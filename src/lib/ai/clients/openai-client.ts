import type { LLMClient, LLMMessage, LLMCompletionOptions, LLMCompletionResult } from './types'

export class OpenAIClient implements LLMClient {
  private apiKey: string
  private baseUrl = 'https://api.openai.com/v1/chat/completions'
  private maxRetries = 3
  private retryDelay = 2000

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateCompletion(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<LLMCompletionResult> {
    const {
      model = 'gpt-4o',
      maxTokens = 16000,
      temperature = 0.7,
      timeout = 120000,
    } = options

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            max_tokens: maxTokens,
            temperature,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          if (response.status === 429 || response.status === 408 || response.status === 504) {
            throw new Error(`RETRYABLE:${errorText}`)
          }
          throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
        }

        const data = await response.json()
        if (!data.choices?.[0]?.message) {
          throw new Error('Invalid response structure from OpenAI API')
        }

        return {
          content: data.choices[0].message.content.trim(),
          usage: {
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
          },
        }
      } catch (error) {
        lastError = error as Error
        const msg = (error as Error).message || ''
        const isRetryable =
          msg.startsWith('RETRYABLE:') || (error as Error).name === 'AbortError'

        if (isRetryable && attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt - 1))
          continue
        }

        if (!isRetryable) throw error
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
