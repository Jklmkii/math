const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1050,
    height: 750,
    minWidth: 450,
    minHeight: 600,
    title: 'MathUtils',
    icon: path.join(__dirname, '../build/icon.ico'),
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Remove standard default menu bar for clean native feel
  win.setMenuBarVisibility(false);

  // Apply CSP only in production via session headers to keep Vite HMR intact during dev
  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
          ],
        },
      });
    });
  }

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  // Open external links in default OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

// IPC Handlers
app.whenReady().then(() => {
  const mainWindow = createWindow();

  // Save File Dialog
  ipcMain.handle('dialog:saveFile', async (event, { defaultName, content, filters }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: filters || [
          { name: 'Arquivos JSON', extensions: ['json'] },
          { name: 'Arquivos CSV', extensions: ['csv'] },
          { name: 'Todos os Arquivos', extensions: ['*'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      await fs.promises.writeFile(filePath, content, 'utf8');
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Open File Dialog with strict JSON schema validation
  ipcMain.handle('dialog:openFile', async (event, { filters }) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || [{ name: 'Arquivos JSON', extensions: ['json'] }],
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = filePaths[0];
      const rawContent = await fs.promises.readFile(filePath, 'utf8');

      // Strict Schema Validation
      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return {
          success: false,
          error: 'O arquivo selecionado não é um JSON válido ou está corrompido.',
        };
      }

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          error: 'Formato inválido: o arquivo de backup deve conter uma lista (array) de itens.',
        };
      }

      // Validate each item structure
      const validTypes = ['bhaskara', 'regra_simples', 'regra_composta'];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string' ||
          typeof item.timestamp !== 'number' ||
          !validTypes.includes(item.type) ||
          typeof item.title !== 'string' ||
          typeof item.summary !== 'string' ||
          typeof item.details !== 'string'
        ) {
          return {
            success: false,
            error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
          };
        }
      }

      return { success: true, data: parsed, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
