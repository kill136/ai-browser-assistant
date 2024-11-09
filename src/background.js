// 导入 AI 服务管理器
import aiManager from './utils/ai-service-manager';

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
debugger  
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
    aiManager.setProvider(provider, apiKey, model);
    
    switch (endpoint) {
      case 'aiRequest':
        const analysis = await aiManager.currentProvider.chat([
          {
            role: 'system',
            content: 'You are an ad detection assistant. Analyze the given HTML content and determine if it is likely an advertisement. Respond with {"isAd": true/false}.'
          },
          {
            role: 'user',
            content: `Analyze this content for ad characteristics: ${data.content}`
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
