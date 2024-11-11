import BaseAIProvider from './base-provider';

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseURL = 'https://api.openai.com/v1';
  }

  async chat(messages) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default OpenAIProvider;