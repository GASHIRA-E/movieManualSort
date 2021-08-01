const { ipcMain, dialog } = require("electron");
const fs = require("fs-extra");

/**
 * ディレクトリを選択するモーダルを開く
 * 開いたディレクトリのファイルリストを返却
 */
module.exports = () => {
  ipcMain.on("open-file-dialog", async (event, payload) => {
    if (!global.mainWindow) {
      event.reply("open-file-dialog");
      return;
    }

    const value = await dialog.showOpenDialog(mainWindow, {
      ...payload,
    });

    // TODO: ディレクトリ内の動画ファイルだけを返すようにする
    fs.readdir(value.filePaths[0], (_err, files) => {
      event.reply("open-file-dialog", {
        filePaths: value.filePaths[0],
        files: files.map((f) => `${value.filePaths[0]}/${f}`),
      });
    });
  });
};
