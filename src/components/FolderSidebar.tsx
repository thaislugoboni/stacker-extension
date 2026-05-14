import React from 'react';

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface FolderSidebarProps {
  folders: Folder[];
  currentQuery: string;
  onFolderClick: (folderId: string | null) => void;
  onCreateFolder: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  currentQuery,
  onFolderClick,
  onCreateFolder,
}) => {
  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#667781] uppercase tracking-wider">Folders</h3>
        <button
          onClick={onCreateFolder}
          className="text-[#00a884] text-xs font-bold hover:bg-[#f0f2f5] px-2 py-1 rounded transition-colors uppercase"
        >
          + New
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <div
          className={`px-3 py-1.5 rounded-full cursor-pointer text-sm font-medium transition-all shadow-sm border ${
            !currentQuery.startsWith('folder:')
              ? 'bg-[#00a884] text-white border-[#00a884]'
              : 'bg-white text-[#667781] border-[#d1d7db] hover:border-[#00a884]'
          }`}
          onClick={() => onFolderClick(null)}
        >
          All
        </div>
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`px-3 py-1.5 rounded-full cursor-pointer text-sm font-medium transition-all shadow-sm border flex items-center gap-2 ${
              currentQuery === `folder:${folder.id}`
                ? 'bg-[#00a884] text-white border-[#00a884]'
                : 'bg-white text-[#667781] border-[#d1d7db] hover:border-[#00a884]'
            }`}
            onClick={() => onFolderClick(folder.id)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentQuery === `folder:${folder.id}` ? 'white' : folder.color }}
            ></span>
            {folder.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderSidebar;
