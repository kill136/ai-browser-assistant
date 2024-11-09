class OpenAIAPI {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1';
  }

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey'], (result) => {
        resolve(result.apiKey);
      });
    });
  }

  async makeRequest(endpoint, data) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async analyzeContent(content) {
    return this.makeRequest('/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Analyze this content: ${content}`
        }
      ]
    });
  }
}

export default new OpenAIAPI();
