window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', {
    message: msg,
    url: url,
    lineNo: lineNo,
    columnNo: columnNo,
    error: error
  });
  return false;
};

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

class FloatingOptions {
  constructor() {
    this.elements = {
      container: document.getElementById('floatingOptions'),
      toggleButton: document.getElementById('toggleButton'),
      adBlockingToggle: document.getElementById('adBlockingToggle'),
      searchReorderingToggle: document.getElementById('searchReorderingToggle'),
      contextSuggestionsToggle: document.getElementById('contextSuggestionsToggle'),
      adsBlockedCount: document.getElementById('adsBlockedCount'),
      apiCallsCount: document.getElementById('apiCallsCount'),
      settingsButton: document.getElementById('settingsButton'),
      refreshButton: document.getElementById('refreshButton'),
      readingModeToggle: document.getElementById('readingModeToggle'),
      readingProgress: document.getElementById('readingProgress')
    };

    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    await this.loadStats();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.elements.toggleButton.addEventListener('click', () => this.toggleExpand());
    
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
      }
    });

    // Refresh Page 按钮事件监听器
    this.elements.refreshButton?.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.reload(tab.id);
      }
    });

    // 添加阅读模式开关的事件监听器
    this.elements.readingModeToggle?.addEventListener('change', (e) => {
      this.toggleReadingMode(e.target.checked);
    });

    // 添加来自父页面的消息监听
    window.addEventListener('message', (event) => {
      console.log('Floating options received message:', event.data);
      
      if (event.data.type === 'updateToggleState') {
        const { feature, enabled } = event.data;
        const toggle = this.elements[`${feature}Toggle`];
        if (toggle) {
          toggle.checked = enabled;
        }
      }
    });
  }

  async loadSettings() {
    try {
      const { features = {} } = await chrome.storage.sync.get('features');
      
      const defaultFeatures = {
        adBlocking: true,
        searchReordering: true,
        contextSuggestions: true,
        readingMode: false,
        ...features
      };

      if (this.elements.adBlockingToggle) {
        this.elements.adBlockingToggle.checked = defaultFeatures.adBlocking;
      }
      if (this.elements.searchReorderingToggle) {
        this.elements.searchReorderingToggle.checked = defaultFeatures.searchReordering;
      }
      if (this.elements.contextSuggestionsToggle) {
        this.elements.contextSuggestionsToggle.checked = defaultFeatures.contextSuggestions;
      }
      if (this.elements.readingModeToggle) {
        this.elements.readingModeToggle.checked = defaultFeatures.readingMode;
      }

      if (defaultFeatures.readingMode) {
        window.parent.postMessage({
          type: 'updateFeature',
          feature: 'readingMode',
          enabled: true
        }, '*');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async loadStats() {
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
      console.error('Failed to load stats:', error);
    }
  }

  toggleExpand() {
    const isExpanding = this.elements.container.classList.contains('collapsed');
    this.elements.container.classList.toggle('collapsed');
    this.elements.container.classList.toggle('expanded');
    
    // 通知父页面切换鼠标事件
    window.parent.postMessage({
      type: 'toggleExpand',
      expanded: isExpanding
    }, '*');
  }

  startDrag(e) {
    if (e.target === this.elements.toggleButton) {
      this.isDragging = true;
      this.startY = e.clientY;
      this.startTop = this.elements.container.offsetTop;
    }
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const deltaY = e.clientY - this.startY;
    const newTop = this.startTop + deltaY;
    
    const maxTop = window.innerHeight - this.elements.container.offsetHeight;
    const boundedTop = Math.max(0, Math.min(newTop, maxTop));
    
    this.elements.container.style.top = boundedTop + 'px';
    this.savePosition(boundedTop);
  }

  stopDrag() {
    this.isDragging = false;
  }

  savePosition(top) {
    chrome.storage.sync.set({ floatingOptionsPosition: top });
  }

  loadPosition() {
    chrome.storage.sync.get(['floatingOptionsPosition'], (result) => {
      if (result.floatingOptionsPosition !== undefined) {
        this.elements.container.style.top = result.floatingOptionsPosition + 'px';
      }
    });
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
        // 由于我们在 iframe 中，需要通过 postMessage 发送消息到父页面
        window.parent.postMessage({
          type: 'updateFeature',
          feature: featureName,
          enabled
        }, '*');

        // 同时通知其他标签页
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

  async toggleReadingMode(enabled) {
    try {
      // 通知父页面更新阅读模式
      window.parent.postMessage({
        type: 'updateFeature',
        feature: 'readingMode',
        enabled
      }, '*');

      // 保存设置
      const { features = {} } = await chrome.storage.sync.get('features');
      await chrome.storage.sync.set({
        features: {
          ...features,
          readingMode: enabled
        }
      });
    } catch (error) {
      console.error('Failed to toggle reading mode:', error);
      // 回滚 UI 状态
      if (this.elements.readingModeToggle) {
        this.elements.readingModeToggle.checked = !enabled;
      }
    }
  }

  // 更新阅读进度显示
  updateReadingProgress(progress) {
    if (this.elements.readingProgress) {
      this.elements.readingProgress.textContent = `${Math.round(progress)}%`;
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new FloatingOptions();
}); 