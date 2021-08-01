const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require('fs-extra');

const addOpenFileDialog = require('./src/main/addOpenFileDialog');
const addGetMovieThumbnail = require('./src/main/addGetMovieThumbnail');

const createWindow = () => {
  global.mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // ipc events
  addOpenFileDialog();
  addGetMovieThumbnail();

  global.mainWindow.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  // macOSの場合は、ウィンドウがない時にも起動しているから、ウィンドウがなければ起動するように作成
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// winやlinuxでのウィンドウクローズ時にのみアプリケーション終了(macでは閉じない)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
