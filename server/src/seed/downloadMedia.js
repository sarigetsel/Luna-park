const fs = require('fs');
const path = require('path');
const https = require('https');
const { uploadDir } = require('../config/env');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const options = {
      headers: { 'User-Agent': 'Luna-park-seed/1.0' },
    };
    https
      .get(url, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`Download failed: ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(destPath)));
      })
      .on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

async function downloadImage(url, filename, force = false) {
  const imagesDir = path.join(uploadDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const dest = path.join(imagesDir, filename);
  if (fs.existsSync(dest) && !force) {
    return `/uploads/images/${filename}`;
  }
  await downloadFile(url, dest);
  return `/uploads/images/${filename}`;
}

module.exports = { downloadImage };
