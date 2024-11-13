/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/ai-providers/base-provider.js":
/*!*************************************************!*\
  !*** ./src/utils/ai-providers/base-provider.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BaseAIProvider);

/***/ }),

/***/ "./src/utils/ai-providers/claude-provider.js":
/*!***************************************************!*\
  !*** ./src/utils/ai-providers/claude-provider.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _base_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base-provider */ "./src/utils/ai-providers/base-provider.js");


class ClaudeProvider extends _base_provider__WEBPACK_IMPORTED_MODULE_0__["default"] {
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ClaudeProvider);

/***/ }),

/***/ "./src/utils/ai-providers/openai-provider.js":
/*!***************************************************!*\
  !*** ./src/utils/ai-providers/openai-provider.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _base_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base-provider */ "./src/utils/ai-providers/base-provider.js");


class OpenAIProvider extends _base_provider__WEBPACK_IMPORTED_MODULE_0__["default"] {
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (OpenAIProvider);

/***/ }),

/***/ "./src/utils/ai-providers/openrouter-provider.js":
/*!*******************************************************!*\
  !*** ./src/utils/ai-providers/openrouter-provider.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _base_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base-provider */ "./src/utils/ai-providers/base-provider.js");


class OpenRouterProvider extends _base_provider__WEBPACK_IMPORTED_MODULE_0__["default"] {
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (OpenRouterProvider); 

/***/ }),

/***/ "./src/utils/ai-providers/siliconflow-provider.js":
/*!********************************************************!*\
  !*** ./src/utils/ai-providers/siliconflow-provider.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _base_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base-provider */ "./src/utils/ai-providers/base-provider.js");


class SiliconFlowProvider extends _base_provider__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor(apiKey, model) {
    super(apiKey, model || SiliconFlowProvider.getDefaultModel());
    this.baseURL = 'https://api.siliconflow.cn/v1';
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
        stream: false,
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SiliconFlowProvider); 

/***/ }),

/***/ "./src/utils/ai-service-manager.js":
/*!*****************************************!*\
  !*** ./src/utils/ai-service-manager.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _ai_providers_openai_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ai-providers/openai-provider */ "./src/utils/ai-providers/openai-provider.js");
/* harmony import */ var _ai_providers_claude_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ai-providers/claude-provider */ "./src/utils/ai-providers/claude-provider.js");
/* harmony import */ var _ai_providers_openrouter_provider__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ai-providers/openrouter-provider */ "./src/utils/ai-providers/openrouter-provider.js");
/* harmony import */ var _ai_providers_siliconflow_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ai-providers/siliconflow-provider */ "./src/utils/ai-providers/siliconflow-provider.js");





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
      case 'openai': return _ai_providers_openai_provider__WEBPACK_IMPORTED_MODULE_0__["default"];
      case 'claude': return _ai_providers_claude_provider__WEBPACK_IMPORTED_MODULE_1__["default"];
      case 'openrouter': return _ai_providers_openrouter_provider__WEBPACK_IMPORTED_MODULE_2__["default"];
      case 'siliconflow': return _ai_providers_siliconflow_provider__WEBPACK_IMPORTED_MODULE_3__["default"];
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new AIServiceManager()); 

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_ai_service_manager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/ai-service-manager */ "./src/utils/ai-service-manager.js");
// 导入 AI 服务管理器


// 初始化
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认配置
  chrome.storage.sync.set({
    features: {
      adBlocking: true,
      searchReordering: true,
      contextSuggestions: true
    }
  });
});

// 处理来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  if (request.type === 'aiRequest') {
    handleAIRequest(request)
      .then(response => {
        console.log('Sending response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error handling request:', error);
        sendResponse({ error: error.message });
      });
    return true; // 保持消息通道开放
  }
});

