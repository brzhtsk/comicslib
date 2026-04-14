import { useState, useEffect } from 'react';
import { getComics } from '../api/comic.api.js';
import { getGenres } from '../api/genre.api.js';
import ComicCard from '../components/ComicCard.jsx';
import Filter from '../components/Filter.jsx';
import Sorter from '../components/Sorter.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function CatalogPage() {
  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [params, setParams] = useState({
    page: 1,
    size: 12,
    sortBy: 'createdAt',
    order: 'desc',
    genre: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    getGenres()
      .then((res) => setGenres(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== ''),
    );

    getComics(clean)
      .then((res) => {
        setComics(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError('Не вдалось завантажити каталог'))
      .finally(() => setLoading(false));
  }, [params]);

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  return (
    <div className="flex gap-8">
      <aside className="w-56 shrink-0">
        <Filter
          genres={genres}
          selected={params.genre}
          status={params.status}
          onGenreChange={(v) => setParam('genre', v)}
          onStatusChange={(v) => setParam('status', v)}
        />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={params.search}
              onChange={(v) => setParam('search', v)}
            />
          </div>
          <Sorter
            sortBy={params.sortBy}
            order={params.order}
            onSortByChange={(v) => setParam('sortBy', v)}
            onOrderChange={(v) => setParam('order', v)}
          />
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg aspect-[2/3] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-center text-red-500 py-12">{error}</p>
        )}

        {!loading && !error && comics.length === 0 && (
          <p className="text-center text-gray-500 py-12">Коміксів не знайдено</p>
        )}

        {!loading && !error && comics.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {comics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  disabled={!meta.hasPrev}
                  onClick={() => setParam('page', params.page - 1)}
                  className="px-4 py-2 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  ← Назад
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {params.page} / {meta.totalPages}
                </span>
                <button
                  disabled={!meta.hasNext}
                  onClick={() => setParam('page', params.page + 1)}
                  className="px-4 py-2 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  Далі →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}