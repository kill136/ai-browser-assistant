/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
console.log('Background script initializing...');

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  // 初始化存储的默认值
  chrome.storage.sync.set({
    features: {
      adBlocking: true,
      searchReordering: true,
      contextSuggestions: true
    },
    aiProvider: 'siliconflow',
    aiModel: 'qwen/qwen-turbo',
    apiKeys: {}
  });
});

// 处理 AI 请求
async function handleAIRequest(request) {
  const { provider, model, apiKey, endpoint, data } = request;
  
  try {
    // 根据不同的 AI 提供商处理请求
    switch (provider) {
      case 'siliconflow':
        return await handleSiliconFlowRequest(endpoint, data, apiKey);
      case 'openai':
        return await handleOpenAIRequest(model, data, apiKey);
      case 'claude':
        return await handleClaudeRequest(model, data, apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error('AI request failed:', error);
    throw error;
  }
}

// SiliconFlow API 请求处理
async function handleSiliconFlowRequest(endpoint, data, apiKey) {
  console.log('SiliconFlow API 请求处理')
  const response = await fetch(`https://api.siliconflow.cn/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  });
  console.log(JSON.stringify(data))
  if (!response.ok) {
    throw new Error(`SiliconFlow API error: ${response.status}`);
  }

  return await response.json();
}

// OpenAI API 请求处理
async function handleOpenAIRequest(model, data, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: data.messages
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return await response.json();
}

// Claude API 请求处理
async function handleClaudeRequest(model, data, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      messages: data.messages
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  return await response.json();
}

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugger;
  console.log('Received message:', request);

  if (request.type === 'aiRequest') {
    handleAIRequest(request)
      .then(response => {
        console.log('AI response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ error: error.message });
      });
    return true; // 保持消息通道开放
  }

  // 处理其他类型的消息
  if (request.type === 'updateFeature') {
    chrome.storage.sync.get('features', (data) => {
      const features = data.features || {};
      features[request.feature] = request.enabled;
      chrome.storage.sync.set({ features });
    });
  }

  if (request.type === 'getStats') {
    chrome.storage.local.get('dailyStats', (data) => {
      sendResponse(data.dailyStats || {});
    });
    return true;
  }
});

// 更新统计数据
async function updateStats(type) {
  const today = new Date().toDateString();
  const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
  
  if (!dailyStats[today]) {
    dailyStats[today] = { adsBlocked: 0, apiCalls: 0 };
  }

  dailyStats[today][type]++;
  await chrome.storage.local.set({ dailyStats });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.tabs.sendMessage(tabId, { 
      type: 'pageLoaded',
      url: tab.url
    }).catch(() => {
      // 忽略错误，content script 可能还没准备好
    });
  }
}); 
/******/ })()
;
//# sourceMappingURL=background.js.map