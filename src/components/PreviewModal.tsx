import React, { useState } from 'react';

interface PreviewModalProps {
  stickerId: string;
  stickerUrl: string;
  folders: any[];
  onClose: () => void;
  onSend: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onAddToFolder: (stickerId: string, folderId: string) => void;
  currentTags: string[];
  currentFolders: string[];
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  stickerId,
  stickerUrl,
  folders,
  onClose,
  onSend,
  onAddTag,
  onAddToFolder,
  currentTags,
  currentFolders,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(stickerId, newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db]">
          <h3 className="font-bold text-[#3b4a54]">Sticker Preview</h3>
          <button onClick={onClose} className="text-[#667781] hover:text-[#3b4a54]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="w-48 h-48 bg-[#f9f9f9] rounded-xl flex items-center justify-center mb-6 shadow-inner">
            <img src={stickerUrl} alt="Preview" className="max-w-[80%] max-h-[80%]" />
          </div>

          <div className="w-full space-y-4">
            {/* Folders */}
            <div>
              <p className="text-xs font-bold text-[#667781] uppercase mb-2">Folders</p>
              <div className="flex flex-wrap gap-2">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => onAddToFolder(stickerId, folder.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors flex items-center gap-2 ${
                      currentFolders.includes(folder.id) 
                      ? 'bg-[#00a884] text-white border-[#00a884]' 
                      : 'border-[#d1d7db] text-[#667781] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" style={{ backgroundColor: currentFolders.includes(folder.id) ? 'white' : folder.color }}></span>
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs font-bold text-[#667781] uppercase mb-2">Tags</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentTags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-[#e9edef] text-[#3b4a54] rounded-md text-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="flex-1 p-2 bg-[#f0f2f5] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#00a884]"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <button type="submit" className="px-4 py-2 bg-[#00a884] text-white rounded-lg text-sm font-bold">Add</button>
              </form>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#f9f9f9] border-t border-[#d1d7db] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-[#00a884] font-bold hover:bg-[#f0f2f5] rounded-full transition-colors">
            Close
          </button>
          <button onClick={() => onSend(stickerId)} className="px-8 py-2 bg-[#00a884] text-white font-bold rounded-full shadow-md hover:bg-[#008f6f] transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
