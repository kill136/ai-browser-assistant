import BaseAIProvider from './base-provider';

class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || ClaudeProvider.getDefaultModel());
    this.baseURL = 'https://api.anthropic.com/v1';
  }

  static getSupportedModels() {
    return [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable model' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
      { id: 'claude-3-haiku-20240229', name: 'Claude 3 Haiku', description: 'Fast responses' },
      { id: 'claude-2.1', name: 'Claude 2.1', description: 'Previous generation' }
    ];
  }

  async chat(messages) {
    // 将消息格式转换为 Claude 格式
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default ClaudeProvider; 