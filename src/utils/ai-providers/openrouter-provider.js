import BaseAIProvider from './base-provider';

class OpenRouterProvider extends BaseAIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || OpenRouterProvider.getDefaultModel());
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  static getSupportedModels() {
    return [
      { id: 'openai/gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Via OpenAI' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Via Anthropic' },
      { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Via Google' },
      { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B', description: 'Via Meta' },
      { id: 'mistral/mistral-medium', name: 'Mistral Medium', description: 'Via Mistral AI' }
    ];
  }

  async chat(messages) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': chrome.runtime.getManifest().homepage_url || 'https://github.com',
        'X-Title': chrome.runtime.getManifest().name
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default OpenRouterProvider; 