// AI 请求处理函数
async function handleAIRequest(request) {
  console.log('Handling AI request:', request);
  try {
    const { provider, model, apiKey, endpoint, data } = request;

    if (!provider || !model || !apiKey) {
      throw new Error('Missing required API configuration');
    }

    // 确保 AI 管理器使用正确的配置
    _utils_ai_service_manager__WEBPACK_IMPORTED_MODULE_0__["default"].setProvider(provider, apiKey, model);

    switch (endpoint) {
      case 'analyzeContent':
        const analysis = await _utils_ai_service_manager__WEBPACK_IMPORTED_MODULE_0__["default"].currentProvider.chat([
          {
            role: 'system',
            content: 'You are an ad detection assistant. Analyze the given HTML content and determine if it is likely an advertisement. Respond with {"isAd": true/false}.'
          },
          {
            role: 'user',
            content: `根据用户的搜索内容：${data.searchQuery}，判断下面的HTML标签内容是否是广告，必须遵循这样的格式回复 {"isAd": true/false} : ${data.content}`
          }
        ]);

        if (!analysis?.choices?.[0]?.message?.content) {
          throw new Error('Invalid API response format');
        }

        try {
          const result = JSON.parse(analysis.choices[0].message.content);
          if (typeof result.isAd !== 'boolean') {
            throw new Error('Invalid response format: isAd must be boolean');
          }
          return { isAd: result.isAd };
        } catch (e) {
          console.error('Failed to parse AI response:', e);
          return { isAd: false };
        }

      case 'calculateRelevance':
        const relevanceAnalysis = await _utils_ai_service_manager__WEBPACK_IMPORTED_MODULE_0__["default"].currentProvider.chat([
          {
            role: 'system',
            content: 'You are a search result relevance analyzer. Calculate the relevance score between the search query and content. Return a JSON response with a score between 0 and 1.'
          },
          {
            role: 'user',
            content: `计算搜索查询"${data.searchQuery}"与以下内容的相关性分数，返回格式 {"relevanceScore": 0.0-1.0}: ${data.content}`
          }
        ]);

        if (!relevanceAnalysis?.choices?.[0]?.message?.content) {
          throw new Error('Invalid API response format');
        }

        try {
          const result = JSON.parse(relevanceAnalysis.choices[0].message.content);
          if (typeof result.relevanceScore !== 'number' ||
            result.relevanceScore < 0 ||
            result.relevanceScore > 1) {
            throw new Error('Invalid relevance score format');
          }
          return { relevanceScore: result.relevanceScore };
        } catch (e) {
          console.error('Failed to parse relevance score:', e);
          return { relevanceScore: 0 };
        }

      case 'analyzeReading':
        try {
          console.log('Processing analyzeReading request:', data);

          const readingAnalysis = await _utils_ai_service_manager__WEBPACK_IMPORTED_MODULE_0__["default"].currentProvider.chat([
            {
              role: 'system',
              content: '你是一个阅读助手。分析给定的内容并提供简洁的摘要和关键点。返回JSON格式，包含摘要和关键词数组。严格按照 {"summary": "...", "keywords": ["关键词1", "关键词2", ...]} 格式返回，不要包含任何其他格式或标记。'
            },
            {
              role: 'user',
              content: `分析以下内容，提供简洁的摘要和关键词。严格按照 {"summary": "...", "keywords": ["关键词1", "关键词2", ...]} 格式返回:\n\n${data.content}`
            }
          ]);

          console.log('AI response:', readingAnalysis);

          if (!readingAnalysis?.choices?.[0]?.message?.content) {
            console.error('Invalid API response format');
            return { summary: '', keywords: [] };
          }

          try {
            // 清理响应内容，移除可能的markdown标记
            const cleanContent = readingAnalysis.choices[0].message.content
              .replace(/```json\s*|```\s*/g, '')  // 移除 ```json 和 ``` 标记
              .trim();  // 移除首尾空白
            
            console.log('Cleaned content:', cleanContent);  // 调试用
            
            const result = JSON.parse(cleanContent);
            if (!result.summary || !Array.isArray(result.keywords)) {
              console.error('Invalid reading analysis format');
              return { summary: '', keywords: [] };
            }
            return result;
          } catch (e) {
            console.error('Failed to parse reading analysis:', e);
            return { summary: '', keywords: [] };
          }
        } catch (error) {
          console.error('Reading analysis failed:', error);
          return { summary: '', keywords: [] };
        }
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  } catch (error) {
    console.error('AI request error:', error);
    throw error;
  }
}

// 注册服务工作进程
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
});

self.addEventListener('fetch', event => {
  // 可以在这里添加网络请求拦截逻辑
});

// 添加标签页更新监听器
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 当页面加载完成时发送消息到content script
    chrome.tabs.sendMessage(tabId, {
      type: 'URL_CHANGED',
      url: tab.url
    }).catch(err => {
      // 忽略如果content script还没有准备好的错误
      console.log('Tab update message failed:', err);
    });
  }
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map