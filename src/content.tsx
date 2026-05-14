import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import StackerButton from './components/StackerButton';
import StackerPanel from './components/StackerPanel';
import './index.css';

// WhatsApp-specific selectors that might need updates
const SELECTORS = {
  SIDE_HEADER: '[data-testid="side"] header',
  STICKER_PANEL: '[data-testid="sticker-panel"]',
  STICKER_IMG: 'img[src^="blob:"]',
  APP_ROOT: '#app',
};

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TOGGLE_STACKER' && event.data.source === 'stacker-ui') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {isOpen && <StackerPanel />}
    </>
  );
};

const injectButton = () => {
  if (document.getElementById('stacker-button-root')) return;

  const sideHeader = document.querySelector(SELECTORS.SIDE_HEADER);
  if (sideHeader) {
    const root = document.createElement('div');
    root.id = 'stacker-button-root';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    
    // Inject before the last child (usually the menu/dots)
    if (sideHeader.lastElementChild) {
      sideHeader.insertBefore(root, sideHeader.lastElementChild);
    } else {
      sideHeader.appendChild(root);
    }

    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <StackerButton 
          onClick={() => window.postMessage({ type: 'TOGGLE_STACKER', source: 'stacker-ui' }, '*')} 
          isOpen={false} 
        />
      </React.StrictMode>
    );
  }
};

const injectApp = () => {
  if (document.getElementById('stacker-app-root')) return;

  const root = document.createElement('div');
  root.id = 'stacker-app-root';
  document.body.appendChild(root);

  // Note: We are injecting into the main document. 
  // In a more complex extension, we'd use a Shadow DOM to isolate styles.
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Bridge script injection (Manifest V3 compatible)
const injectBridge = () => {
  if (document.getElementById('stacker-bridge')) return;
  const script = document.createElement('script');
  script.id = 'stacker-bridge';
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    (this as any).remove();
  };
  (document.head || document.documentElement).appendChild(script);
};

const injectSaveButtons = () => {
  const stickers = document.querySelectorAll('.stacker-tagged-sticker');
  stickers.forEach((stickerEl) => {
    if (stickerEl.querySelector('.stacker-save-btn')) return;

    const id = stickerEl.getAttribute('data-stacker-id');
    if (!id) return;

    const btn = document.createElement('button');
    btn.className = 'stacker-save-btn';
    btn.innerHTML = '＋';
    Object.assign(btn.style, {
      position: 'absolute',
      top: '4px',
      right: '4px',
      zIndex: '100',
      backgroundColor: '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      transition: 'transform 0.1s ease',
    });

    btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';

    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'saveStickerTags', stickerId: id, tags: [] }, (response) => {
        if (response?.status === 'success') {
          btn.style.backgroundColor = '#128C7E';
          btn.innerHTML = '✓';
          setTimeout(() => {
             btn.innerHTML = '＋';
             btn.style.backgroundColor = '#25D366';
          }, 2000);
        }
      });
    };

    if (window.getComputedStyle(stickerEl).position === 'static') {
      (stickerEl as HTMLElement).style.position = 'relative';
    }
    
    stickerEl.appendChild(btn);
  });
};

// Optimized DOM observation
let observerTimeout: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver(() => {
  if (observerTimeout) return;
  
  observerTimeout = setTimeout(() => {
    injectButton();
    injectApp();
    
    // Only trigger tagging and button injection if panel is likely open
    if (document.querySelector(SELECTORS.STICKER_PANEL)) {
      window.postMessage({ type: 'TAG_STICKERS_IN_DOM', source: 'stacker-content' }, '*');
      injectSaveButtons();
    }
    
    observerTimeout = null;
  }, 500); // 500ms debounce for performance
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectBridge();
    observer.observe(document.body, { childList: true, subtree: true });
  });
} else {
  injectBridge();
  observer.observe(document.body, { childList: true, subtree: true });
}

// Global context menu listener for quick save
document.addEventListener('contextmenu', (e: MouseEvent) => {
  const stickerEl = (e.target as HTMLElement).closest('div[role="button"]');
  if (stickerEl && stickerEl.querySelector('img')) {
    const id = stickerEl.getAttribute('data-stacker-id');
    if (id) {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'saveStickerTags', stickerId: id, tags: [] });
      window.postMessage({ type: 'TOGGLE_STACKER', source: 'stacker-ui' }, '*');
    }
  }
});
