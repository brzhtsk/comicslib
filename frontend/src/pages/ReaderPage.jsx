import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChapter, getChapters } from '../api/chapter.api.js';
import { toggleLike, getLikeStatus } from '../api/like.api.js';
import { getComments } from '../api/comment.api.js';
import { useAuth } from '../store/authStore.jsx';
import CommentSection from '../components/CommentSection.jsx';

function ChevronLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function ChevronRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function HeartIcon({ filled }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function MessageIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
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
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(0);
    setShowComments(false);
    setComments([]);
    setCommentsLoaded(false);
    Promise.all([getChapter(cId, chId), getChapters(cId)])
      .then(([chRes, chsRes]) => { setChapter(chRes.data); setChapters(chsRes.data); })
      .finally(() => setLoading(false));
  }, [cId, chId]);

  useEffect(() => {
    if (!user) return;
    getLikeStatus(cId, { chapterId: chId }).then((res) => {
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    });
  }, [cId, chId, user]);

  // Завантажуємо коментарі при першому відкритті секції
  useEffect(() => {
    if (!showComments || commentsLoaded) return;
    getComments(cId, { chapterId: chId }).then((res) => {
      setComments(res.data.data ?? []);
      setCommentsLoaded(true);
    });
  }, [showComments, commentsLoaded, cId, chId]);

  const goToPrev = useCallback(() => {
    if (currentPage > 0) { setCurrentPage((p) => p - 1); window.scrollTo(0, 0); }
  }, [currentPage]);

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
    if (!user) { navigate('/login'); return; }
    const res = await toggleLike(cId, { chapterId: chId });
    setLiked(res.data.liked);
    setLikeCount((c) => (res.data.liked ? c + 1 : c - 1));
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!chapter) return <p className="text-center py-12 text-gray-500">Главу не знайдено</p>;

  const totalPages = chapter.pages.length;
  const page       = chapter.pages[currentPage];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <Link to={`/comics/${cId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors shrink-0">
          <ChevronLeft /> До коміксу
        </Link>
        <div className="flex items-center gap-2">
          {prevChapter && (
            <button onClick={() => navigate(`/reader/${cId}/${prevChapter.id}`)} className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronLeft /> Попередня
            </button>
          )}
          <select
            value={chId}
            onChange={(e) => navigate(`/reader/${cId}/${e.target.value}`)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-300"
          >
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                Глава {ch.number}{ch.title ? ` – ${ch.title}` : ''}
              </option>
            ))}
          </select>
          {nextChapter && (
            <button onClick={() => navigate(`/reader/${cId}/${nextChapter.id}`)} className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Наступна <ChevronRight />
            </button>
          )}
        </div>
      </div>

      {totalPages > 0 ? (
        <>
          <div className="relative bg-black rounded-xl overflow-hidden select-none">
            <img
              key={page?.url}
              src={page?.url}
              alt={`Сторінка ${currentPage + 1}`}
              className="w-full object-contain max-h-[82vh]"
              draggable={false}
            />
            <button onClick={goToPrev} disabled={currentPage === 0} className="absolute left-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default" />
            <button onClick={goToNext} disabled={currentPage === totalPages - 1} className="absolute right-0 top-0 h-full w-1/3 cursor-pointer disabled:cursor-default" />
          </div>

          <div className="flex items-center justify-between mt-4 gap-3">
            <button onClick={goToPrev} disabled={currentPage === 0} className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronLeft /> Назад
            </button>

            <div className="flex items-center gap-2">
              {/* Select показує "1/10" поки закритий, "Сторінка 1" — у списку */}
              <select
                value={currentPage}
                onChange={(e) => { setCurrentPage(parseInt(e.target.value)); window.scrollTo(0, 0); }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-300"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i} value={i}>Сторінка {i + 1}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500 shrink-0 tabular-nums">
                {currentPage + 1}/{totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${liked ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <HeartIcon filled={liked} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button
                onClick={() => setShowComments((s) => !s)}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${showComments ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <MessageIcon /> Коментарі
              </button>
            </div>

            <button onClick={goToNext} disabled={currentPage === totalPages - 1} className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Далі <ChevronRight />
            </button>
          </div>

          <p className="text-xs text-center text-gray-400 mt-2">Навігація: стрілки ← → на клавіатурі або клік по краях зображення</p>
        </>
      ) : (
        <p className="text-center py-12 text-gray-500">Сторінок у главі немає</p>
      )}

      {showComments && (
        <div className="mt-8">
          {commentsLoaded ? (
            <CommentSection
              comicId={cId}
              chapterId={chId}
              initialComments={comments}
              user={user}
            />
          ) : (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}