import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ComicPage from './pages/ComicPage.jsx';
import ReaderPage from './pages/ReaderPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'comics/:id', element: <ComicPage /> },
      {
        path: 'reader/:comicId/:chapterId',
        element: <PrivateRoute><ReaderPage /></PrivateRoute>,
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'profile',
        element: <PrivateRoute><ProfilePage /></PrivateRoute>,
      },
      {
        path: 'upload',
        element: <PrivateRoute roles={['AUTHOR']}><UploadPage /></PrivateRoute>,
      },
      {
        path: 'upload/:id',
        element: <PrivateRoute roles={['AUTHOR']}><UploadPage /></PrivateRoute>,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;