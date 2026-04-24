import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore.jsx';
import { getMyProfile, updateMyProfile, getActivityStats } from '../api/user.api.js';
import { getCollections, deleteCollection, setComicCollection, createCollection } from '../api/collection.api.js';
import { getMyComics, getComicStats, deleteComic } from '../api/comic.api.js';
import { plural } from '../components/CommentSection.jsx';

const STATUS_LABELS = { ONGOING: 'Виходить', COMPLETED: 'Завершено', HIATUS: 'Призупинено' };
const TYPE_ORDER    = { READING: 0, COMPLETED: 1, PLANNED: 2, FAVOURITE: 3, CUSTOM: 4 };

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

// Модальне вікно підтвердження
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Скасувати
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, signin } = useAuth();
  const location = useLocation();
  const avatarRef = useRef(null);

  // Відновлення вкладки – лише якщо прийшли через navigate(-1) (кнопка "назад")
  const isBack = location.state?.fromProfile;
  const [activeTab, setActiveTab]     = useState(isBack ? (sessionStorage.getItem('profile_tab') || 'activity') : 'activity');
  const [activeColId, setActiveColId] = useState(null);

  const [profile, setProfile]             = useState(null);
  const [collections, setCollections]     = useState([]);
  const [myComics, setMyComics]           = useState([]);
  const [activityStats, setActivityStats] = useState(null);
  const [colSearch, setColSearch]         = useState('');
  const [workSearch, setWorkSearch]       = useState('');
  const [newColName, setNewColName]       = useState('');
  const [creatingCol, setCreatingCol]     = useState(false);
  const [editing, setEditing]             = useState(false);
  const [form, setForm]                   = useState({ username: '', bio: '' });
  const [saving, setSaving]               = useState(false);
  const [statsMap, setStatsMap]           = useState({});
  const [confirmModal, setConfirmModal]   = useState(null); // { message, onConfirm }

  function switchTab(key) {
    setActiveTab(key);
    sessionStorage.setItem('profile_tab', key);
  }

  const refreshActivity = useCallback(() => {
    getActivityStats().then((res) => setActivityStats(res.data));
  }, []);

  useEffect(() => {
    getMyProfile().then((res) => { setProfile(res.data); setForm({ username: res.data.username, bio: res.data.bio ?? '' }); });
    refreshActivity();
    getCollections().then((res) => {
      setCollections(res.data);
      // За замовчуванням – перша колекція
      const saved = isBack ? sessionStorage.getItem('profile_col') : null;
      const first = res.data[0];
      if (saved) {
        const id = parseInt(saved);
        setActiveColId(res.data.find((c) => c.id === id) ? id : first?.id ?? null);
      } else if (first) {
        setActiveColId(first.id);
      }
    });
  }, []);

  useEffect(() => {
    if (user?.role !== 'AUTHOR' && user?.role !== 'TRANSLATOR') return;
    getMyComics().then((res) => setMyComics(res.data));
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'stats' || myComics.length === 0) return;
    myComics.forEach((comic) => {
      if (statsMap[comic.id]) return;
      getComicStats(comic.id).then((res) => setStatsMap((prev) => ({ ...prev, [comic.id]: res.data })));
    });
  }, [activeTab, myComics]);

  function switchCol(id) {
    setActiveColId(id);
    sessionStorage.setItem('profile_col', String(id));
  }

  function confirm(message, onConfirm) {
    setConfirmModal({ message, onConfirm });
  }

  async function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.append('username', form.username);
    formData.append('bio', form.bio);
    if (avatarRef.current?.files[0]) formData.append('cover', avatarRef.current.files[0]);
    const res = await updateMyProfile(formData);
    setProfile(res.data);
    signin(localStorage.getItem('token'), res.data);
    setEditing(false);
    setSaving(false);
  }

  async function handleDeleteCollection(colId) {
    confirm('Видалити колекцію? Усі комікси будуть видалені з неї.', async () => {
      setConfirmModal(null);
      await deleteCollection(colId);
      setCollections((prev) => {
        const next = prev.filter((c) => c.id !== colId);
        if (activeColId === colId) switchCol(next[0]?.id ?? null);
        return next;
      });
    });
  }

  async function handleRemoveComic(comicId) {
    await setComicCollection(comicId, null);
    setCollections((prev) => prev.map((col) => ({
      ...col,
      items: col.items.filter((item) => item.comic.id !== comicId),
    })));
    refreshActivity();
  }

  async function handleDeleteComic(comicId) {
    confirm('Видалити комікс? Усі глави та коментарі також будуть видалені. Цю дію неможливо скасувати.', async () => {
      setConfirmModal(null);
      await deleteComic(comicId);
      setMyComics((prev) => prev.filter((c) => c.id !== comicId));
      setStatsMap((prev) => { const n = { ...prev }; delete n[comicId]; return n; });
      refreshActivity();
    });
  }

  async function handleCreateCollection(e) {
    e.preventDefault();
    if (!newColName.trim()) return;
    setCreatingCol(true);
    const res = await createCollection(newColName.trim());
    setCollections((prev) => [...prev, { ...res.data, items: [] }]);
    switchCol(res.data.id);
    setNewColName('');
    setCreatingCol(false);
  }

  const isCreator = user?.role === 'AUTHOR' || user?.role === 'TRANSLATOR';

  const tabs = [
    { key: 'activity',    label: 'Активність' },
    { key: 'collections', label: 'Колекції' },
    ...(isCreator ? [{ key: 'mycomics', label: 'Мої роботи' }, { key: 'stats', label: 'Статистика' }] : []),
  ];

  const sortedCols = [...collections].sort((a, b) => (TYPE_ORDER[a.type] ?? 5) - (TYPE_ORDER[b.type] ?? 5));
  const activeCol  = collections.find((c) => c.id === activeColId);
  const filteredItems = (activeCol?.items ?? []).filter((item) =>
    !colSearch || item.comic.title.toLowerCase().includes(colSearch.toLowerCase()),
  );
  const filteredComics = myComics.filter((c) =>
    !workSearch || c.title.toLowerCase().includes(workSearch.toLowerCase()),
  );
  const roleLabel = profile?.role === 'AUTHOR' ? 'Автор' : profile?.role === 'TRANSLATOR' ? 'Перекладач' : 'Читач';

  if (!profile) return (
    <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
      <div className="h-20 bg-gray-200 rounded-xl" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Profile card */}
      <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="Username" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300" />
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Розкажіть про себе..." rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-300" />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Аватар</label>
                <input type="file" accept=".jpg,.jpeg,.png" ref={avatarRef} className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 file:cursor-pointer hover:file:bg-indigo-100" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !form.username.trim()} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors">Зберегти</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">Скасувати</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{roleLabel}</span>
              </div>
              <p className="text-sm text-gray-500">{profile.email}</p>
              {profile.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}
              <button onClick={() => setEditing(true)} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors">
                Редагувати профіль
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Вподобань поставлено', value: activityStats?.likesGiven  ?? '–', color: 'text-rose-600' },
            { label: 'Закладок додано',      value: activityStats?.bookmarks   ?? '–', color: 'text-indigo-600' },
            { label: 'Коментарів залишено',  value: activityStats?.commentsLeft ?? '–', color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="p-5 border border-gray-100 rounded-2xl text-center bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Collections */}
      {activeTab === 'collections' && (
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-44 shrink-0 space-y-0.5">
            {sortedCols.map((col) => (
              <div key={col.id} className="group flex items-center gap-1">
                <button
                  onClick={() => switchCol(col.id)}
                  className={`flex-1 text-left text-sm px-3 py-2 rounded-lg truncate transition-colors ${activeColId === col.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {col.name}
                  <span className="ml-1 text-xs opacity-60">({col.items?.length ?? 0})</span>
                </button>
                {col.type === 'CUSTOM' && (
                  <button onClick={() => handleDeleteCollection(col.id)} className="hidden group-hover:flex text-xs text-red-400 hover:text-red-600 px-1 shrink-0 transition-colors" title="Видалити">✕</button>
                )}
              </div>
            ))}

            {/* Створення нової колекції */}
            <form onSubmit={handleCreateCollection} className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
              <input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="Нова..."
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-300 min-w-0"
              />
              <button type="submit" disabled={creatingCol || !newColName.trim()} className="flex items-center justify-center w-7 h-7 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors shrink-0">
                <PlusIcon />
              </button>
            </form>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <input value={colSearch} onChange={(e) => setColSearch(e.target.value)} placeholder="Пошук у колекції..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-indigo-300 transition-colors" />
            {filteredItems.length === 0 ? (
              <p className="text-sm text-gray-500">{colSearch ? 'Нічого не знайдено' : 'Колекція порожня'}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredItems.map(({ comic }) => (
                  <div key={comic.id} className="group">
                    <Link to={`/comics/${comic.id}`} className="block">
                      <div className="relative bg-gray-100 rounded-xl aspect-[2/3] overflow-hidden">
                        {comic.coverUrl ? (
                          <>
                            <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Немає обкладинки</div>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{comic.title}</p>
                    </Link>
                    <button onClick={() => handleRemoveComic(comic.id)} className="mt-0.5 text-xs text-red-400 hover:text-red-600 transition-colors">Видалити</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My works */}
      {activeTab === 'mycomics' && (
        <div>
          <div className="flex justify-between items-center mb-4 gap-3">
            <input value={workSearch} onChange={(e) => setWorkSearch(e.target.value)} placeholder="Пошук по роботах..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300 transition-colors" />
            <Link to="/upload" className="flex items-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
              <PlusIcon /> Додати
            </Link>
          </div>
          {filteredComics.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{workSearch ? 'Нічого не знайдено' : 'Ви ще не опублікували жодного коміксу'}</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {filteredComics.map((comic) => (
                <div key={comic.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Link to={`/comics/${comic.id}`} className="w-10 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 block">
                    {comic.coverUrl && <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/comics/${comic.id}`} className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600 transition-colors block">{comic.title}</Link>
                    <p className="text-xs text-gray-500">{STATUS_LABELS[comic.status]} · {plural(comic.chaptersCount ?? 0, 'глава', 'глави', 'глав')}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Link to={`/upload/${comic.id}`} className="text-xs text-gray-500 hover:text-indigo-600 transition-colors">Редагувати</Link>
                    <button onClick={() => handleDeleteComic(comic.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Видалити</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <input value={workSearch} onChange={(e) => setWorkSearch(e.target.value)} placeholder="Пошук по роботах..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-300 transition-colors" />
          {filteredComics.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{workSearch ? 'Нічого не знайдено' : 'Немає коміксів'}</p>
          ) : filteredComics.map((comic) => {
            const stats = statsMap[comic.id];
            return (
              <div key={comic.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                <Link to={`/comics/${comic.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors mb-3 block">{comic.title}</Link>
                {stats ? (
                  <div className="flex gap-6 flex-wrap">
                    {[
                      { label: 'Переглядів', value: stats.viewsCount,    color: 'text-blue-600' },
                      { label: 'Вподобань',  value: stats.likesCount,    color: 'text-rose-600' },
                      { label: 'Коментарів', value: stats.commentsCount, color: 'text-emerald-600' },
                      { label: 'Закладок',   value: stats.bookmarksCount, color: 'text-indigo-600' },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6">{[0,1,2,3].map((i) => (<div key={i} className="text-center"><div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1" /><div className="h-3 w-14 bg-gray-100 rounded animate-pulse" /></div>))}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}