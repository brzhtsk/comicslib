import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createComic, updateComic, getComic } from '../api/comic.api.js';
import { getGenres } from '../api/genre.api.js';
import { getChapters, createChapter, deleteChapter } from '../api/chapter.api.js';

const STATUSES = [
  { value: 'ONGOING', label: 'Виходить' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'HIATUS', label: 'Призупинено' },
];

export default function UploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const coverRef = useRef(null);
  const chapterRef = useRef(null);

  const [genres, setGenres] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [chapterUploading, setChapterUploading] = useState(false);
  const [chapterError, setChapterError] = useState(null);
  const [newChapter, setNewChapter] = useState({ number: '', title: '' });

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'ONGOING',
    genreIds: [],
  });

  useEffect(() => {
    getGenres().then((res) => setGenres(res.data));

    if (isEdit) {
      getComic(parseInt(id)).then((res) => {
        const c = res.data;
        setForm({
          title: c.title,
          description: c.description ?? '',
          status: c.status,
          genreIds: c.genres?.map((g) => g.id) ?? [],
        });
      });
      getChapters(parseInt(id)).then((res) => setChapters(res.data));
    }
  }, [id, isEdit]);

  function toggleGenre(genreId) {
    setForm((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((g) => g !== genreId)
        : [...prev.genreIds, genreId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('status', form.status);
      data.append('genreIds', JSON.stringify(form.genreIds));

      if (coverRef.current?.files[0]) {
        data.append('cover', coverRef.current.files[0]);
      }

      if (isEdit) {
        await updateComic(parseInt(id), data);
        setError(null);
      } else {
        const res = await createComic(data);
        navigate(`/upload/${res.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddChapter(e) {
    e.preventDefault();
    setChapterError(null);

    if (!newChapter.number) {
      setChapterError('Вкажіть номер глави');
      return;
    }
    if (!chapterRef.current?.files[0]) {
      setChapterError('Виберіть zip-архів зі сторінками');
      return;
    }

    setChapterUploading(true);

    try {
      const data = new FormData();
      data.append('number', newChapter.number);
      if (newChapter.title) data.append('title', newChapter.title);
      data.append('chapter', chapterRef.current.files[0]);

      const res = await createChapter(parseInt(id), data);
      setChapters((prev) => [...prev, res.data].sort((a, b) => a.number - b.number));
      setNewChapter({ number: '', title: '' });
      chapterRef.current.value = '';
    } catch (err) {
      setChapterError(err.response?.data?.message ?? 'Помилка завантаження глави');
    } finally {
      setChapterUploading(false);
    }
  }

  async function handleDeleteChapter(chapterId) {
    if (!window.confirm('Видалити главу?')) return;
    await deleteChapter(parseInt(id), chapterId);
    setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Редагування коміксу' : 'Новий комікс'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Назва <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder="Назва коміксу"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Короткий опис коміксу..."
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setForm((f) => ({ ...f, status: s.value }))}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  form.status === s.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Жанри</label>
          <div className="flex gap-2 flex-wrap">
            {genres.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  form.genreIds.includes(g.id)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Обкладинка {isEdit && <span className="text-gray-400 font-normal">(залиш порожнім щоб не змінювати)</span>}
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            ref={coverRef}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 file:cursor-pointer hover:file:bg-gray-200"
          />
          <p className="text-xs text-gray-400 mt-1">JPG або PNG, мін. 600×900 пікс.</p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700"
        >
          {saving ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Створити комікс'}
        </button>
      </form>

      {isEdit && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Глави</h2>

          {chapters.length > 0 && (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden mb-4">
              {chapters.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-900">
                    Глава {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {ch.pagesCount ?? 0} стор.
                    </span>
                    <button
                      onClick={() => handleDeleteChapter(ch.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddChapter} className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900">Додати главу</h3>

            <div className="flex gap-3">
              <input
                type="number"
                value={newChapter.number}
                onChange={(e) => setNewChapter((c) => ({ ...c, number: e.target.value }))}
                placeholder="Номер *"
                min="0"
                step="0.5"
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
              <input
                value={newChapter.title}
                onChange={(e) => setNewChapter((c) => ({ ...c, title: e.target.value }))}
                placeholder="Назва глави (необов'язково)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <input
                type="file"
                accept=".zip"
                ref={chapterRef}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 file:cursor-pointer hover:file:bg-gray-200"
              />
              <p className="text-xs text-gray-400 mt-1">
                ZIP-архів зі сторінками: 001.jpg, 002.jpg, ...
              </p>
            </div>

            {chapterError && (
              <p className="text-sm text-red-500">{chapterError}</p>
            )}

            <button
              type="submit"
              disabled={chapterUploading}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700"
            >
              {chapterUploading ? 'Завантаження...' : 'Завантажити главу'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}