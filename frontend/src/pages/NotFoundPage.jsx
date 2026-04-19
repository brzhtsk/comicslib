import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Сторінку не знайдено</h1>
      <p className="text-sm text-gray-500 mb-6">
        Можливо, вона була видалена або ви перейшли за неправильним посиланням.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        На головну
      </Link>
    </div>
  );
}
