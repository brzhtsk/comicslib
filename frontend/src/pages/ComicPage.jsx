import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getComic, deleteComic } from '../api/comic.api.js';
import { getChapters } from '../api/chapter.api.js';
import { getComments } from '../api/comment.api.js';
import { toggleLike, getLikeStatus } from '../api/like.api.js';
import { getCollections, getComicCollection, setComicCollection, createCollection } from '../api/collection.api.js';
import { useAuth } from '../store/authStore.jsx';
import CommentSection, { plural } from '../components/CommentSection.jsx';

const STATUS_LABELS = { ONGOING: 'Виходить', COMPLETED: 'Завершено', HIATUS: 'Призупинено' };
const TYPE_ORDER    = { READING: 0, COMPLETED: 1, PLANNED: 2, FAVOURITE: 3, CUSTOM: 4 };

// SVG іконки
function EyeIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function HeartIcon({ filled }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function BookmarkIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function ChevronUpIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}

function CollectionModal({ comicId, onClose }) {
  const [collections, setCollections]       = useState([]);
  const [currentCollectionId, setCurrentId] = useState(null);
  const [newName, setNewName]               = useState('');
  const [creating, setCreating]             = useState(false);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    getComicCollection(comicId).then((res) => {
      setCollections(res.data.collections);
      setCurrentId(res.data.currentCollectionId);
      setLoading(false);
    });
  }, [comicId]);

  async function handleSelect(colId) {
    const next = currentCollectionId === colId ? null : colId;
    await setComicCollection(comicId, next);
    setCurrentId(next);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await createCollection(newName.trim());
    const newCol = { ...res.data, isActive: false };
    setCollections((prev) => [...prev, newCol]);
    await handleSelect(newCol.id);
    setNewName('');
    setCreating(false);
  }

  const sorted = [...collections].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 5) - (TYPE_ORDER[b.type] ?? 5),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Додати до колекції</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        {loading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : (
          <>
            <div className="space-y-1 mb-4 max-h-64 overflow-y-auto">
              {sorted.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleSelect(col.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    currentCollectionId === col.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{col.name}</span>
                  {currentCollectionId === col.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
            <form onSubmit={handleCreate} className="flex gap-2 pt-3 border-t border-gray-100">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Нова колекція..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300"
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center justify-center w-9 h-9 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ComicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const comicId  = parseInt(id);

  const [comic, setComic]               = useState(null);
  const [chapters, setChapters]         = useState([]);
  const [chapterOrder, setChapterOrder] = useState('asc');
  const [initialComments, setInitialComments] = useState([]);
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(0);
  const [showCollModal, setShowCollModal] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getComic(comicId),
      getChapters(comicId),
      getComments(comicId),
    ]).then(([comicRes, chaptersRes, commentsRes]) => {
      setComic(comicRes.data);
      setChapters(chaptersRes.data);
      setInitialComments(commentsRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, [comicId]);

  useEffect(() => {
    if (!user) return;
    getLikeStatus(comicId).then((res) => { setLiked(res.data.liked); setLikeCount(res.data.count); });
  }, [comicId, user]);

  const sortedChapters = [...chapters].sort((a, b) =>
    chapterOrder === 'asc' ? a.number - b.number : b.number - a.number,
  );

  async function handleLike() {
    if (!user) { navigate('/login'); return; }
    const res = await toggleLike(comicId);
    setLiked(res.data.liked);
    setLikeCount((c) => (res.data.liked ? c + 1 : c - 1));
  }

  async function handleDeleteComic() {
    const confirmed = window.confirm('Видалити комікс? Усі глави та коментарі також будуть видалені. Цю дію неможливо скасувати.');
    if (!confirmed) return;
    setDeleting(true);
    await deleteComic(comicId);
    navigate('/profile');
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );

  if (!comic) return <p className="text-center py-12 text-gray-500">Комікс не знайдено</p>;

  const firstChapter = sortedChapters[0];
  const lastChapter  = sortedChapters[sortedChapters.length - 1];
  const isOwner      = user?.id === comic.publisher?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {showCollModal && <CollectionModal comicId={comicId} onClose={() => setShowCollModal(false)} />}

      {/* Header */}
      <div className="flex gap-8">
        <div className="w-44 shrink-0">
          <img src={comic.coverUrl} alt={comic.title} className="w-full rounded-xl object-cover aspect-[2/3] shadow-md" />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{comic.title}</h1>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <Link to={`/upload/${comicId}`} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Редагувати
                </Link>
                <button
                  onClick={handleDeleteComic}
                  disabled={deleting}
                  className="text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Видалити
                </button>
              </div>
            )}
          </div>

          {/* Stats with icons */}
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><EyeIcon />{plural(comic.viewsCount ?? 0, 'перегляд', 'перегляди', 'переглядів')}</span>
            <span className="flex items-center gap-1.5"><HeartIcon />{plural(likeCount, 'вподобання', 'вподобання', 'вподобань')}</span>
            <span className="flex items-center gap-1.5"><BookmarkIcon />{plural(comic.bookmarksCount ?? 0, 'закладка', 'закладки', 'закладок')}</span>
          </div>

          <div className="text-sm text-gray-600 space-y-0.5">
            <p>Автор: <span className="font-medium text-gray-900">{comic.authorName}</span></p>
            {comic.translator && <p>Перекладач: <span className="font-medium text-gray-900">{comic.translator.username}</span></p>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
              {STATUS_LABELS[comic.status]}
            </span>
            {comic.genres?.map((g) => (
              <span key={g.id} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                {g.name}
              </span>
            ))}
          </div>

          {comic.description && <p className="text-sm text-gray-600 leading-relaxed">{comic.description}</p>}

          <div className="flex gap-3 flex-wrap pt-1">
            {firstChapter && (
              <Link to={`/reader/${comicId}/${firstChapter.id}`} className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Читати з початку
              </Link>
            )}
            {lastChapter && lastChapter.id !== firstChapter?.id && (
              <Link to={`/reader/${comicId}/${lastChapter.id}`} className="px-5 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                Остання глава
              </Link>
            )}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${liked ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <HeartIcon filled={liked} />
              {liked ? 'Вподобано' : 'Вподобати'}
            </button>
            {user && (
              <button
                onClick={() => setShowCollModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <BookmarkIcon />
                До колекції
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {plural(chapters.length, 'глава', 'глави', 'глав')}
          </h2>
          <button
            onClick={() => setChapterOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {chapterOrder === 'asc' ? <><ChevronUpIcon /> Від першої</> : <><ChevronDownIcon /> Від останньої</>}
          </button>
        </div>
        {sortedChapters.length === 0 ? (
          <p className="text-sm text-gray-500">Глав ще немає</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {sortedChapters.map((ch) => (
              <Link key={ch.id} to={`/reader/${comicId}/${ch.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                <span className="text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Глава {ch.number}{ch.title ? ` – ${ch.title}` : ''}
                </span>
                <span className="text-xs text-gray-400">{new Date(ch.createdAt).toLocaleDateString('uk-UA')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentSection
        comicId={comicId}
        initialComments={initialComments}
        user={user}
      />
    </div>
  );
}