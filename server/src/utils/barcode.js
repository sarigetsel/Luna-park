const bwipjs = require('bwip-js');

async function generateBarcodePng(text) {
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
  });
}

module.exports = { generateBarcodePng };
