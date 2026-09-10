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

    const svgPath = path.join(__dirname, '../public/favicon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const base64Svg = Buffer.from(svgContent).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

    const sizes = [16, 32, 48, 256];

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;">
          ${sizes.map((s) => `<canvas id="c${s}" width="${s}" height="${s}"></canvas>`).join('\n')}
          <script>
            const img = new Image();
            img.onload = () => {
              window.renderedPngs = {};
              [16, 32, 48, 256].forEach(size => {
                const canvas = document.getElementById('c' + size);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
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
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    const pngFilePaths = [];

    // Save individual PNGs for all 4 sizes
    for (const size of sizes) {
      const dataUrl = renderedPngs[size];
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const pngBuffer = Buffer.from(base64Data, 'base64');

      const targetPath = size === 256 ? path.join(buildDir, 'icon.png') : path.join(buildDir, `icon_${size}.png`);
      fs.writeFileSync(targetPath, pngBuffer);
      pngFilePaths.push(targetPath);
    }

    // Pass all 4 distinct resolution images into pngToIco
    const { default: pngToIco } = await import('png-to-ico');
    const icoBuf = await pngToIco(pngFilePaths);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

    // Clean up temporary smaller PNGs, preserving build/icon.png (256x256) and build/icon.ico
    for (const size of [16, 32, 48]) {
      const tempPng = path.join(buildDir, `icon_${size}.png`);
      if (fs.existsSync(tempPng)) {
        fs.unlinkSync(tempPng);
      }
    }

    console.log('Sucesso: build/icon.ico gerado com 4 camadas reais (16, 32, 48, 256px) e build/icon.png!');
  } catch (err) {
    console.error('Erro ao gerar ícones:', err);
    process.exit(1);
  } finally {
    app.quit();
  }
});
