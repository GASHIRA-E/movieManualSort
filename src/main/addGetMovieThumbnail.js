const { app, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const ffmpeg = require("fluent-ffmpeg");

/**
 *
 */
module.exports = () => {
  ipcMain.on("get-movie-thumbnail", async (event, payload) => {
    if (!global.mainWindow) {
      event.reply("get-movie-thumbnail");
      return;
    }

    // サムネイルを作成するディレクトリ
    const thumbPath = path.join(app.getPath("userData"), payload.file);

    fs.mkdirsSync(thumbPath);

    // ファイルが存在する場合は存在するファイルパスを返す
    if (fs.existsSync(`${thumbPath}/tn_1.png`)) {
      event.reply("get-movie-thumbnail", {
        startThumb: `${thumbPath}/tn_1.png`,
        endThumb: `${thumbPath}/tn_2.png`,
      });
      return;
    }

    ffmpeg(payload.file).ffprobe(function (err, data) {
      // console.log("===ffprobe===");
      // console.dir(data);
      ffmpeg(payload.file)
        .on("start", (args) => {
          console.log("===start====");
          console.log(args);
        })
        .on("codecData", (args) => {
          console.log("===codecData====");
          console.log(args);
          // videoDuration = args.duration;
        })
        .on("filenames", function (filenames) {
          console.log("Will generate " + filenames.join(", "));
        })
        .on("end", function () {
          console.log("Screenshots taken");
          event.reply("get-movie-thumbnail", {
            startThumb: `${thumbPath}/tn_1.png`,
            endThumb: `${thumbPath}/tn_2.png`,
          });
        })
        .screenshots({
          count: 2,
          timestamps: [0, data.format.duration - 1],
          filename: "tn_%i.png",
          folder: thumbPath,
          size: "480x270",
        });
    });

    // console.log(thumbPath);
  });
};
