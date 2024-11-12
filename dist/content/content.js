/******/ (() => { // webpackBootstrap
/*!********************************!*\
  !*** ./src/content/content.js ***!
  \********************************/
// 将需要导入的内容直接定义在文件中
const CONFIG = {
  adIndicators: [
    'ad', 'ads', 'advertisement', 'sponsored', 'promotion',
    'banner', 'adsense', 'adwords', 'doubleclick'
  ],
  commonAdSizes: [
    [728, 90],  // Leaderboard
    [300, 250], // Medium Rectangle
    [160, 600]  // Wide Skyscraper
  ]
};

class ContentAnalyzer {
  constructor() {
    this.filterSearchResults = []; // 添加数组存储过滤后的搜索结果
    console.trace('ContentAnalyzer constructor called');
    this.features = {
      adBlocking: true,
      searchReordering: true,
      contextSuggestions: true
    };
    this.loadFeatureSettings().then(() => {
      this.initialize();
    });
  }

  async initialize() {
    try {
      // 初始化配置
      const config = await this.getAPIConfig();
      console.log('Initialized with config:', config);
      
      // 等待 DOM 加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
      } else {
        this.onDOMReady();
      }
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

  onDOMReady() {
    // 初始分析当前页面内容
    this.analyzeExistingContent();
  }

  async analyzeExistingContent() {
    // 获取搜索关键词
    const searchQuery = this.getSearchQuery();
    if (!searchQuery) return;
    
    // 获取搜索结果
    const searchResults = this.getSearchResultsByEngine();
    if (!searchResults.length) return;
  
    // 清空之前的结果数组
    this.filterSearchResults = [];
  
    // 创建一个Promise数组来存储所有分析任务
    const analysisPromises = searchResults.map(async result => {
      // 如果是答案框，直接返回，不做处理
      if (result.isAnswer) {
        return {
          element: result.element,
          score: 0,
          isAnswer: true
        };
      }

      let shouldInclude = true;
      let relevanceScore = 0;
  
      // 广告分析
      if (this.features.adBlocking) {
        const isAd = await this.analyzeSearchResult(result.element, searchQuery);
        if (isAd) {
          result.element.classList.add('ai-assistant-blocked');
          result.element.style.display = 'none';
          shouldInclude = false;
        } else {
          result.element.classList.remove('ai-assistant-blocked');
          result.element.style.display = '';
        }
      }
  
      // 关性分析
      if (shouldInclude) {
        relevanceScore = this.features.searchReordering ? 
          await this.calculateRelevance(result.element, searchQuery) : 
          0;
        
        return {
          element: result.element,
          score: relevanceScore,
          isAnswer: false
        };
      }
  
      return null;
    });
  
    // 等待所有分析完成
    const results = await Promise.all(analysisPromises);
    
    // 过滤并排序结果，答案框保持原位
    this.filterSearchResults = results
      .filter(item => item !== null)
      .sort((a, b) => {
        // 如果其中一个是答案框，保持原位
        if (a.isAnswer) return -1;
        if (b.isAnswer) return 1;
        // 否则按分数排序
        return b.score - a.score;
      });
  }

  setupMutationObserver() {
    // 使用 MutationObserver 替代废弃的 DOM 事件
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // 分析新添加的节点
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.analyzeElement(node);
            }
          });
        }
      }
    });

    // 配置察选项
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async analyzeElement(element) {
    try {
      // 检查元素是否可能是广告
      const isAd = await this.analyzeForAd(element);
      if (isAd) {
        element.style.display = 'none';
      }
    } catch (error) {
      console.error('Element analysis failed:', error);
    }
  }

  async analyzeForAd(content, searchQuery) {
    // 如果广告拦截被禁用，直接返回 false
    if (!this.features.adBlocking) {
      return false;
    }
    
    try {
      const response = await this.makeAPIRequest('analyzeContent', { content, searchQuery });
      // 只返回分析结果，不在这里处理 DOM
      return response && response.isAd === true;
    } catch (error) {
      console.error('Ad analysis failed:', error);
      return false;
    }
  }

  async makeAPIRequest(endpoint, data) {
    try {
      const config = await this.getAPIConfig();
      
      if (!config || !config.apiKey) {
        console.warn(`API configuration incomplete. Provider: ${config?.aiProvider}`);
        return null;
      }

      // 添加重试逻辑
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              type: 'aiRequest',      // 用于消息类型识别
              endpoint: endpoint,      // 用于具体 API 端点识别
              provider: config.aiProvider,
              model: config.aiModel,
              apiKey: config.apiKey,
              data
            }, response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (!response) {
                reject(new Error('Empty response received'));
                return;
              }

              // 根据不同端点验证响应
              if (endpoint === 'analyzeContent' && typeof response.isAd !== 'boolean') {
                reject(new Error('Invalid analyzeContent response format'));
                return;
              }
              if (endpoint === 'calculateRelevance' && typeof response.relevanceScore !== 'number') {
                reject(new Error('Invalid calculateRelevance response format'));
                return;
              }

              resolve(response);
            });
          });

          return response;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.error('API request failed:', error);
      // 根据端点返回适当的默认值
      return endpoint === 'analyzeContent' ? { isAd: false } : { relevanceScore: 0 };
    }
  }

  async getAPIConfig() {
    return new Promise((resolve) => {
      const DEFAULT_PROVIDER = 'siliconflow';
      const DEFAULT_MODEL = 'gpt-3.5-turbo';

      chrome.storage.sync.get({
        // 提供默认值
        aiProvider: DEFAULT_PROVIDER,
        aiModel: DEFAULT_MODEL,
        apiKeys: {}
      }, (result) => {
        console.log('Storage result:', result); // 调试用
        
        const config = {
          apiKey: result.apiKeys[result.aiProvider],
          aiProvider: result.aiProvider,
          aiModel: result.aiModel
        };
        
        console.log('Config:', config); // 调试用
        resolve(config);
      });
    });
  }

  async analyzeSearchResult(result, searchQuery) {
    // 提取所有可见文本
    const allText = this.getVisibleText(result);
    
    // 进行内容分析
    const isAd = await this.analyzeForAd(allText, searchQuery);
    
    // 在这里处理 DOM 元素的显示/隐藏
    if (isAd && this.features.adBlocking) {
      result.classList.add('ai-assistant-blocked');
      result.style.display = 'none';
    } else {
      result.classList.remove('ai-assistant-blocked');
      result.style.display = '';
    }
    
    return isAd;
  }

  getSearchQuery() {
    const url = new URL(window.location.href);
    
    // Google 搜索
    if (window.location.hostname.includes('google')) {
      return url.searchParams.get('q');
    }
    // Bing 搜索
    else if (window.location.hostname.includes('bing')) {
      return url.searchParams.get('q');
    }
    // 百度搜索
    else if (window.location.hostname.includes('baidu')) {
      return url.searchParams.get('wd') || url.searchParams.get('word');
    }
    
    return null;
  }

  // 添加计算相关性的方法
  async calculateRelevance(element, searchQuery) {
    try {
      const content = this.getVisibleText(element);
      
      // 调用AI服务计算相关性
      const response = await this.makeAPIRequest('calculateRelevance', {
        content,
        searchQuery
      });

      return response?.relevanceScore || 0;
    } catch (error) {
      console.error('计算相关性失败:', error);
      return 0;
    }
  }

  // 添加重新排序的方法
  reorderSearchResults() {
    if (!this.features.searchReordering || !this.filterSearchResults?.length) {
      return;
    }

    // 获取第一个元素的父容器
    const container = this.filterSearchResults[0].element.parentElement;
    if (!container) return;

    // 临时创建一个文档片段来重新排序
    const fragment = document.createDocumentFragment();
    
    // 先将所有元素从 DOM 中移除，并存储到新数组中
    const elements = this.filterSearchResults.map(result => {
      const element = result.element;
      const clone = element.cloneNode(true); // 克隆节点
      clone.classList.add('ai-assistant-reordered');
      return clone;
    });

    // 将克隆的元素添加到文档片段中
    elements.forEach(element => {
      fragment.appendChild(element);
    });

    // 清空原容器
    container.innerHTML = '';
    
    // 将重排序后的元素一次性添加回容器
    container.appendChild(fragment);
  }

  // 将 getVisibleText 方法移到类的方法中
  getVisibleText(element) {
    if (element.offsetParent === null) return '';
    
    if (element.tagName === 'SCRIPT' || 
        element.tagName === 'STYLE' || 
        element.tagName === 'NOSCRIPT') {
      return '';
    }

    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = node.textContent.trim();
        if (trimmed) text += trimmed + ' ';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        text += this.getVisibleText(node) + ' ';
      }
    }
    return text.trim();
  }

  async loadFeatureSettings() {
    try {
      const { features = {} } = await chrome.storage.sync.get('features');
      this.features = {
        adBlocking: false,
        searchReordering: false,
        contextSuggestions: true,
        ...features
      };
      console.log('Loaded features:', this.features);
    } catch (error) {
      console.error('Failed to load feature settings:', error);
    }
  }

  setAdBlockingEnabled(enabled) {
    this.features.adBlocking = enabled;
    
    // 如果禁用了广告拦截，恢复之前隐藏的广告
    if (!enabled) {
      document.querySelectorAll('.ai-assistant-blocked').forEach(el => {
        el.classList.remove('ai-assistant-blocked');
        el.style.display = ''; // 恢复显示
      });
    }
    
    // 重新分析当前页面内容
    this.analyzeExistingContent();
  }

  // 辅助方法：根据不同搜索引擎获取搜索结果
  getSearchResultsByEngine() {
    const isGoogle = window.location.hostname.includes('google');
    const isBing = window.location.hostname.includes('bing');
    const isBaidu = window.location.hostname.includes('baidu');
  
    if (isGoogle) {
      // Google 的选择器保持不变
      return Array.from(document.querySelectorAll([
        '#search .g',
        '#rso .g',
        'div[data-sokoban-grid]',
        '.commercial-unit-desktop-top',
        '.commercial-unit-desktop-rhs'
      ].join(','))) || [];
    } 
    
    if (isBing) {
      // 获取所有搜索结果，包括答案框
      const allResults = Array.from(document.querySelectorAll('#b_results > li'));
      
      // 将结果分为答案框和普通结果
      return allResults.map(result => {
        if (result.classList.contains('b_ans')) {
          // 标记为答案框，不参与处理
          return {
            element: result,
            isAnswer: true
          };
        } else {
          // 普通结果，参与处理
          return {
            element: result,
            isAnswer: false
          };
        }
      });
    } 
    
    // Baidu 的择持不变
    if (isBaidu) {
      return Array.from(document.querySelectorAll([
        '#content_left > div',
        '.result-op',
        '.result',
        '[cmatchid]',
        '.ec_tuiguang_link',
        '#content_right .cr-content',
        '.c-container'
      ].join(','))) || [];
    }
  
    return [];
  }

  setSearchReorderingEnabled(enabled) {
    this.features.searchReordering = enabled;
    
    if (!enabled) {
      // 移除所有重排序相关的类和样式
      document.querySelectorAll('.ai-assistant-reordered').forEach(el => {
        el.classList.remove('ai-assistant-reordered');
        el.style.order = ''; // 移除排序样式
      });
      
      // 恢复原始顺序
      const container = this.filterSearchResults[0]?.element.parentElement;
      if (container) {
        // 获取所有搜索结果
        const results = this.getSearchResultsByEngine();
        
        // 清空容器
        container.innerHTML = '';
        
        // 按原始顺序重新添加元素
        results.forEach(result => {
          container.appendChild(result);
        });
      }
    }
    
    // 重新分析当前页面内容
    this.analyzeExistingContent();
  }
}

