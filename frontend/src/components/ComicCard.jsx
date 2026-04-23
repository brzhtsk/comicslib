import { Link } from 'react-router-dom';
import { plural } from './CommentSection.jsx';

const STATUS_LABELS = { ONGOING: 'Виходить', COMPLETED: 'Завершено', HIATUS: 'Призупинено' };
const STATUS_COLORS = {
  ONGOING:   'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  HIATUS:    'bg-amber-100 text-amber-800',
};

function EyeIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function HeartIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}

export default function ComicCard({ comic }) {
  return (
    <Link to={`/comics/${comic.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[2/3] shadow-sm">
        {comic.coverUrl ? (
          <>
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
          </>
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
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {comic.title}
        </p>
        {comic.genres?.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {comic.genres.map((g) => g.name).join(', ')}
          </p>
        )}
        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><EyeIcon />{plural(comic.viewsCount ?? 0, 'перегляд', 'перегляди', 'переглядів')}</span>
          <span className="flex items-center gap-1"><HeartIcon />{plural(comic.likesCount ?? 0, 'вподобання', 'вподобання', 'вподобань')}</span>
        </div>
      </div>
    </Link>
  );
}