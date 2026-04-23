const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Дата додавання' },
  { value: 'title',     label: 'Назва' },
  { value: 'views',     label: 'Перегляди' },
  { value: 'likes',     label: 'Вподобання' },
];

function ArrowUp() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
}
function ArrowDown() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}

export default function Sorter({ sortBy, order, onSortByChange, onOrderChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-indigo-300"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={() => onOrderChange(order === 'desc' ? 'asc' : 'desc')}
        className="flex items-center justify-center w-8 h-8 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        title={order === 'desc' ? 'За спаданням' : 'За зростанням'}
      >
        {order === 'desc' ? <ArrowDown /> : <ArrowUp />}
      </button>
    </div>
  );
}