import OpenAIProvider from './ai-providers/openai-provider';
import ClaudeProvider from './ai-providers/claude-provider';
import OpenRouterProvider from './ai-providers/openrouter-provider';
import SiliconFlowProvider from './ai-providers/siliconflow-provider';

class AIServiceManager {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
  }

  async initialize() {
    const settings = await chrome.storage.sync.get(['aiProvider', 'apiKeys']);
    if (settings.aiProvider && settings.apiKeys?.[settings.aiProvider]) {
      this.setProvider(settings.aiProvider, settings.apiKeys[settings.aiProvider]);
    }
  }

  getProviderClass(providerName) {
    switch (providerName.toLowerCase()) {
      case 'openai': return OpenAIProvider;
      case 'claude': return ClaudeProvider;
      case 'openrouter': return OpenRouterProvider;
      case 'siliconflow': return SiliconFlowProvider;
      default: throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  setProvider(providerName, apiKey, model) {
    const ProviderClass = this.getProviderClass(providerName);
    this.currentProvider = new ProviderClass(apiKey, model);
  }

  getModelsForProvider(providerName) {
    const ProviderClass = this.getProviderClass(providerName);
    return ProviderClass.getSupportedModels();
  }

  async chat(messages) {
    if (!this.currentProvider) {
      throw new Error('No AI provider configured');
    }

    try {
      const response = await this.currentProvider.chat(messages);
      return response;
    } catch (error) {
      console.error(`AI request failed with provider ${this.currentProvider.constructor.name}:`, error);
      
      // 重新抛出带有更多上下文的错误
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  // 获取支持的提供商列表
  getSupportedProviders() {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT API'
      },
      {
        id: 'claude',
        name: 'Claude',
        description: 'Anthropic Claude API'
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'OpenRouter API Gateway'
      },
      {
        id: 'siliconflow',
        name: 'SiliconFlow',
        description: 'SiliconFlow API Service'
      }
    ];
  }
}

export default new AIServiceManager(); 