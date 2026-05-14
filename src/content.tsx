import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import StackerButton from './components/StackerButton';
import StackerPanel from './components/StackerPanel';
import './index.css';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TOGGLE_STACKER' && event.data.source === 'stacker-ui') {
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  return (
    <>
      {isOpen && <StackerPanel />}
    </>
  );
};

const injectButton = () => {
  if (document.getElementById('stacker-button-root')) return;

  // Find a suitable place for the button (e.g., side menu header or chat header)
  // WhatsApp's side menu header
  const sideHeader = document.querySelector('header');
  if (sideHeader) {
    const root = document.createElement('div');
    root.id = 'stacker-button-root';
    sideHeader.appendChild(root);

    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <StackerButton onClick={() => window.postMessage({ type: 'TOGGLE_STACKER', source: 'stacker-ui' }, '*')} isOpen={false} />
      </React.StrictMode>
    );
  }
};

const injectApp = () => {
  if (document.getElementById('stacker-app-root')) return;

  const root = document.createElement('div');
  root.id = 'stacker-app-root';
  document.body.appendChild(root);

  // We need to inject Tailwind styles into the shadow DOM if we were using one,
  // but for now let's try direct injection to body with high z-index.
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start bridge script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    (this as any).remove();
};
(document.head || document.documentElement).appendChild(script);

// Initial injection
setTimeout(() => {
  injectButton();
  injectApp();
}, 2000);

// Observe DOM
const observer = new MutationObserver(() => {
  injectButton();
  injectApp();
  
  // Also trigger sticker tagging in the inject script
  window.postMessage({ type: 'TAG_STICKERS_IN_DOM', source: 'stacker-content' }, '*');
  injectSaveButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

const injectSaveButtons = () => {
  const stickers = document.querySelectorAll('.stacker-tagged-sticker');
  stickers.forEach((stickerEl) => {
    if (stickerEl.querySelector('.stacker-save-btn')) return;

    const id = stickerEl.getAttribute('data-stacker-id');
    if (!id) return;

    const btn = document.createElement('button');
    btn.className = 'stacker-save-btn';
    btn.innerHTML = '＋';
    btn.style.position = 'absolute';
    btn.style.top = '2px';
    btn.style.right = '2px';
    btn.style.zIndex = '100';
    btn.style.backgroundColor = '#25D366';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.width = '20px';
    btn.style.height = '20px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    btn.title = 'Save to Stacker';

    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'saveStickerTags', stickerId: id, tags: [] }, (response) => {
        if (response && response.status === 'success') {
          btn.style.backgroundColor = '#128C7E';
          btn.innerHTML = '✓';
          setTimeout(() => {
             btn.innerHTML = '＋';
             btn.style.backgroundColor = '#25D366';
          }, 2000);
        }
      });
    };

    // Ensure parent is relative for absolute positioning
    if (window.getComputedStyle(stickerEl).position === 'static') {
      (stickerEl as HTMLElement).style.position = 'relative';
    }
    
    stickerEl.appendChild(btn);
  });
};

// Listen for sticker clicks in the WhatsApp UI to allow saving/tagging
document.addEventListener('contextmenu', (e: MouseEvent) => {
  const stickerEl = (e.target as HTMLElement).closest('div[role="button"]');
  if (stickerEl && stickerEl.querySelector('img')) {
    const id = stickerEl.getAttribute('data-stacker-id');
    if (id) {
      e.preventDefault();
      // We could open the panel and search for this sticker or open a quick tag menu
      console.log('Stacker: Right-clicked sticker', id);
      // For now, let's just make sure it's saved in metadata if it isn't already
      chrome.runtime.sendMessage({ action: 'saveStickerTags', stickerId: id, tags: [] });
      // And maybe open the Stacker panel
      window.postMessage({ type: 'TOGGLE_STACKER', source: 'stacker-ui' }, '*');
    }
  }
});
