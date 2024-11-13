// 导入 AI 服务管理器
import aiManager from '../utils/ai-service-manager';

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
    aiManager.setProvider(provider, apiKey, model);

    switch (endpoint) {
      case 'analyzeContent':
        const analysis = await aiManager.currentProvider.chat([
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
        const relevanceAnalysis = await aiManager.currentProvider.chat([
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

          const readingAnalysis = await aiManager.currentProvider.chat([
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
