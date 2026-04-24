import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComment, deleteComment, toggleCommentLike } from '../api/comment.api.js';

const MAX_DEPTH = 2; // 0, 1, 2 — три рівні (кореневий + 2 рівні відповідей)

function updateLikeInTree(comments, commentId, liked, likesCount) {
  return comments.map((c) => {
    if (c.id === commentId) return { ...c, userLiked: liked, likesCount };
    if (c.replies?.length)  return { ...c, replies: updateLikeInTree(c.replies, commentId, liked, likesCount) };
    return c;
  });
}

function insertReplyInTree(comments, parentId, reply) {
  return comments.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length)  return { ...c, replies: insertReplyInTree(c.replies, parentId, reply) };
    return c;
  });
}

function removeFromTree(comments, commentId) {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({ ...c, replies: removeFromTree(c.replies ?? [], commentId) }));
}

export function countAll(list) {
  return list.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function CommentItem({ comment, comicId, user, onReply, onDelete, onLike }) {
  // depth приходить з сервера; для нових коментарів встановлюється вручну при insert
  const depth    = comment.depth ?? 0;
  const canReply = depth < MAX_DEPTH;

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 shrink-0">
        {comment.user.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{comment.user.username}</span>
          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('uk-UA')}</span>
          {user?.id === comment.user.id && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-red-400 hover:text-red-600 ml-auto transition-colors">
              Видалити
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${comment.userLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
          >
            <HeartIcon filled={comment.userLiked} />
            {(comment.likesCount ?? 0) > 0 && <span>{comment.likesCount}</span>}
          </button>
          {/* Кнопка відповіді — лише якщо глибина менше MAX_DEPTH */}
          {canReply && user && (
            <button onClick={() => onReply(comment)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
              Відповісти
            </button>
          )}
        </div>
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-indigo-50">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                comicId={comicId}
                user={user}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ comicId, chapterId = null, initialComments = [], user }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState(initialComments);
  const [text, setText]         = useState('');
  const [replyTo, setReplyTo]   = useState(null);
  const [loading, setLoading]   = useState(false);

  // Синхронізуємо коли initialComments оновлюються ззовні (рідер підвантажує lazy)
  const [initialized, setInitialized] = useState(false);
  if (!initialized && initialComments.length > 0) {
    setComments(initialComments);
    setInitialized(true);
  }

  const total = countAll(comments);

  const handleLike = useCallback(async (commentId) => {
    if (!user) { navigate('/login'); return; }
    const res = await toggleCommentLike(comicId, commentId);
    setComments((prev) => updateLikeInTree(prev, commentId, res.data.liked, res.data.likesCount));
  }, [user, comicId, navigate]);

  const handleDelete = useCallback(async (commentId) => {
    await deleteComment(comicId, commentId);
    setComments((prev) => removeFromTree(prev, commentId));
  }, [comicId]);

  // Обчислюємо depth для відповіді — depth батька + 1
  function getReplyDepth(parentComment) {
    return (parentComment?.depth ?? 0) + 1;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    // Перевірка глибини перед надсиланням
    if (replyTo && getReplyDepth(replyTo) > MAX_DEPTH) return;

    setLoading(true);
    try {
      const res = await createComment(comicId, {
        text:      text.trim(),
        chapterId: chapterId ?? undefined,
        parentId:  replyTo?.id ?? undefined,
      });

      // Встановлюємо depth для нового коментаря на клієнті
      const newComment = { ...res.data, depth: replyTo ? getReplyDepth(replyTo) : 0 };

      if (replyTo) {
        setComments((prev) => insertReplyInTree(prev, replyTo.id, newComment));
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setText('');
      setReplyTo(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Коментарі ({total})
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 bg-indigo-50 rounded-lg px-3 py-2">
              <span>Відповідь для <span className="font-medium text-indigo-700">{replyTo.user.username}</span></span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? 'Напишіть відповідь...' : 'Напишіть коментар...'}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              Надіслати
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">Коментарів ще немає. Будьте першим!</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              comicId={comicId}
              user={user}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Відмінювання українською
export function plural(n, one, few, many) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}