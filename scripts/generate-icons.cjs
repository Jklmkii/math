const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      show: false,
      width: 400,
      height: 400,
      webPreferences: {
        offscreen: true,
      },
    });

    const imgPath = path.join(__dirname, '../build/quantora-logo.jpg');
    const imgBase64 = fs.readFileSync(imgPath).toString('base64');
    const dataUri = `data:image/jpeg;base64,${imgBase64}`;

    const sizes = [16, 32, 48, 72, 96, 144, 192, 256, 512];

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0f172a;">
          ${sizes.map((s) => `<canvas id="c${s}" width="${s}" height="${s}"></canvas>`).join('\n')}
          <script>
            const img = new Image();
            img.onload = () => {
              window.renderedPngs = {};
              // Crop the emblem centered without text
              const sx = 140;
              const sy = 60;
              const sW = 744;
              const sH = 744;

              [16, 32, 48, 72, 96, 144, 192, 256, 512].forEach(size => {
                const canvas = document.getElementById('c' + size);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Background matching dark slate #0f172a
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, size, size);

                // Draw centered crystal-Q emblem
                ctx.drawImage(img, sx, sy, sW, sH, 0, 0, size, size);
                window.renderedPngs[size] = canvas.toDataURL('image/png');
              });
            };
            img.src = "${dataUri}";
          </script>
        </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    let renderedPngs = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      renderedPngs = await win.webContents.executeJavaScript('window.renderedPngs');
      if (renderedPngs && sizes.every((s) => renderedPngs[s])) break;
    }

    if (!renderedPngs) {
      throw new Error('Tempo esgotado para renderizar os tamanhos no canvas.');
    }

    const buildDir = path.join(__dirname, '../build');
    const publicDir = path.join(__dirname, '../public');
    const assetsSourceDir = path.join(__dirname, '../assets-source');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    if (!fs.existsSync(assetsSourceDir)) {
      fs.mkdirSync(assetsSourceDir, { recursive: true });
    }

    // Save build/icon.png (256x256)
    const b64_256 = renderedPngs[256].replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(buildDir, 'icon.png'), Buffer.from(b64_256, 'base64'));

    // Save assets-source/icon-192.png and assets-source/icon-512.png
    if (renderedPngs[192]) {
      fs.writeFileSync(path.join(assetsSourceDir, 'icon-192.png'), Buffer.from(renderedPngs[192].replace(/^data:image\/png;base64,/, ''), 'base64'));
    }
    if (renderedPngs[512]) {
      fs.writeFileSync(path.join(assetsSourceDir, 'icon-512.png'), Buffer.from(renderedPngs[512].replace(/^data:image\/png;base64,/, ''), 'base64'));
    }

    // Update public/favicon.svg with embedded crisp emblem
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <image href="${renderedPngs[256]}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

    // Multi-res .ico
    const pngFilePaths = [];
    for (const size of [16, 32, 48, 256]) {
      const dataUrl = renderedPngs[size];
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const pngBuffer = Buffer.from(base64Data, 'base64');
      const targetPath = path.join(buildDir, `tmp_icon_${size}.png`);
      fs.writeFileSync(targetPath, pngBuffer);
      pngFilePaths.push(targetPath);
    }

    const { default: pngToIco } = await import('png-to-ico');
    const icoBuf = await pngToIco(pngFilePaths);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

    for (const p of pngFilePaths) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    // Android mipmap icons
    const androidRes = path.join(__dirname, '../android/app/src/main/res');
    const mipmapMap = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192
    };

    if (fs.existsSync(androidRes)) {
      for (const [folder, sz] of Object.entries(mipmapMap)) {
        const targetFolder = path.join(androidRes, folder);
        if (fs.existsSync(targetFolder)) {
          const buf = Buffer.from(renderedPngs[sz].replace(/^data:image\/png;base64,/, ''), 'base64');
          fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), buf);
          fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), buf);
          fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), buf);
        }
      }
      console.log('Ícones do Android (mipmaps) atualizados com sucesso!');
    }

    console.log('Sucesso: build/icon.ico, build/icon.png, favicon.svg e mipmaps do Android gerados com a nova identidade Quantora!');
  } catch (err) {
    console.error('Erro ao gerar ícones:', err);
    process.exit(1);
  } finally {
    app.quit();
  }
});
