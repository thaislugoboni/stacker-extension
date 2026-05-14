chrome.runtime.onInstalled.addListener(() => {
  console.log('Stacker extension installed');
  // Initialize storage if empty
  chrome.storage.local.get(['stickerMetadata', 'folders'], (result) => {
    if (!result.stickerMetadata) {
      chrome.storage.local.set({ stickerMetadata: {} });
    }
    if (!result.folders) {
      chrome.storage.local.set({ folders: [] });
    }
  });
});

interface StickerMeta {
  tags: string[];
  folders: string[];
  addedAt: number;
}

interface Folder {
  id: string;
  name: string;
  color: string;
}

// Helper to get all sticker metadata
const getStickerMetadata = (): Promise<Record<string, StickerMeta>> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['stickerMetadata'], (result) => {
      resolve((result.stickerMetadata as Record<string, StickerMeta>) || {});
    });
  });
};

// Helper to save sticker metadata
const saveStickerMetadata = (metadata: Record<string, StickerMeta>): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ stickerMetadata: metadata }, () => {
      resolve();
    });
  });
};

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'saveStickerTags') {
    const { stickerId, tags } = request;
    getStickerMetadata().then((metadata) => {
      if (!metadata[stickerId]) {
        metadata[stickerId] = { tags: [], folders: [], addedAt: Date.now() };
      }
      metadata[stickerId].tags = tags;
      saveStickerMetadata(metadata).then(() => {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }

  if (request.action === 'addStickerToFolder') {
    const { stickerId, folderId } = request;
    getStickerMetadata().then((metadata) => {
      if (!metadata[stickerId]) {
        metadata[stickerId] = { tags: [], folders: [], addedAt: Date.now() };
      }
      if (!metadata[stickerId].folders.includes(folderId)) {
        metadata[stickerId].folders.push(folderId);
      }
      saveStickerMetadata(metadata).then(() => {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }

  if (request.action === 'removeStickerFromFolder') {
    const { stickerId, folderId } = request;
    getStickerMetadata().then((metadata) => {
      if (metadata[stickerId]) {
        metadata[stickerId].folders = metadata[stickerId].folders.filter(f => f !== folderId);
        saveStickerMetadata(metadata).then(() => {
          sendResponse({ status: 'success' });
        });
      } else {
        sendResponse({ status: 'not_found' });
      }
    });
    return true;
  }

  if (request.action === 'searchStickers') {
    const { query } = request;
    
    getStickerMetadata().then((metadata) => {
      let results: string[] = [];
      if (query.startsWith('folder:')) {
        const targetFolderId = query.replace('folder:', '');
        results = Object.keys(metadata).filter(stickerId => 
          metadata[stickerId].folders.includes(targetFolderId)
        );
      } else {
        const lowerQuery = query.toLowerCase();
        results = Object.keys(metadata).filter((stickerId) => {
          const item = metadata[stickerId];
          const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
          const foldersMatch = item.folders.some(folderId => folderId.toLowerCase().includes(lowerQuery));
          return tagsMatch || foldersMatch;
        });
      }
      sendResponse({ results });
    });
    return true;
  }

  if (request.action === 'getFolders') {
    chrome.storage.local.get(['folders'], (result) => {
      sendResponse({ folders: (result.folders as Folder[]) || [] });
    });
    return true;
  }

  if (request.action === 'createFolder') {
    const { folderName } = request;
    chrome.storage.local.get(['folders'], (result) => {
      const folders: Folder[] = (result.folders as Folder[]) || [];
      const newFolder: Folder = {
        id: folderName.toLowerCase().replace(/\s+/g, '-'),
        name: folderName,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
      folders.push(newFolder);
      chrome.storage.local.set({ folders }, () => {
        sendResponse({ folder: newFolder });
      });
    });
    return true;
  }

  if (request.action === 'deleteFolder') {
    const { folderId } = request;
    chrome.storage.local.get(['folders', 'stickerMetadata'], (result) => {
      let folders: Folder[] = (result.folders as Folder[]) || [];
      folders = folders.filter(f => f.id !== folderId);
      
      const metadata: Record<string, StickerMeta> = (result.stickerMetadata as Record<string, StickerMeta>) || {};
      Object.keys(metadata).forEach(stickerId => {
        metadata[stickerId].folders = metadata[stickerId].folders.filter(f => f !== folderId);
      });

      chrome.storage.local.set({ folders, stickerMetadata: metadata }, () => {
        sendResponse({ status: 'success' });
      });
    });
    return true;
  }
});
