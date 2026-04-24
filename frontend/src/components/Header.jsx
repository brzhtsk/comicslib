import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore.jsx';

export default function Header() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  function handleSignout() {
    signout();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Comics
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Каталог
          </Link>

          {user ? (
            <>
              {user.role === 'AUTHOR' || user.role === 'TRANSLATOR' && (
                <Link to="/upload" className="text-sm text-gray-600 hover:text-gray-900">
                  Завантажити
                </Link>
              )}
              <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
                Профіль
              </Link>
              <button
                onClick={handleSignout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Увійти
              </Link>
              <Link
                to="/register"
                className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700"
              >
                Реєстрація
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}