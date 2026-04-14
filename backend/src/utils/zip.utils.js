import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export function extractChapterZip(zipPath, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const imageEntries = entries
    .filter(entry => {
      if (entry.isDirectory) return false;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
      if (entry.name.startsWith('__MACOSX') || entry.name.startsWith('.')) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (imageEntries.length === 0) {
    throw new Error('Archive contains no valid images (.jpg or .png)');
  }

  const pages = [];

  imageEntries.forEach((entry, index) => {
    const ext = path.extname(entry.name);
    const fileName = `page-${String(index + 1).padStart(3, '0')}${ext}`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, entry.getData());

    pages.push({
      url: filePath.replace(/\\/g, '/'),
      order: index + 1,
    });
  });

  fs.unlinkSync(zipPath);

  return pages;
}
