import multer from 'multer';
import path from 'path';
import fs from 'fs';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir('uploads/covers'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cover-${Date.now()}${ext}`);
  },
});

const chapterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ensureDir('uploads/tmp'));
  },
  filename: (_req, file, cb) => {
    cb(null, `chapter-${Date.now()}.zip`);
  },
});

function imageFilter(_req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg and .png files are allowed'));
  }
}

function zipFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.zip') {
    cb(null, true);
  } else {
    cb(new Error('Chapter must be a .zip file'));
  }
}

export const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('cover');

export const uploadChapter = multer({
  storage: chapterStorage,
  fileFilter: zipFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('chapter');
