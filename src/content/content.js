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
    // 分析页面上现有的元素
    const elements = document.body.getElementsByTagName('*');
    for (const element of elements) {
      this.analyzeElement(element);
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

  async analyzeForAd(element) {
    try {
      // 基本广告特征检查
      const adIndicators = CONFIG.adIndicators;

      // 检查元素的类名、ID和属性
      const elementText = [
        element.className,
        element.id,
        ...Array.from(element.attributes).map(attr => attr.value)
      ].join(' ').toLowerCase();

      // 检查是否包含广告相关关键词
      const hasAdKeywords = adIndicators.some(indicator => 
        elementText.includes(indicator)
      );

      // 如果基本检查就发现是广告，直接返回true
      if (hasAdKeywords) {
        return true;
      }

      // 检查常见广告尺寸
      const commonAdSizes = CONFIG.commonAdSizes;

      const rect = element.getBoundingClientRect();
      const hasCommonAdSize = commonAdSizes.some(([width, height]) => 
        Math.abs(rect.width - width) < 10 && Math.abs(rect.height - height) < 10
      );

      // 检查iframe源
      const iframes = element.querySelectorAll('iframe');
      const hasAdIframe = Array.from(iframes).some(iframe => {
        const src = iframe.src.toLowerCase();
        return adIndicators.some(indicator => src.includes(indicator));
      });

      // 如果满足任一条件，可能是广告
      const isLikelyAd = hasCommonAdSize || hasAdIframe;
      if (!isLikelyAd) {
        try {
          // 使用 AI 进行进一步分析
          const content = element.outerHTML;
          const response = await this.makeAPIRequest('analyzeContent', { content });
          return response && response.isAd === true;
        } catch (apiError) {
          console.warn('AI analysis failed, falling back to heuristic detection:', apiError);
          // 如果 API 调用失败，回退到基于启发式的判断
          return isLikelyAd;
        }
      }

      return false;
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

              if (!response || !response.success) {
                reject(new Error(response?.error || 'API request failed'));
                return;
              }

              resolve(response.data);
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
}

// 初始化内容分析器
const analyzer = new ContentAnalyzer();
