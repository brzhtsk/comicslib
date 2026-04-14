import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from '../middleware/error.js';
import authRoutes from '../routes/auth.routes.js';
import userRoutes from '../routes/user.routes.js';
import comicRoutes from '../routes/comic.routes.js';
import genreRoutes from '../routes/genre.routes.js';
import chapterRoutes from '../routes/chapter.routes.js';
import collectionRoutes from '../routes/collection.routes.js';
import commentRoutes from '../routes/comment.routes.js';
import likeRoutes from '../routes/like.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, '../../', process.env.UPLOADS_DIR || 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comics', comicRoutes);
app.use('/api/comics/:comicId/chapters', chapterRoutes);
app.use('/api/comics/:comicId/comments', commentRoutes);
app.use('/api/comics/:comicId/likes', likeRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/genres', genreRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;
