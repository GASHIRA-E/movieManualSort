const { ipcRenderer } = require("electron");
// TODO: 作成したサムネイル画像の削除機能
// TODO: レンダー側のファイルを分割
// TODO: ローディング表示対応
// TODO: パフォーマンスが悪い（動画ファイルの読み込み重すぎ）

// サムネ作成のイベント実行
async function generateOneMovieThumb(filePath) {
  return new Promise((resolve, reject) => {
    ipcRenderer.once("get-movie-thumbnail", (_event, result) => {
      if (result.canceled) {
        reject();
      }
      console.log("result");
      console.log(result);
      resolve({
        filePath: filePath,
        start: result.startThumb,
        end: result.endThumb,
      });
    });
    ipcRenderer.send("get-movie-thumbnail", {
      file: filePath,
    });
  });
}

// 動画ファイルのパスリストからサムネ作成
async function* generateAllThumb(list) {
  console.log("実行するファイルリスト");
  console.log(list);
  for (let filePath of list) {
    yield await generateOneMovieThumb(filePath);
  }
}

function createElementFromHTML(html) {
  const tempEl = document.createElement("div");
  tempEl.innerHTML = html;
  return tempEl.firstElementChild;
}

// 順番切り替えを行う drag and drop のイベントを付与
function addDnDEvent() {
  const TRANSFER_TYPE = "text/html";

  const handleDragStart = (e) => {
    console.log("drag start");
    if (e.target.classList.contains("js-file")) {
      e.currentTarget.classList.add("opacity-40");
      e.currentTarget.classList.add("dragging");

      e.dataTransfer.setData(TRANSFER_TYPE, e.currentTarget.outerHTML);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragEnd = (e) => {
    console.log("drag end");
    if (e.currentTarget.classList.contains("js-file")) {
      e.currentTarget.classList.remove("opacity-40");
      e.currentTarget.classList.remove("dragging");
    }
  };

  const handleDragLeave = (e) => {
    console.log("drag leave");
    // e.preventDefault();
    e.currentTarget.classList.remove("border-dashed");
  };

  const handleDragEnter = (e) => {
    console.log("drag enter");
    // e.preventDefault();
    e.currentTarget.classList.add("border-dashed");
  };

  const handleDragOver = (e) => {
    console.log("drag over");
    e.preventDefault();
  };

  const handleDrop = (e) => {
    console.log("drop");
    e.preventDefault();
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.currentTarget.classList.contains("js-file")) {
      const draggingItem =
        e.currentTarget.parentNode.querySelector(".dragging");
      e.currentTarget.parentNode.insertBefore(
        draggingItem,
        e.currentTarget.nextSibling
      );
    }

    return false;
  };

  const fileL = document.getElementsByClassName("js-file");

  [...fileL].forEach((file) => {
    file.addEventListener("dragstart", handleDragStart, false);
    file.addEventListener("dragend", handleDragEnd, false);

    file.addEventListener("dragleave", handleDragLeave, false);
    file.addEventListener("dragenter", handleDragEnter, false);
    file.addEventListener("dragover", handleDragOver, false);
    file.addEventListener("drop", handleDrop, false);
  });

}

// 動画のliを追加する
const appendMovieItem = (filePath, startThumb, endThumb) => {
  const fileListDom = document.getElementById("js-file-list");
  fileListDom.appendChild(
    createElementFromHTML(`
    <li class="flex border-2 border-gray-500 rounded bg-blue-100 js-file cursor-move" draggable="true">
      <div class="flex w-1/2 items-center file-list-index">
        <p class="break-all align-middle ml-2">
          ${filePath}
        </p>
      </div>
      <div class="flex ml-4">
        <img class="max-h-24"
          src="${startThumb}"
          alt=""
          draggable="false"
        >
        <img class="max-h-24 ml-2"
          src="${endThumb}"
          alt=""
          draggable="false"
        >
      </div>
    </li>
    `)
  );
};

const appendDummyLastItem = () => {
  const fileListDom = document.getElementById("js-file-list");
  fileListDom.appendChild(
    createElementFromHTML(`
    <li class="js-file js-dummy">
    </li>
    `)
  );
};

window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("open-file-dialog", async (_event, result) => {
    if (result.canceled) {
      return;
    }

    const movies = result.files.filter((file) =>
      new RegExp(/\.MP4/i).test(file)
    );

    // const generateT = generateAllThumb([movies[0], movies[1], movies[2]]);
    const generateT = generateAllThumb(movies);
    for await (let thumbPath of generateT) {
      appendMovieItem(thumbPath.filePath, thumbPath.start, thumbPath.end);
    }
    appendDummyLastItem();
    addDnDEvent();
  });

  document.getElementById("file-open-event").addEventListener("click", () => {
    ipcRenderer.send("open-file-dialog", {
      title: "Select a file",
      properties: ["openDirectory"],
    });
  });
});
