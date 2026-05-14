import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StickerGrid from './StickerGrid';
import PreviewModal from './PreviewModal';
import SearchBar from './SearchBar';
import FolderSidebar from './FolderSidebar';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface StickerMeta {
  tags: string[];
  folders: string[];
  addedAt: number;
}

const StackerPanel: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingStickers, setMatchingStickers] = useState<string[]>([]);
  const [stickerUrls, setStickerUrls] = useState<Record<string, string>>({});
  const [stickerMetadata, setStickerMetadata] = useState<Record<string, StickerMeta>>({});
  const [selectedSticker, setSelectedSticker] = useState<{ id: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFolders = useCallback(() => {
    chrome.runtime.sendMessage({ action: 'getFolders' }, (response) => {
      if (response?.folders) {
        setFolders(response.folders);
      }
    });
  }, []);

  const fetchMetadata = useCallback(() => {
    chrome.storage.local.get(['stickerMetadata'], (result) => {
      if (result.stickerMetadata) {
        setStickerMetadata(result.stickerMetadata as Record<string, StickerMeta>);
      }
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    chrome.runtime.sendMessage({ action: 'searchStickers', query }, (response) => {
      setIsLoading(false);
      if (response?.results) {
        setMatchingStickers(response.results);
        
        // Request missing URLs from inject script
        const missingIds = response.results.filter((id: string) => !stickerUrls[id]);
        if (missingIds.length > 0) {
          window.postMessage({
            type: 'GET_STICKERS_URLS',
            source: 'stacker-content',
            stickerIds: missingIds,
            requestId: Math.random().toString(36).substring(7)
          }, '*');
        }
      }
    });
  }, [stickerUrls]);

  useEffect(() => {
    fetchFolders();
    fetchMetadata();
    handleSearch(''); // Initial search
  }, [fetchFolders, fetchMetadata, handleSearch]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.source !== 'stacker-inject') return;

      if (event.data.type === 'STICKER_DATA_DISCOVERED') {
        const { stickerId, url } = event.data;
        setStickerUrls(prev => ({ ...prev, [stickerId]: url }));
      }

      if (event.data.type === 'STICKERS_URLS_RESPONSE') {
        const { urls } = event.data;
        setStickerUrls(prev => ({ ...prev, ...urls }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const createFolder = () => {
    const name = prompt('Folder name:');
    if (name?.trim()) {
      chrome.runtime.sendMessage({ action: 'createFolder', folderName: name.trim() }, (response) => {
        if (response?.folder) {
          setFolders(prev => [...prev, response.folder]);
        }
      });
    }
  };

  const handleStickerClick = (id: string, url: string) => {
    setSelectedSticker({ id, url });
    fetchMetadata(); 
  };

  const handleSend = (id: string) => {
    window.postMessage({
      type: 'SEND_STICKER',
      source: 'stacker-content',
      stickerId: id
    }, '*');
    setSelectedSticker(null);
  };

  const handleAddTag = (id: string, tag: string) => {
    const currentTags = stickerMetadata[id]?.tags || [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      chrome.runtime.sendMessage({ action: 'saveStickerTags', stickerId: id, tags: newTags }, (response) => {
        if (response?.status === 'success') {
          fetchMetadata();
        }
      });
    }
  };

  const handleAddToFolder = (id: string, folderId: string) => {
    const currentFolders = stickerMetadata[id]?.folders || [];
    const action = currentFolders.includes(folderId) ? 'removeStickerFromFolder' : 'addStickerToFolder';
    
    chrome.runtime.sendMessage({ action, stickerId: id, folderId }, (response) => {
      if (response?.status === 'success') {
        fetchMetadata();
      }
    });
  };

  const panelStyles = useMemo(() => ({
    width: '320px',
    backgroundColor: 'white',
    boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
    zIndex: 10000,
  }), []);

  return (
    <div 
      className="fixed top-0 right-0 h-full flex flex-col border-l border-[#d1d7db] animate-slide-in font-sans"
      style={panelStyles}
    >
      <div className="p-4 bg-[#00a884] text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          <h2 className="text-lg font-bold">Stacker</h2>
        </div>
        <button 
          onClick={() => window.postMessage({ type: 'TOGGLE_STACKER', source: 'stacker-ui' }, '*')} 
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
          title="Close Panel"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
          </svg>
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={handleSearch} />

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f0f2f5]">
        <FolderSidebar 
          folders={folders} 
          currentQuery={searchQuery} 
          onFolderClick={(id) => handleSearch(id ? `folder:${id}` : '')}
          onCreateFolder={createFolder}
        />

        <div className="p-4 border-t border-[#d1d7db] bg-white mt-2 min-h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#667781] uppercase tracking-wider">Results</h3>
            {isLoading && <div className="w-4 h-4 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>}
          </div>
          
          <StickerGrid 
            stickerIds={matchingStickers} 
            stickerUrls={stickerUrls} 
            onStickerClick={handleStickerClick}
          />
          
          {matchingStickers.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-[#667781]">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" className="opacity-20 mb-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <p className="text-sm font-medium">No stickers found</p>
              <p className="text-xs mt-1 text-center">Save stickers from WhatsApp by clicking the green ＋ button!</p>
            </div>
          )}
        </div>
      </div>

      {selectedSticker && (
        <PreviewModal
          stickerId={selectedSticker.id}
          stickerUrl={selectedSticker.url}
          folders={folders}
          onClose={() => setSelectedSticker(null)}
          onSend={handleSend}
          onAddTag={handleAddTag}
          onAddToFolder={handleAddToFolder}
          currentTags={stickerMetadata[selectedSticker.id]?.tags || []}
          currentFolders={stickerMetadata[selectedSticker.id]?.folders || []}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d7db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #adb5bd;
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
};

export default StackerPanel;
