import React from 'react';

interface StickerGridProps {
  stickerIds: string[];
  stickerUrls: Record<string, string>;
  onStickerClick: (id: string, url: string) => void;
}

const StickerGrid: React.FC<StickerGridProps> = ({ stickerIds, stickerUrls, onStickerClick }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {stickerIds.map((id) => (
        <div
          key={id}
          className="aspect-square bg-[#f0f2f5] rounded-lg overflow-hidden cursor-pointer hover:bg-[#d1d7db] transition-colors p-1 flex items-center justify-center"
          onClick={() => onStickerClick(id, stickerUrls[id] || '')}
        >
          {stickerUrls[id] ? (
            <img src={stickerUrls[id]} alt="Sticker" className="max-w-full max-h-full" />
          ) : (
            <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StickerGrid;