// 初始化内容分析器
const analyzer = new ContentAnalyzer();

// 注入悬浮选项
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('floating-options/floating-options.html');
iframe.style.cssText = `
  position: fixed;
  border: none;
  z-index: 2147483647;
  background: transparent;
  width: 48px;
  height: 48px;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 24px 0 0 24px;
  transition: all 0.3s ease;
  box-shadow: -2px 0 20px rgba(0,0,0,0.1);
`;

// 监听展开/收起消息
window.addEventListener('message', (event) => {
  if (event.source === iframe.contentWindow && event.data.type === 'toggleExpand') {
    if (event.data.expanded) {
      iframe.style.width = '300px';
      iframe.style.height = '400px';  // 展开时设置固定高度
      iframe.style.borderRadius = '12px 0 0 12px';
    } else {
      iframe.style.width = '48px';
      iframe.style.height = '48px';
      iframe.style.borderRadius = '24px 0 0 24px';
    }
  }
});

document.body.appendChild(iframe);

// 添加消息监听，用于iframe和主页面的通信
window.addEventListener('message', (event) => {
  // 确保消息来自你的扩展
  if (event.source === iframe.contentWindow) {
    // 处理来自iframe的消息
    console.log('Received message from iframe:', event.data);
  }
});

// 在现有的消息监听器中添加处理逻辑
window.addEventListener('message', (event) => {
  // 确保消息来自你的扩展
  if (event.source === iframe.contentWindow) {
    const { type, feature, enabled } = event.data;
    
    if (type === 'updateFeature') {
      switch (feature) {
        case 'adBlocking':
          // 更新广告拦截状态
          analyzer.setAdBlockingEnabled(enabled);
          break;
        case 'searchReordering':
          // 更新搜索重排序状态
          analyzer.setSearchReorderingEnabled(enabled);
          break;
        case 'contextSuggestions':
          // 更新上下文建议状态
          analyzer.setContextSuggestionsEnabled(enabled);
          break;
      }
    }
  }
});


/******/ })()
;
//# sourceMappingURL=content.js.map