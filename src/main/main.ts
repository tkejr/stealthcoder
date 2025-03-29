/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  desktopCapturer,
  screen,
} from 'electron';
// @ts-ignore
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isDebug) {
//   require('electron-debug').default();
// }

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

async function captureScreenshot(): Promise<string> {
  try {
    if (!mainWindow) {
      throw new Error('Main window not found');
    }
    const currentDisplay = screen.getDisplayNearestPoint(
      mainWindow.getBounds(),
    );

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: currentDisplay.size.width,
        height: currentDisplay.size.height,
      },
    });

    const displaySource = sources.find(
      (source) => source.display_id === currentDisplay.id.toString(),
    );

    if (!displaySource) {
      throw new Error('Display source not found');
    }

    const image = displaySource.thumbnail;
    const base64Image = image.toPNG().toString('base64');

    return base64Image;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
}

ipcMain.handle('take-screenshot', async () => {
  try {
    const base64Image = await captureScreenshot();
    if (mainWindow) {
      mainWindow.webContents.send('screenshot-complete', base64Image);
    }
    return base64Image;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
});

const createWindow = async (savedOpacity: number) => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 728,
    height: 300,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    opacity: savedOpacity,
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.setContentProtection(true);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+B', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  // Add window movement shortcuts
  globalShortcut.register('CommandOrControl+Left', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x - 10, y);
    }
  });

  globalShortcut.register('CommandOrControl+Right', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + 10, y);
    }
  });

  globalShortcut.register('CommandOrControl+Up', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y - 10);
    }
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y + 10);
    }
  });

  globalShortcut.register('CommandOrControl+H', async () => {
    if (mainWindow) {
      try {
        const base64Image = await captureScreenshot();
        mainWindow.webContents.send('screenshot-complete', base64Image);
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }
  });

  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) {
      // Clear localStorage
      mainWindow.webContents.session
        .clearStorageData({ storages: ['localstorage'] })
        .then(() => {
          mainWindow.webContents.reload();
        })
        .catch((error) => {
          console.error('Failed to clear localStorage:', error);
        });
    }
  });

  // Clean up shortcuts when app closes
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const store = new Store();

app
  .whenReady()
  .then(() => {
    const savedOpacity = store.get('window.opacity', 0.9) as number;
    createWindow(savedOpacity);

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow(store.get('window.opacity', 0.9) as number);
      }
    });
  })
  .catch(console.log);

// Handle set-opacity from renderer
ipcMain.handle('set-opacity', (_event, value: number) => {
  store.set('window.opacity', value);
  if (mainWindow) {
    mainWindow.setOpacity(value);
  }
});

ipcMain.handle('get-opacity', () => {
  return store.get('window.opacity', 0.9);
});
