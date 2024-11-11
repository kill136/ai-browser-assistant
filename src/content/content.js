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

  analyzeExistingContent() {
  // 根据不同搜索引擎选择合适的选择器
  const isGoogle = window.location.hostname.includes('google');
  const isBing = window.location.hostname.includes('bing');
  const isBaidu = window.location.hostname.includes('baidu');

  let searchResults;
  if (isGoogle) {
    // Google 搜索结果选择器
    searchResults = document.querySelectorAll([
      '#search .g',                // 普通搜索结果
      '#rso .g',                   // 另一种搜索结果容器
      'div[data-sokoban-grid]',    // 新版搜索结果
      '.commercial-unit-desktop-top', // 顶部广告
      '.commercial-unit-desktop-rhs'  // 右侧广告
    ].join(','));
  } else if (isBing) {
    // Bing 搜索结果选择器
    searchResults = document.querySelectorAll([
      '#b_results > li',           // 主要搜索结果
      '.b_ad',                     // 广告结果
      '.b_algo',                   // 算法搜索结果
      '.b_sideBleed'               // 侧边栏结果
    ].join(','));
  } else if (isBaidu) {
    // 百度搜索结果选择器
    searchResults = document.querySelectorAll([
      '#content_left > div',      // 主要搜索结果区域
      '.result-op',               // 特殊搜索结果（如百科、图片等）
      '.result',                  // 普通搜索结果
      '[cmatchid]',              // 广告结果
      '.ec_tuiguang_link',       // 推广链接
      '#content_right .cr-content', // 右侧栏内容
      '.c-container'             // 新版搜索结果容器
    ].join(','));
  }

  // 分析每个搜索结果块
  for (const result of searchResults) {
      // 等待分析完成并处理结果
      this.analyzeSearchResult(result).then(isAd => {
        if (isAd) {
          // 如果是广告，隐藏结果
          result.style.display = 'none';
          // 或者添加警告样式
          // result.classList.add('ad-warning');
          console.log('已隐藏广告内容:', result);
        }
      }).catch(error => {
        console.error('分析搜索结果时出错:', error);
      });
    }
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

  async analyzeForAd(content) {
    try {
        try {
          // 使用 AI 进行进一步分析
          const response = await this.makeAPIRequest('analyzeContent', { content });
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
              type: 'aiRequest',
              provider: config.aiProvider,
              model: config.aiModel,
              apiKey: config.apiKey,
              endpoint,
              data
            }, response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (!response) {
                reject(new Error(response?.error || 'API request failed'));
                return;
              }

              resolve(response);
            });
          });

          // 验证响应数据
          if (!response || typeof response.isAd !== 'boolean') {
            throw new Error('Invalid API response format');
          }

          return response;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.error('API request failed:', error);
      // 返回一个默认的安全响应，而不是 null
      return { isAd: false };
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

  analyzeSearchResult(result) {
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
    // 进行内容分析
    return this.analyzeForAd(allText);
  }
}

// 初始化内容分析器
const analyzer = new ContentAnalyzer();
