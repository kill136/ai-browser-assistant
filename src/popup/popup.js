class PopupManager {
  constructor() {
    this.elements = {
      adBlockingToggle: document.getElementById('adBlockingToggle'),
      searchReorderingToggle: document.getElementById('searchReorderingToggle'),
      contextSuggestionsToggle: document.getElementById('contextSuggestionsToggle'),
      adsBlockedCount: document.getElementById('adsBlockedCount'),
      apiCallsCount: document.getElementById('apiCallsCount'),
      settingsButton: document.getElementById('settingsButton'),
      refreshButton: document.getElementById('refreshButton')
    };

    this.initialize();
  }

  async initialize() {
    // 加载设置
    await this.loadSettings();
    
    // 添加事件监听器
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 特性开关的事件监听器
    this.elements.adBlockingToggle?.addEventListener('change', (e) => 
      this.updateFeature('adBlocking', e.target.checked));
    
    this.elements.searchReorderingToggle?.addEventListener('change', (e) => 
      this.updateFeature('searchReordering', e.target.checked));
    
    this.elements.contextSuggestionsToggle?.addEventListener('change', (e) => 
      this.updateFeature('contextSuggestions', e.target.checked));

    // Settings 按钮事件监听器
    this.elements.settingsButton?.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options/options.html'));
      }
    });

    // Refresh Page 按钮事件监听器
    this.elements.refreshButton?.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  }

  async loadSettings() {
    try {
      const { features = {} } = await chrome.storage.sync.get('features');
      
      // 设置默认值
      const defaultFeatures = {
        adBlocking: true,
        searchReordering: true,
        contextSuggestions: true,
        ...features
      };

      // 更新开关状态
      if (this.elements.adBlockingToggle) {
        this.elements.adBlockingToggle.checked = defaultFeatures.adBlocking;
      }
      if (this.elements.searchReorderingToggle) {
        this.elements.searchReorderingToggle.checked = defaultFeatures.searchReordering;
      }
      if (this.elements.contextSuggestionsToggle) {
        this.elements.contextSuggestionsToggle.checked = defaultFeatures.contextSuggestions;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async updateFeature(featureName, enabled) {
    try {
      // 获取当前特性设置
      const { features = {} } = await chrome.storage.sync.get('features');
      
      // 更新特定特性
      const updatedFeatures = {
        ...features,
        [featureName]: enabled
      };

      // 保存到存储
      await chrome.storage.sync.set({ features: updatedFeatures });

      // 通知内容脚本更新
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'updateFeature',
            feature: featureName,
            enabled
          });
        }
      } catch (error) {
        console.warn('Failed to notify content script:', error);
      }
    } catch (error) {
      console.error('Failed to update feature:', error);
      // 回滚 UI 状态
      const toggle = this.elements[`${featureName}Toggle`];
      if (toggle) {
        toggle.checked = !enabled;
      }
    }
  }

  async updateStats() {
    try {
      const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
      const today = new Date().toDateString();
      const todayStats = dailyStats[today] || { adsBlocked: 0, apiCalls: 0 };

      if (this.elements.adsBlockedCount) {
        this.elements.adsBlockedCount.textContent = todayStats.adsBlocked;
      }
      if (this.elements.apiCallsCount) {
        this.elements.apiCallsCount.textContent = todayStats.apiCalls;
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }
}

// 初始化 PopupManager
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
});
