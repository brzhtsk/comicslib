import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/authStore.jsx';
import { getMyProfile, updateMyProfile } from '../api/user.api.js';
import { getCollections } from '../api/collection.api.js';
import { getMyComics, getComicStats } from '../api/comic.api.js';

const COLLECTION_LABELS = {
  READING: 'Читаю',
  COMPLETED: 'Прочитано',
  PLANNED: 'В планах',
  FAVOURITE: 'Улюблене',
};

const STATUS_LABELS = {
  ONGOING: 'Виходить',
  COMPLETED: 'Завершено',
  HIATUS: 'Призупинено',
};

export default function ProfilePage() {
  const { user, signin } = useAuth();

  const [profile, setProfile] = useState(null);
  const [collections, setCollections] = useState([]);
  const [myComics, setMyComics] = useState([]);
  const [activeTab, setActiveTab] = useState('collections');
  const [activeCollection, setActiveCollection] = useState('READING');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [statsMap, setStatsMap] = useState({});

  useEffect(() => {
    getMyProfile().then((res) => {
      setProfile(res.data);
      setForm({ username: res.data.username, bio: res.data.bio ?? '' });
    });
    getCollections().then((res) => setCollections(res.data));
  }, []);

  useEffect(() => {
    if (user?.role !== 'AUTHOR') return;
    getMyComics().then((res) => {
      setMyComics(res.data);
    });
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'stats' || myComics.length === 0) return;
    myComics.forEach((comic) => {
      if (statsMap[comic.id]) return;
      getComicStats(comic.id).then((res) => {
        setStatsMap((prev) => ({ ...prev, [comic.id]: res.data }));
      });
    });
  }, [activeTab, myComics]);

  async function handleSave() {
    setSaving(true);
    const res = await updateMyProfile({ username: form.username, bio: form.bio });
    setProfile(res.data);
    signin(localStorage.getItem('token'), res.data);
    setEditing(false);
    setSaving(false);
  }

  const activeItems = collections
    .find((c) => c.status === activeCollection)
    ?.items ?? [];

  if (!profile) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
        <div className="h-20 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  const tabs = [
    { key: 'collections', label: 'Колекції' },
    ...(user?.role === 'AUTHOR' ? [
      { key: 'mycomics', label: 'Мої роботи' },
      { key: 'stats', label: 'Статистика' },
    ] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-6 p-6 bg-white rounded-xl border border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 shrink-0">
          {profile.username[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Username"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Розкажіть про себе..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.username.trim()}
                  className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700"
                >
                  Зберегти
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
                >
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {profile.role === 'AUTHOR' ? 'Автор' : 'Читач'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{profile.email}</p>
              {profile.bio && (
                <p className="text-sm text-gray-700 mt-2">{profile.bio}</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
              >
                Редагувати профіль
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'collections' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {Object.entries(COLLECTION_LABELS).map(([key, label]) => {
              const count = collections.find((c) => c.status === key)?.items.length ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCollection(key)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    activeCollection === key
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {activeItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Колекція порожня</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeItems.map(({ comic }) => (
                <Link key={comic.id} to={`/comics/${comic.id}`} className="group block">
                  <div className="bg-gray-100 rounded-lg aspect-[2/3] overflow-hidden">
                    {comic.coverUrl ? (
                      <img
                        src={comic.coverUrl}
                        alt={comic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Немає обкладинки
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {comic.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mycomics' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{myComics.length} коміксів</p>
            <Link
              to="/upload"
              className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
            >
              + Додати комікс
            </Link>
          </div>

          {myComics.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Ви ще не опублікували жодного коміксу</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {myComics.map((comic) => (
                <div key={comic.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                    {comic.coverUrl && (
                      <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{comic.title}</p>
                    <p className="text-xs text-gray-500">
                      {STATUS_LABELS[comic.status]} · {comic.chaptersCount ?? 0} глав
                    </p>
                  </div>
                  <Link
                    to={`/upload/${comic.id}`}
                    className="text-xs text-gray-500 hover:text-gray-900 shrink-0"
                  >
                    Редагувати
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          {myComics.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Немає коміксів для відображення статистики</p>
          ) : (
            myComics.map((comic) => {
              const stats = statsMap[comic.id];
              return (
                <div key={comic.id} className="p-4 border border-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-3">{comic.title}</p>
                  {stats ? (
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.viewsCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Переглядів</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.likesCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Лайків</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.commentsCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Коментарів</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-6">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="text-center">
                          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                          <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}