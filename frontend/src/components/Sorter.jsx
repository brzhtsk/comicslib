const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Дата додавання' },
  { value: 'title', label: 'Назва' },
  { value: 'views', label: 'Перегляди' },
  { value: 'likes', label: 'Лайки' },
];

export default function Sorter({ sortBy, order, onSortByChange, onOrderChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        onClick={() => onOrderChange(order === 'desc' ? 'asc' : 'desc')}
        className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 hover:bg-gray-50 w-8 text-center"
        title={order === 'desc' ? 'За спаданням' : 'За зростанням'}
      >
        {order === 'desc' ? '↓' : '↑'}
      </button>
    </div>
  );
}
