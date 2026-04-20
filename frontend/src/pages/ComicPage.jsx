import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getComic, deleteComic } from '../api/comic.api.js';
import { getChapters } from '../api/chapter.api.js';
import { getComments, createComment, deleteComment, reactToComment } from '../api/comment.api.js';
import { toggleLike, getLikeStatus } from '../api/like.api.js';
import { setComicCollection, removeFromCollection, getComicStatus } from '../api/collection.api.js';
import { useAuth } from '../store/authStore.jsx';

const STATUS_LABELS = { ONGOING: 'Виходить', COMPLETED: 'Завершено', HIATUS: 'Призупинено' };

const COLLECTION_OPTIONS = [
  { value: '',          label: 'Не в колекції' },
  { value: 'READING',   label: 'Читаю' },
  { value: 'COMPLETED', label: 'Прочитано' },
  { value: 'PLANNED',   label: 'В планах' },
  { value: 'FAVOURITE', label: 'Улюблене' },
];

function CommentItem({ comment, comicId, user, onReply, onDelete }) {
  const [reactionState, setReactionState] = useState(null);

  async function handleReact(type) {
    if (!user) return;
    const res = await reactToComment(comicId, comment.id, type);
    setReactionState(res.data.reaction);
  }

  const likes    = (comment.likesCount ?? 0) + (reactionState === 'LIKE'    ? 1 : reactionState === null && comment.userReaction === 'LIKE'    ? -1 : 0);
  const dislikes = (comment.dislikesCount ?? 0) + (reactionState === 'DISLIKE' ? 1 : reactionState === null && comment.userReaction === 'DISLIKE' ? -1 : 0);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
        {comment.user.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{comment.user.username}</span>
          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('uk-UA')}</span>
          {user?.id === comment.user.id && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto">
              Видалити
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {user && (
            <>
              <button onClick={() => handleReact('LIKE')} className={`text-xs flex items-center gap-1 ${reactionState === 'LIKE' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                👍 {likes > 0 ? likes : ''}
              </button>
              <button onClick={() => handleReact('DISLIKE')} className={`text-xs flex items-center gap-1 ${reactionState === 'DISLIKE' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>
                👎 {dislikes > 0 ? dislikes : ''}
              </button>
              <button onClick={() => onReply(comment)} className="text-xs text-gray-400 hover:text-gray-600">
                Відповісти
              </button>
            </>
          )}
          {comment.repliesCount > 0 && (
            <span className="text-xs text-gray-400">{comment.repliesCount} відповідей</span>
          )}
        </div>
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} comicId={comicId} user={user} onReply={onReply} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const comicId = parseInt(id);

  const [comic, setComic]               = useState(null);
  const [chapters, setChapters]         = useState([]);
  const [chapterOrder, setChapterOrder] = useState('asc');
  const [comments, setComments]         = useState([]);
  const [commentText, setCommentText]   = useState('');
  const [replyTo, setReplyTo]           = useState(null);
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(0);
  const [collectionStatus, setCollectionStatus] = useState('');
  const [loading, setLoading]           = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getComic(comicId), getChapters(comicId), getComments(comicId)])
      .then(([comicRes, chaptersRes, commentsRes]) => {
        setComic(comicRes.data);
        setChapters(chaptersRes.data);
        setComments(commentsRes.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [comicId]);

  useEffect(() => {
    if (!user) return;
    getLikeStatus(comicId).then((res) => { setLiked(res.data.liked); setLikeCount(res.data.count); });
    getComicStatus(comicId).then((res) => setCollectionStatus(res.data.status ?? ''));
  }, [comicId, user]);

  const sortedChapters = [...chapters].sort((a, b) =>
    chapterOrder === 'asc' ? a.number - b.number : b.number - a.number,
  );

  async function handleLike() {
    if (!user) return;
    const res = await toggleLike(comicId);
    setLiked(res.data.liked);
    setLikeCount((c) => (res.data.liked ? c + 1 : c - 1));
  }

  async function handleCollection(status) {
    if (!user) return;
    if (status === '') {
      await removeFromCollection(comicId);
    } else {
      await setComicCollection({ comicId, status });
    }
    setCollectionStatus(status);
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const res = await createComment(comicId, {
      text: commentText.trim(),
      parentId: replyTo?.id ?? null,
    });
    if (replyTo) {
      setComments((prev) => prev.map((c) =>
        c.id === replyTo.id
          ? { ...c, replies: [...(c.replies ?? []), res.data], repliesCount: (c.repliesCount ?? 0) + 1 }
          : c,
      ));
    } else {
      setComments((prev) => [res.data, ...prev]);
    }
    setCommentText('');
    setReplyTo(null);
    setCommentLoading(false);
  }

  const handleDeleteComment = useCallback(async (commentId) => {
    await deleteComment(comicId, commentId);
    setComments((prev) => prev
      .filter((c) => c.id !== commentId)
      .map((c) => ({ ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) })),
    );
  }, [comicId]);

  async function handleDeleteComic() {
    if (!window.confirm('Видалити комікс? Цю дію неможливо скасувати.')) return;
    setDeleting(true);
    await deleteComic(comicId);
    navigate('/profile');
  }

  if (loading) return <div className="animate-pulse space-y-4 max-w-4xl mx-auto"><div className="h-8 bg-gray-200 rounded w-1/2" /><div className="h-64 bg-gray-200 rounded" /></div>;
  if (!comic)  return <p className="text-center py-12 text-gray-500">Комікс не знайдено</p>;

  const firstChapter = sortedChapters[0];
  const lastChapter  = sortedChapters[sortedChapters.length - 1];
  const isOwner = user?.id === comic.author?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex gap-8">
        <div className="w-48 shrink-0">
          <img src={comic.coverUrl} alt={comic.title} className="w-full rounded-lg object-cover aspect-[2/3]" />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{comic.title}</h1>
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <Link to={`/upload/${comicId}`} className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">
                  Редагувати
                </Link>
                <button onClick={handleDeleteComic} disabled={deleting} className="text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 disabled:opacity-50">
                  Видалити
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{comic.viewsCount ?? 0} переглядів</span>
            <span>{likeCount} вподобань</span>
            <span>{comic.bookmarksCount ?? 0} закладок</span>
          </div>

          <div className="text-sm text-gray-600 space-y-0.5">
            {comic.author && <p>Автор: <span className="font-medium">{comic.author.username}</span></p>}
            {comic.translator && <p>Перекладач: <span className="font-medium">{comic.translator.username}</span></p>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{STATUS_LABELS[comic.status]}</span>
            {comic.genres?.map((g) => (
              <span key={g.id} className="text-sm px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{g.name}</span>
            ))}
          </div>

          {comic.description && <p className="text-sm text-gray-700 leading-relaxed">{comic.description}</p>}

          <div className="flex gap-3 flex-wrap">
            {firstChapter && (
              <Link to={`/reader/${comicId}/${firstChapter.id}`} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">
                Читати з початку
              </Link>
            )}
            {lastChapter && lastChapter.id !== firstChapter?.id && (
              <Link to={`/reader/${comicId}/${lastChapter.id}`} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Остання глава
              </Link>
            )}
            {user && (
              <button onClick={handleLike} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {liked ? '♥ Вподобано' : '♡ Вподобати'}
              </button>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Колекція:</label>
              <select
                value={collectionStatus}
                onChange={(e) => handleCollection(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
              >
                {COLLECTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Глави ({chapters.length})</h2>
          <button
            onClick={() => setChapterOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="text-sm border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50"
          >
            {chapterOrder === 'asc' ? '↑ За зростанням' : '↓ За спаданням'}
          </button>
        </div>
        {sortedChapters.length === 0 ? (
          <p className="text-sm text-gray-500">Глав ще немає</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {sortedChapters.map((ch) => (
              <Link key={ch.id} to={`/reader/${comicId}/${ch.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-900">Глава {ch.number}{ch.title ? ` — ${ch.title}` : ''}</span>
                <span className="text-xs text-gray-400">{new Date(ch.createdAt).toLocaleDateString('uk-UA')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Коментарі ({comments.length})</h2>

        {user && (
          <form onSubmit={handleComment} className="mb-6">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                <span>Відповідь для <span className="font-medium">{replyTo.user.username}</span></span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyTo ? 'Напишіть відповідь...' : 'Напишіть коментар...'}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={commentLoading || !commentText.trim()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700">
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
              <CommentItem key={c.id} comment={c} comicId={comicId} user={user} onReply={setReplyTo} onDelete={handleDeleteComment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}