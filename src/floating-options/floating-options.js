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
    try {
      this.container = document.getElementById('floatingOptions');
      if (!this.container) {
        throw new Error('Container element not found');
      }
      
      this.toggleButton = document.getElementById('toggleButton');
      this.providerSelect = document.getElementById('provider');
      this.modelSelect = document.getElementById('model');
      this.apiKeyInput = document.getElementById('apiKey');
      this.saveButton = document.getElementById('saveButton');
      this.debugButton = document.getElementById('debugButton');
      this.statusDiv = document.getElementById('status');
      
      this.isDragging = false;
      this.startY = 0;
      this.startTop = 0;

      this.initialize();
    } catch (error) {
      console.error('FloatingOptions initialization error:', error);
    }
  }

  async initialize() {
    try {
      await this.setupEventListeners();
      await this.loadProviders();
      await this.loadSettings();
      this.loadPosition();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showStatus('Failed to initialize: ' + error.message, 'error');
    }
  }

  setupEventListeners() {
    this.toggleButton.addEventListener('click', () => this.toggleExpand());
    this.saveButton.addEventListener('click', () => this.saveSettings());
    this.debugButton.addEventListener('click', () => this.debugStorage());
    this.providerSelect.addEventListener('change', () => this.updateModelList());
    this.container.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  async loadProviders() {
    const providers = [
      { id: 'siliconflow', name: 'Silicon Flow' },
      { id: 'openai', name: 'OpenAI' },
      { id: 'claude', name: 'Claude' }
    ];

    providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = provider.name;
      this.providerSelect.appendChild(option);
    });
  }

  async updateModelList() {
    const providerId = this.providerSelect.value;
    this.modelSelect.innerHTML = '';

    const models = {
      siliconflow: [
        { id: 'qwen/qwen-turbo', name: 'Qwen Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ],
      openai: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' }
      ],
      claude: [
        { id: 'claude-2', name: 'Claude 2' },
        { id: 'claude-instant', name: 'Claude Instant' }
      ]
    };

    models[providerId]?.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      this.modelSelect.appendChild(option);
    });
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get({
      aiProvider: 'siliconflow',
      aiModel: 'qwen/qwen-turbo',
      apiKeys: {}
    });

    this.providerSelect.value = settings.aiProvider;
    await this.updateModelList();
    this.modelSelect.value = settings.aiModel;
    this.apiKeyInput.value = settings.apiKeys[settings.aiProvider] || '';
  }

  async saveSettings() {
    try {
      const provider = this.providerSelect.value;
      const model = this.modelSelect.value;
      const apiKey = this.apiKeyInput.value;

      await chrome.storage.sync.set({
        aiProvider: provider,
        aiModel: model,
        apiKeys: {
          [provider]: apiKey
        }
      });

      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus('Error saving settings: ' + error.message, 'error');
    }
  }

  async debugStorage() {
    const settings = await chrome.storage.sync.get(null);
    console.log('Current storage:', settings);
    this.showStatus('Check console for debug info', 'success');
  }

  showStatus(message, type) {
    this.statusDiv.textContent = message;
    this.statusDiv.className = type;
    setTimeout(() => {
      this.statusDiv.textContent = '';
      this.statusDiv.className = '';
    }, 3000);
  }

  toggleExpand() {
    this.container.classList.toggle('collapsed');
    this.container.classList.toggle('expanded');
  }

  startDrag(e) {
    if (e.target === this.toggleButton) {
      this.isDragging = true;
      this.startY = e.clientY;
      this.startTop = this.container.offsetTop;
    }
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const deltaY = e.clientY - this.startY;
    const newTop = this.startTop + deltaY;
    
    const maxTop = window.innerHeight - this.container.offsetHeight;
    const boundedTop = Math.max(0, Math.min(newTop, maxTop));
    
    this.container.style.top = boundedTop + 'px';
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
        this.container.style.top = result.floatingOptionsPosition + 'px';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new FloatingOptions();
  } catch (error) {
    console.error('Failed to create FloatingOptions:', error);
  }
}); 