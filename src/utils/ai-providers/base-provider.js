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

  // 获取支持的模型列表
  static getSupportedModels() {
    return [];
  }

  // 获取默认模型
  static getDefaultModel() {
    return this.getSupportedModels()[0]?.id;
  }
}

export default BaseAIProvider; 