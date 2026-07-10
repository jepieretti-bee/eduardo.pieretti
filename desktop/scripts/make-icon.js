// Gera build/icon.png (1024x1024) e build/icon.ico (multi-resolução, exigido pelo NSIS)
// a partir de formas simples (paleta vinho/carmesim do app), já que não há
// ferramenta de conversão de imagem disponível neste ambiente.
const fs = require('node:fs');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const PImage = require('pureimage');
const pngToIco = require('png-to-ico').default;

const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });

// Tamanhos padrão de um .ico do Windows (o NSIS rejeita ícones fora desse conjunto).
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const PNG_SIZE = 1024;

async function renderIcon(size) {
  const img = PImage.make(size, size);
  const ctx = img.getContext('2d');

  ctx.fillStyle = '#7f0101';
  roundRect(ctx, 0, 0, size, size, size * 0.185);
  ctx.fill();

  const cx = size / 2, cy = size / 2, r = size * 0.32, ring = size * 0.055;
  ctx.fillStyle = '#ffffff';
  fillCircle(ctx, cx, cy, r);
  ctx.fillStyle = '#7f0101';
  fillCircle(ctx, cx, cy, r - ring);

  ctx.fillStyle = '#ffffff';
  drawBar(ctx, cx, cy, size * 0.045, r * 0.6, -Math.PI / 2);
  drawBar(ctx, cx, cy, size * 0.038, r * 0.46, Math.atan2(0.2, 0.42));

  ctx.fillStyle = '#ffffff';
  fillCircle(ctx, cx, cy, size * 0.028);

  return img;
}

async function toPngBuffer(img) {
  const chunks = [];
  const stream = new PassThrough();
  stream.on('data', (c) => chunks.push(c));
  await PImage.encodePNGToStream(img, stream);
  return Buffer.concat(chunks);
}

async function main() {
  const bigIcon = await renderIcon(PNG_SIZE);
  const pngPath = path.join(outDir, 'icon.png');
  await PImage.encodePNGToStream(bigIcon, fs.createWriteStream(pngPath));

  const buffers = [];
  for (const size of ICO_SIZES) {
    const img = await renderIcon(size);
    buffers.push(await toPngBuffer(img));
  }
  const icoBuf = await pngToIco(buffers);
  fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuf);

  console.log('> Ícones gerados em desktop/build/ (icon.png, icon.ico)');
}

// Desenha um retângulo saindo de (cx,cy) na direção `angle` (rad, a partir do eixo +x), comprimento `len`.
function drawBar(ctx, cx, cy, width, len, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillRect(0, -width / 2, len, width);
  ctx.restore();
}

function fillCircle(ctx, cx, cy, r, segments = 64) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
