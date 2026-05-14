import React from 'react';

interface StackerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const StackerButton: React.FC<StackerButtonProps> = ({ onClick, isOpen }) => {
  return (
    <div className="flex items-center justify-center p-2">
      <button
        onClick={onClick}
        className={`p-2 rounded-full transition-colors ${
          isOpen ? 'bg-[#00a884] text-white' : 'text-[#667781] hover:bg-[#f0f2f5]'
        }`}
        title="Stacker"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
        >
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>
  );
};

export default StackerButton;
