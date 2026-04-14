import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComic } from '../api/comic.api.js';
import { getChapters } from '../api/chapter.api.js';
import { getComments, createComment, deleteComment } from '../api/comment.api.js';
import { toggleLike, getLikeStatus } from '../api/like.api.js';
import { addToCollection, getComicStatus } from '../api/collection.api.js';
import { useAuth } from '../store/authStore.jsx';

const STATUS_LABELS = {
  ONGOING: 'Виходить',
  COMPLETED: 'Завершено',
  HIATUS: 'Призупинено',
};

const COLLECTION_STATUSES = [
  { value: 'READING', label: 'Читаю' },
  { value: 'COMPLETED', label: 'Прочитано' },
  { value: 'PLANNED', label: 'В планах' },
  { value: 'FAVOURITE', label: 'Улюблене' },
];

export default function ComicPage() {
  const { id } = useParams();
  const comicId = parseInt(id);
  const { user } = useAuth();

  const [comic, setComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [collectionStatuses, setCollectionStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getComic(comicId),
      getChapters(comicId),
      getComments(comicId),
    ])
      .then(([comicRes, chaptersRes, commentsRes]) => {
        setComic(comicRes.data);
        setChapters(chaptersRes.data);
        setComments(commentsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [comicId]);

  useEffect(() => {
    if (!user) return;
    getLikeStatus(comicId).then((res) => {
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    });
    getComicStatus(comicId).then((res) => {
      setCollectionStatuses(res.data.statuses ?? []);
    });
  }, [comicId, user]);

  async function handleLike() {
    if (!user) return;
    const res = await toggleLike(comicId);
    setLiked(res.data.liked);
    setLikeCount((c) => (res.data.liked ? c + 1 : c - 1));
  }

  async function handleAddToCollection(status) {
    if (!user) return;
    await addToCollection({ comicId, status });
    setCollectionStatuses((prev) =>
      prev.includes(status) ? prev : [...prev, status],
    );
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const res = await createComment(comicId, { text: commentText.trim() });
    setComments((prev) => [res.data, ...prev]);
    setCommentText('');
    setCommentLoading(false);
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(comicId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!comic) return <p className="text-center py-12 text-gray-500">Комікс не знайдено</p>;

  const firstChapter = chapters[0];
  const lastChapter = chapters[chapters.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex gap-8">
        <div className="w-48 shrink-0">
          {comic.coverUrl ? (
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full rounded-lg object-cover aspect-[2/3]"
            />
          ) : (
            <div className="w-full rounded-lg bg-gray-100 aspect-[2/3] flex items-center justify-center text-gray-400 text-sm">
              Немає обкладинки
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{comic.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{comic.viewsCount ?? 0} переглядів</span>
            <span>{likeCount} лайків</span>
            <span>{comic.commentsCount ?? 0} коментарів</span>
            <span>{comic.chaptersCount ?? 0} глав</span>
          </div>

          {comic.author && (
            <p className="text-sm text-gray-600">
              Автор: <span className="font-medium">{comic.author.username}</span>
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {STATUS_LABELS[comic.status] ?? comic.status}
            </span>
            {comic.genres?.map((g) => (
              <span key={g.id} className="text-sm px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {g.name}
              </span>
            ))}
          </div>

          {comic.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{comic.description}</p>
          )}

          <div className="flex gap-3 flex-wrap">
            {firstChapter && (
              <Link
                to={`/reader/${comicId}/${firstChapter.id}`}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
              >
                Читати з початку
              </Link>
            )}
            {lastChapter && lastChapter.id !== firstChapter?.id && (
              <Link
                to={`/reader/${comicId}/${lastChapter.id}`}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
              >
                Остання глава
              </Link>
            )}
            {user && (
              <button
                onClick={handleLike}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  liked
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {liked ? '♥ Вподобано' : '♡ Вподобати'}
              </button>
            )}
          </div>

          {user && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Додати до колекції:</p>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleAddToCollection(s.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      collectionStatuses.includes(s.value)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Глави ({chapters.length})
        </h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-gray-500">Глав ще немає</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                to={`/reader/${comicId}/${ch.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-900">
                  Глава {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(ch.createdAt).toLocaleDateString('uk-UA')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Коментарі ({comments.length})
        </h2>

        {user && (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишіть коментар..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700"
              >
                Надіслати
              </button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">Коментарів ще немає</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                  {c.user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.user.username}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                    {user?.id === c.user.id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto"
                      >
                        Видалити
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}