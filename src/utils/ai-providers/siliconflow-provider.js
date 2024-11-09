import BaseAIProvider from './base-provider';

class SiliconFlowProvider extends BaseAIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || SiliconFlowProvider.getDefaultModel());
    this.baseURL = 'https://api.siliconflow.com/v1';
  }

  static getSupportedModels() {
    return [
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen/Qwen2.5-7B-Instruct', description: 'Qwen/Qwen2.5-7B-Instruct' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'OpenAI GPT-3.5' },
      { id: 'claude-2', name: 'Claude 2', description: 'Anthropic Claude 2' },
      { id: 'palm2', name: 'PaLM 2', description: 'Google PaLM 2' }
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

    if (!response.ok) {
      throw new Error(`SiliconFlow API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default SiliconFlowProvider; 