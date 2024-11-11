import BaseAIProvider from './base-provider';

class ClaudeProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.baseURL = 'https://api.anthropic.com/v1';
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
        model: 'claude-3-opus-20240229',
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