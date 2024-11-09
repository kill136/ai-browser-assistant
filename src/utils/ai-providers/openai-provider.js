import BaseAIProvider from './base-provider';

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || OpenAIProvider.getDefaultModel());
    this.baseURL = 'https://api.openai.com/v1';
  }

  static getSupportedModels() {
    return [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Most capable model' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Most reliable model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'Extended context window' }
    ];
  }

  async chat(messages) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7
      })
    });
    debugger;
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default OpenAIProvider; 