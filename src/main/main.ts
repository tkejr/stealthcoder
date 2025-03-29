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
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';
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

if (isDebug) {
  require('electron-debug').default();
}

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
    // Get the display where the window is currently located
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

    // Find the source that matches our display
    const displaySource = sources.find(
      (source) => source.display_id === currentDisplay.id.toString(),
    );

    if (!displaySource) {
      throw new Error('Display source not found');
    }

    // Hide the main window temporarily for clean screenshot
    mainWindow.hide();

    // Wait a bit for window to hide
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    const image = displaySource.thumbnail;

    // Create filename
    const downloadPath = app.getPath('downloads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(downloadPath, `screenshot-${timestamp}.png`);

    // Save the image using proper buffer write
    fs.writeFileSync(filePath, image.toPNG());

    // Show window again
    mainWindow.show();

    return filePath;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
}

ipcMain.handle('take-screenshot', async () => {
  try {
    const filePath = await captureScreenshot();
    if (mainWindow) {
      mainWindow.webContents.send('screenshot-complete', filePath);
    }
    return filePath;
  } catch (error) {
    console.error('Screenshot failed:', error);
    throw error;
  }
});

const createWindow = async () => {
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
    width: 1024,
    height: 728,
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
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

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

  globalShortcut.register('CommandOrControl+H', async () => {
    if (mainWindow) {
      try {
        const filePath = await captureScreenshot();
        mainWindow.webContents.send('screenshot-complete', filePath);
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }
  });

  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) {
      mainWindow.webContents.reload();
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

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
