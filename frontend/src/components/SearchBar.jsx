import { useState } from 'react';

export default function SearchBar({ value, onChange }) {
  const [input, setInput] = useState(value);

  function handleKeyDown(e) {
    if (e.key === 'Enter') onChange(input);
  }

  function handleClear() {
    setInput('');
    onChange('');
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Пошук за назвою або автором..."
        className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-gray-400"
      />
      {input && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}
