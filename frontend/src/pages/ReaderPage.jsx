import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChapter, getChapters } from '../api/chapter.api.js';
import { toggleLike, getLikeStatus } from '../api/like.api.js';
import { getComments, createComment, reactToComment } from '../api/comment.api.js';
import { useAuth } from '../store/authStore.jsx';

function CommentItem({ comment, comicId, user, onReply }) {
  const [reaction, setReaction] = useState(null);

  async function handleReact(type) {
    if (!user) return;
    const res = await reactToComment(comicId, comment.id, type);
    setReaction(res.data.reaction);
  }

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
        {comment.user.username[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{comment.user.username}</span>
          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('uk-UA')}</span>
        </div>
        <p className="text-sm text-gray-700">{comment.text}</p>
        {user && (
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => handleReact('LIKE')} className={`text-xs ${reaction === 'LIKE' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>👍</button>
            <button onClick={() => handleReact('DISLIKE')} className={`text-xs ${reaction === 'DISLIKE' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>👎</button>
            <button onClick={() => onReply(comment)} className="text-xs text-gray-400 hover:text-gray-600">Відповісти</button>
          </div>
        )}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-100">
            {comment.replies.map((r) => (
              <CommentItem key={r.id} comment={r} comicId={comicId} user={user} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReaderPage() {
  const { comicId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const cId  = parseInt(comicId);
  const chId = parseInt(chapterId);

  const [chapter, setChapter]           = useState(null);
  const [chapters, setChapters]         = useState([]);
  const [currentPage, setCurrentPage]   = useState(0);
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(0);
  const [comments, setComments]         = useState([]);
  const [commentText, setCommentText]   = useState('');
  const [replyTo, setReplyTo]           = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(0);
    Promise.all([getChapter(cId, chId), getChapters(cId)])
      .then(([chRes, chsRes]) => { setChapter(chRes.data); setChapters(chsRes.data); })
      .finally(() => setLoading(false));
  }, [cId, chId]);

  useEffect(() => {
    if (!user) return;
    getLikeStatus(cId, { chapterId: chId }).then((res) => { setLiked(res.data.liked); setLikeCount(res.data.count); });
    getComments(cId, { chapterId: chId }).then((res) => setComments(res.data.data ?? []));
  }, [cId, chId, user]);

  const goToPrev = useCallback(() => { if (currentPage > 0) { setCurrentPage((p) => p - 1); window.scrollTo(0, 0); } }, [currentPage]);
  const goToNext = useCallback(() => {
    if (chapter && currentPage < chapter.pages.length - 1) { setCurrentPage((p) => p + 1); window.scrollTo(0, 0); }
  }, [chapter, currentPage]);

  useEffect(() => {
    const handle = (e) => { if (e.key === 'ArrowLeft') goToPrev(); if (e.key === 'ArrowRight') goToNext(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [goToPrev, goToNext]);

  const idx         = chapters.findIndex((ch) => ch.id === chId);
  const prevChapter = chapters[idx - 1] ?? null;
  const nextChapter = chapters[idx + 1] ?? null;

  async function handleLike() {
    if (!user) return;
    const res = await toggleLike(cId, { chapterId: chId });
    setLiked(res.data.liked);
    setLikeCount((c) => (res.data.liked ? c + 1 : c - 1));
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await createComment(cId, { text: commentText.trim(), chapterId: chId, parentId: replyTo?.id ?? null });
    if (replyTo) {
      setComments((prev) => prev.map((c) =>
        c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), res.data] } : c,
      ));
    } else {
      setComments((prev) => [res.data, ...prev]);
    }
    setCommentText('');
    setReplyTo(null);
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" /></div>;
  if (!chapter) return <p className="text-center py-12 text-gray-500">Главу не знайдено</p>;

  const totalPages = chapter.pages.length;
  const page       = chapter.pages[currentPage];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4">
        <Link to={`/comics/${cId}`} className="text-sm text-gray-500 hover:text-gray-900 truncate">← До коміксу</Link>
        <div className="flex items-center gap-2 shrink-0">
          {prevChapter && (
            <button onClick={() => navigate(`/reader/${cId}/${prevChapter.id}`)} className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">← Попередня</button>
          )}
          <select value={chId} onChange={(e) => navigate(`/reader/${cId}/${e.target.value}`)} className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white">
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>Глава {ch.number}{ch.title ? ` — ${ch.title}` : ''}</option>
            ))}
          </select>
          {nextChapter && (
            <button onClick={() => navigate(`/reader/${cId}/${nextChapter.id}`)} className="text-sm px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">Наступна →</button>
          )}
        </div>
      </div>

      {totalPages > 0 ? (
        <>
          <div className="relative bg-black rounded-lg overflow-hidden select-none">
            <img key={page?.url} src={page?.url} alt={`Сторінка ${currentPage + 1}`} className="w-full object-contain max-h-[80vh]" draggable={false} />
            <button onClick={goToPrev} disabled={currentPage === 0} className="absolute left-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default" />
            <button onClick={goToNext} disabled={currentPage === totalPages - 1} className="absolute right-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default" />
          </div>

          <div className="flex items-center justify-between mt-3">
            <button onClick={goToPrev} disabled={currentPage === 0} className="text-sm px-4 py-2 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">← Назад</button>

            <div className="flex items-center gap-3">
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i} value={i}>Стор. {i + 1} / {totalPages}</option>
                ))}
              </select>
              {user && (
                <button onClick={handleLike} className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded border transition-colors ${liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {liked ? '♥' : '♡'} {likeCount}
                </button>
              )}
              <button onClick={() => setShowComments((s) => !s)} className="text-sm px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                Коментарі ({comments.length})
              </button>
            </div>

            <button onClick={goToNext} disabled={currentPage === totalPages - 1} className="text-sm px-4 py-2 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Далі →</button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">Навігація: стрілки ← → або клік по краях зображення</p>
        </>
      ) : (
        <p className="text-center py-12 text-gray-500">Сторінок у главі немає</p>
      )}

      {showComments && (
        <div className="mt-8 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Коментарі до глави</h3>
          {user && (
            <form onSubmit={handleComment}>
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <span>Відповідь для <span className="font-medium">{replyTo.user.username}</span></span>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              )}
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Напишіть коментар..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400" />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={!commentText.trim()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700">Надіслати</button>
              </div>
            </form>
          )}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">Коментарів ще немає</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} comicId={cId} user={user} onReply={setReplyTo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}