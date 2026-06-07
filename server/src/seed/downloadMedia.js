const fs = require('fs');
const path = require('path');
const https = require('https');
const { uploadDir } = require('../config/env');

const WIKIMEDIA_USER_AGENT =
  'LunaParkProject/1.0 (educational; https://github.com/avigailrapa/Luna-park)';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const requestUrl = new URL(url);
    const options = {
      hostname: requestUrl.hostname,
      path: `${requestUrl.pathname}${requestUrl.search}`,
      headers: {
        'User-Agent': WIKIMEDIA_USER_AGENT,
        Accept: 'image/*,*/*;q=0.8',
      },
    };

    https
      .get(options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          const nextUrl = response.headers.location.startsWith('http')
            ? response.headers.location
            : `https://${requestUrl.hostname}${response.headers.location}`;
          return downloadFile(nextUrl, destPath).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
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

async function downloadImage(url, filename) {
  const imagesDir = path.join(uploadDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const dest = path.join(imagesDir, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return `/uploads/images/${filename}`;
  }
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
  }
  try {
    await downloadFile(url, dest);
  } catch (err) {
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    throw err;
  }
  return `/uploads/images/${filename}`;
}

module.exports = { downloadImage };
