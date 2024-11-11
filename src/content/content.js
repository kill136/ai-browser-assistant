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
    this.initialize();
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
    if (!searchQuery) return; // 如果没有搜索关键词则返回
    
    // 根据不同搜索引擎选择合适的选择器
    const isGoogle = window.location.hostname.includes('google');
    const isBing = window.location.hostname.includes('bing');
    const isBaidu = window.location.hostname.includes('baidu');

    let searchResults = [];
    if (isGoogle) {
      searchResults = Array.from(document.querySelectorAll([
        '#search .g',
        '#rso .g',
        'div[data-sokoban-grid]',
        '.commercial-unit-desktop-top',
        '.commercial-unit-desktop-rhs'
      ].join(','))) || [];
    } else if (isBing) {
      searchResults = Array.from(document.querySelectorAll([
        '#b_results > li',
        '.b_ad',
        '.b_algo',
        '.b_sideBleed'
      ].join(','))) || [];
    } else if (isBaidu) {
      searchResults = Array.from(document.querySelectorAll([
        '#content_left > div',
        '.result-op',
        '.result',
        '[cmatchid]',
        '.ec_tuiguang_link',
        '#content_right .cr-content',
        '.c-container'
      ].join(','))) || [];
    }

    // 清空之前的结果数组
    this.filterSearchResults = [];

    // 创建一个Promise数组来存储所有分析任务
    const analysisPromises = searchResults.map(async result => {
      const isAd = await this.analyzeSearchResult(result, searchQuery);
      if (!isAd) {
        // 获取相关性分数
        const relevanceScore = await this.calculateRelevance(result, searchQuery);
        return {
          element: result,
          score: relevanceScore
        };
      }
      return null;
    });

    // 等待所有分析完成
    const results = await Promise.all(analysisPromises);
    
    // 过滤掉广告（null值）并按相关性分数排序
    this.filterSearchResults = results
      .filter(item => item !== null)
      .sort((a, b) => b.score - a.score);

    // 重新排序DOM元素
    this.reorderSearchResults();
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

    // 配置观察选项
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

  async analyzeForAd(content,searchQuery) {
    try {
        try {
          // 使用 AI 进行进一步分析
          const response = await this.makeAPIRequest('analyzeContent', { content,searchQuery });
          return response && response.isAd === true;
        } catch (apiError) {
          console.warn('AI analysis failed, falling back to heuristic detection:', apiError);
          // 如果 API 调用失败，回退到基于启发式的判断
          return isLikelyAd;
        }
    } catch (error) {
      console.error('Ad analysis failed:', error);
      return false; // 出错时默认不屏蔽内容
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

  analyzeSearchResult(result, searchQuery) {
    // 提取所有可见文本的辅助函数
    const getVisibleText = (element) => {
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
          text += getVisibleText(node) + ' ';
        }
      }
      return text.trim();
    };

    // 获取所有可见文本
    const allText = getVisibleText(result);
    // 进行内容分析，传入搜索查询
    return this.analyzeForAd(allText, searchQuery);
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
    if (!this.filterSearchResults.length) return;

    const container = this.filterSearchResults[0].element.parentElement;
    if (!container) return;

    // 临时创建一个文档片段来重新排序
    const fragment = document.createDocumentFragment();
    this.filterSearchResults.forEach(({element}) => {
      fragment.appendChild(element);
    });

    // 清空原容器并添加排序后的结果
    container.innerHTML = '';
    container.appendChild(fragment);
  }

  // 将getVisibleText方法移到类级别
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
}

// 初始化内容分析器
const analyzer = new ContentAnalyzer();

// 注入悬浮选项
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('floating-options/floating-options.html');
iframe.style.cssText = `
  position: fixed;
  border: none;
  z-index: 9999;
  background: transparent;
  width: 400px;
  height: 100vh;
  right: 0;
  top: 0;
`;
// 重要：移除 pointer-events: none
// 添加允许交互的样式
iframe.style.pointerEvents = 'auto';
document.body.appendChild(iframe);

// 添加消息监听，用于iframe和主页面的通信
window.addEventListener('message', (event) => {
  // 确保消息来自你的扩展
  if (event.source === iframe.contentWindow) {
    // 处理来自iframe的消息
    console.log('Received message from iframe:', event.data);
  }
});
