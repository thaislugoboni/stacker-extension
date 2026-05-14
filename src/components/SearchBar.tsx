import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="p-4 border-b border-[#d1d7db] bg-[#f9f9f9]">
      <div className="relative">
        <input
          type="text"
          placeholder="Search stickers..."
          className="w-full p-2 pl-9 bg-white rounded-lg border border-[#d1d7db] focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884] outline-none text-sm transition-all shadow-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute left-3 top-2.5 text-[#667781]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M15.009 13.805h-.636l-.227-.217a5.21 5.21 0 0 0 1.264-3.388 5.23 5.23 0 1 0-5.23 5.23 5.21 5.21 0 0 0 3.388-1.264l.217.227v.636l4.023 4.015 1.198-1.198-4.015-4.023zm-4.83 0a3.626 3.626 0 1 1 0-7.253 3.626 3.626 0 0 1 0 7.253z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
