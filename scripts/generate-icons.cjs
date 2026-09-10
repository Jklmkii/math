const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      show: false,
      width: 300,
      height: 300,
      webPreferences: {
        offscreen: true,
      },
    });

    const svgPath = path.join(__dirname, '../public/favicon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const base64Svg = Buffer.from(svgContent).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;">
          <canvas id="c" width="256" height="256"></canvas>
          <script>
            const img = new Image();
            img.onload = () => {
              const canvas = document.getElementById('c');
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 256, 256);
              window.renderedPng = canvas.toDataURL('image/png');
            };
            img.src = "${dataUri}";
          </script>
        </body>
      </html>
    `;

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    let pngDataUrl = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100));
      pngDataUrl = await win.webContents.executeJavaScript('window.renderedPng');
      if (pngDataUrl) break;
    }

    if (!pngDataUrl) {
      throw new Error('Tempo esgotado para renderizar o SVG no canvas.');
    }

    const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
    const pngBuffer = Buffer.from(base64Data, 'base64');

    const buildDir = path.join(__dirname, '../build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    const pngPath = path.join(buildDir, 'icon.png');
    fs.writeFileSync(pngPath, pngBuffer);

    const { default: pngToIco } = await import('png-to-ico');
    const icoBuf = await pngToIco(pngPath);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

    console.log('Sucesso: build/icon.ico (16/32/48/256px) e build/icon.png gerados!');
  } catch (err) {
    console.error('Erro ao gerar ícones:', err);
    process.exit(1);
  } finally {
    app.quit();
  }
});
