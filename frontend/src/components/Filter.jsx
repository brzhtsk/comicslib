const STATUSES = [
  { value: '', label: 'Всі' },
  { value: 'ONGOING', label: 'Виходить' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'HIATUS', label: 'Призупинено' },
];

export default function Filter({ genres, selected, status, onGenreChange, onStatusChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Статус</h3>
        <div className="space-y-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
                status === s.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Жанр</h3>
        <div className="space-y-1">
          <button
            onClick={() => onGenreChange('')}
            className={`w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
              selected === ''
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Всі жанри
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => onGenreChange(g.name)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
                selected === g.name
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
