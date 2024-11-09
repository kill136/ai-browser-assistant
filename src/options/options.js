// AI 提供商配置
const PROVIDERS_CONFIG = {
  providers: [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' }
      ]
    },
    {
      id: 'claude',
      name: 'Claude',
      models: [
        { id: 'claude-2', name: 'Claude 2' },
        { id: 'claude-instant', name: 'Claude Instant' }
      ]
    },
    {
      id: 'siliconflow',
      name: 'SiliconFlow',
      models: [
        { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen Turbo' },
        { id: 'qwen/qwen-plus', name: 'Qwen Plus' }
      ]
    }
  ]
};

// 初始化函数
async function initializeOptions() {
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const debugButton = document.getElementById('debugButton');

  // 填充 AI 提供商下拉列表
  PROVIDERS_CONFIG.providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.name;
    providerSelect.appendChild(option);
  });

  // 更新模型列表的函数
  function updateModelList(providerId) {
    modelSelect.innerHTML = '';
    const provider = PROVIDERS_CONFIG.providers.find(p => p.id === providerId);
    if (provider) {
      provider.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
      });
    }
  }

  // 当提供商改变时更新模型列表
  providerSelect.addEventListener('change', () => {
    updateModelList(providerSelect.value);
  });

  // 加载保存的设置
  const settings = await chrome.storage.sync.get({
    aiProvider: 'siliconflow',
    aiModel: 'qwen/qwen-turbo',
    apiKeys: {}
  });

  // 设置表单的初始值
  providerSelect.value = settings.aiProvider;
  updateModelList(settings.aiProvider);
  if (settings.aiModel) {
    modelSelect.value = settings.aiModel;
  }
  if (settings.apiKeys[settings.aiProvider]) {
    apiKeyInput.value = settings.apiKeys[settings.aiProvider];
  }

  // 保存设置
  saveButton.addEventListener('click', async () => {
    const provider = providerSelect.value;
    const model = modelSelect.value;
    const apiKey = apiKeyInput.value;

    await chrome.storage.sync.set({
      aiProvider: provider,
      aiModel: model,
      apiKeys: {
        ...settings.apiKeys,
        [provider]: apiKey
      }
    });

    showStatus('Settings saved successfully!');
  });

  // Debug Storage 按钮功能
  debugButton.addEventListener('click', async () => {
    const result = await chrome.storage.sync.get(null);
    console.log('All stored data:', result);
    showStatus(`Current storage state: ${JSON.stringify(result, null, 2)}`, 'info');
  });
}

// 显示状态信息的函数
function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  // 设置状态样式
  statusDiv.style.marginTop = '10px';
  statusDiv.style.padding = '10px';
  statusDiv.style.borderRadius = '4px';
  
  switch (type) {
    case 'success':
      statusDiv.style.backgroundColor = '#d4edda';
      statusDiv.style.color = '#155724';
      break;
    case 'error':
      statusDiv.style.backgroundColor = '#f8d7da';
      statusDiv.style.color = '#721c24';
      break;
    case 'info':
      statusDiv.style.backgroundColor = '#e2e3e5';
      statusDiv.style.color = '#383d41';
      break;
  }

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// 当 DOM 加载完成时初始化
document.addEventListener('DOMContentLoaded', initializeOptions);
