class BaseAIProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(content) {
    throw new Error('Method not implemented');
  }

  async chat(messages) {
    throw new Error('Method not implemented');
  }

  async complete(prompt) {
    throw new Error('Method not implemented');
  }
}

export default BaseAIProvider;