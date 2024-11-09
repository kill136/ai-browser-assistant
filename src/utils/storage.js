class StorageManager {
    constructor() {
      // 定义存储键名
      this.keys = {
        API_KEY: 'apiKey',
        FEATURES: 'features',
        DAILY_STATS: 'dailyStats',
        CACHE: 'cache',
        USER_PREFERENCES: 'userPreferences'
      };
  
      // 默认设置
      this.defaults = {
        features: {
          adBlocking: true,
          searchReordering: true,
          contextSuggestions: true
        },
        userPreferences: {
          suggestionPosition: 'right',
          theme: 'light',
          notificationsEnabled: true
        }
      };
    }
  
    /**
     * 获取 API 密钥
     */
    async getApiKey() {
      const result = await chrome.storage.sync.get(this.keys.API_KEY);
      return result[this.keys.API_KEY];
    }
  
    /**
     * 设置 API 密钥
     */
    async setApiKey(apiKey) {
      await chrome.storage.sync.set({ [this.keys.API_KEY]: apiKey });
    }
  
    /**
     * 获取功能设置
     */
    async getFeatures() {
      const result = await chrome.storage.sync.get(this.keys.FEATURES);
      return result[this.keys.FEATURES] || this.defaults.features;
    }
  
    /**
     * 更新功能设置
     */
    async updateFeatures(features) {
      const currentFeatures = await this.getFeatures();
      const updatedFeatures = { ...currentFeatures, ...features };
      await chrome.storage.sync.set({ [this.keys.FEATURES]: updatedFeatures });
      return updatedFeatures;
    }
  
    /**
     * 获取今日统计数据
     */
    async getTodayStats() {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(this.keys.DAILY_STATS);
      const dailyStats = result[this.keys.DAILY_STATS] || {};
      return dailyStats[today] || { adsBlocked: 0, apiCalls: 0, searchesReordered: 0 };
    }
  
    /**
     * 更新统计数据
     */
    async updateStats(statsUpdate) {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(this.keys.DAILY_STATS);
      const dailyStats = result[this.keys.DAILY_STATS] || {};
      
      dailyStats[today] = {
        ...dailyStats[today] || { adsBlocked: 0, apiCalls: 0, searchesReordered: 0 },
        ...statsUpdate
      };
  
      await chrome.storage.local.set({ [this.keys.DAILY_STATS]: dailyStats });
      return dailyStats[today];
    }
  
    /**
     * 增加特定统计计数
     */
    async incrementStat(statName) {
      const today = new Date().toDateString();
      const stats = await this.getTodayStats();
      stats[statName] = (stats[statName] || 0) + 1;
      await this.updateStats(stats);
      return stats[statName];
    }
  
    /**
     * 缓存管理
     */
    async getCached(key) {
      const result = await chrome.storage.local.get(this.keys.CACHE);
      const cache = result[this.keys.CACHE] || {};
      const cached = cache[key];
  
      if (!cached) return null;
  
      // 检查缓存是否过期（默认1小时）
      if (Date.now() - cached.timestamp > 3600000) {
        await this.clearCache(key);
        return null;
      }
  
      return cached.data;
    }
  
    async setCache(key, data) {
      const result = await chrome.storage.local.get(this.keys.CACHE);
      const cache = result[this.keys.CACHE] || {};
      
      cache[key] = {
        data,
        timestamp: Date.now()
      };
  
      await chrome.storage.local.set({ [this.keys.CACHE]: cache });
    }
  
    async clearCache(key = null) {
      if (key === null) {
        await chrome.storage.local.remove(this.keys.CACHE);
      } else {
        const result = await chrome.storage.local.get(this.keys.CACHE);
        const cache = result[this.keys.CACHE] || {};
        delete cache[key];
        await chrome.storage.local.set({ [this.keys.CACHE]: cache });
      }
    }
  
    /**
     * 用户偏好设置
     */
    async getUserPreferences() {
      const result = await chrome.storage.sync.get(this.keys.USER_PREFERENCES);
      return result[this.keys.USER_PREFERENCES] || this.defaults.userPreferences;
    }
  
    async updateUserPreferences(preferences) {
      const currentPreferences = await this.getUserPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await chrome.storage.sync.set({ [this.keys.USER_PREFERENCES]: updatedPreferences });
      return updatedPreferences;
    }
  
    /**
     * 导出所有设置（用于备份）
     */
    async exportSettings() {
      const settings = await chrome.storage.sync.get(null);
      delete settings[this.keys.API_KEY]; // 出于安全考虑不导出 API 密钥
      return settings;
    }
  
    /**
     * 导入设置
     */
    async importSettings(settings) {
      // 保留当前的 API 密钥
      const apiKey = await this.getApiKey();
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set({
        ...settings,
        [this.keys.API_KEY]: apiKey
      });
    }
  
    /**
     * 重置所有设置为默认值
     */
    async resetToDefaults() {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      await chrome.storage.sync.set(this.defaults);
    }
  
    /**
     * 监听存储变化
     */
    addStorageListener(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        callback(changes, areaName);
      });
    }
  }
  
  // 导出单例实例
  export default new StorageManager();