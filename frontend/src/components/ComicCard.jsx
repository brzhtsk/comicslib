import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  ONGOING: 'Виходить',
  COMPLETED: 'Завершено',
  HIATUS: 'Призупинено',
};

const STATUS_COLORS = {
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  HIATUS: 'bg-yellow-100 text-yellow-800',
};

export default function ComicCard({ comic }) {
  return (
    <Link to={`/comics/${comic.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[2/3]">
        {comic.coverUrl ? (
          <img
            src={comic.coverUrl}
            alt={comic.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Немає обкладинки
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[comic.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[comic.status] ?? comic.status}
          </span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {comic.title}
        </p>

        {comic.genres?.length > 0 && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {comic.genres.map((g) => g.name).join(', ')}
          </p>
        )}

        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          <span>{comic.viewsCount ?? 0} переглядів</span>
          <span>{comic.likesCount ?? 0} лайків</span>
        </div>
      </div>
    </Link>
  );
}
