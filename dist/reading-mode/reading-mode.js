/******/ (() => { // webpackBootstrap
/*!******************************************!*\
  !*** ./src/reading-mode/reading-mode.js ***!
  \******************************************/
class ReadingMode {
  constructor() {
    this.elements = {
      container: document.querySelector('.reading-assistant'),
      minimizeBtn: document.querySelector('.minimize-btn'),
      closeBtn: document.querySelector('.close-btn'),
      progress: document.querySelector('.progress'),
      summary: document.getElementById('summary'),
      keywords: document.getElementById('keywords'),
      resizeHandle: document.querySelector('.resize-handle')
    };

    this.initialize();
  }

  initialize() {
    this.setupEventListeners();
    this.setupDragging();
    this.setupResizing();
  }

  setupEventListeners() {
    this.elements.minimizeBtn.addEventListener('click', () => {
      this.elements.container.classList.toggle('minimized');
    });

    this.elements.closeBtn.addEventListener('click', () => {
      console.log('Close button clicked');
      
      window.parent.postMessage({ 
        type: 'closeReadingMode',
        feature: 'readingMode',
        enabled: false
      }, '*');
    });

    // 监听来自父页面的消息
    window.addEventListener('message', (event) => {
      console.log('Reading mode received message:', event.data);
      
      if (event.data.type === 'updateContent') {
        this.updateContent(event.data.content);
      } else if (event.data.type === 'updateProgress') {
        this.updateProgress(event.data.progress);
      }
    });
  }

  setupDragging() {
    let isDragging = false;
    let startX, startY;
    
    const header = this.elements.container.querySelector('.reading-header');
    
    header.addEventListener('mousedown', (e) => {
      if (e.target === header) {
        isDragging = true;
        const rect = this.elements.container.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        this.elements.container.style.transition = 'none';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      this.elements.container.style.left = `${newX}px`;
      this.elements.container.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.elements.container.style.transition = 'all 0.3s ease';
      }
    });
  }

  setupResizing() {
    let isResizing = false;
    let startWidth, startX;
    
    this.elements.resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startWidth = this.elements.container.offsetWidth;
      startX = e.clientX;
      this.elements.container.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;
      
      if (newWidth >= 200 && newWidth <= 800) {
        this.elements.container.style.width = `${newWidth}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        this.elements.container.style.transition = 'all 0.3s ease';
      }
    });
  }

  updateContent({ summary, keywords }) {
    console.log('Updating content:', { summary, keywords });
    
    if (this.elements.summary) {
        this.elements.summary.textContent = summary || 'No summary available';
    }
    
    if (this.elements.keywords) {
        this.elements.keywords.innerHTML = (keywords || [])
            .map(kw => `<span class="keyword">${kw}</span>`)
            .join('');
    }
  }

  updateProgress(progress) {
    this.elements.progress.style.width = `${progress}%`;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new ReadingMode();
}); 
/******/ })()
;
//# sourceMappingURL=reading-mode.js.map