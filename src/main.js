// アプリケーション作成用のモジュールを読み込み
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
  Menu,
  systemPreferences,
} = require("electron");
const fs = require("fs");
const async = require("async");
const path = require("path");
const getDirName = require("path").dirname;
const request = require("request");
const unzip = require("node-unzip-2");
const csvSync = require("csv-parse/lib/sync");
const makeDir = require("make-dir");
const { PythonShell } = require("python-shell");
const Encoding = require("encoding-japanese");
const ProgressBar = require("electron-progressbar");

// modelsを読み込むために必要
const os_info = process.platform;

// .envを読み込むための処理
const ENV_PATH = path.join(path.dirname(__dirname), ".env");
require("dotenv").config({ path: ENV_PATH });

const MODE = process.env.MODE;
if (MODE === "dev") {
  python_script_dir = path.join(path.dirname(__dirname), "python_scripts_");
  process.env.PYTHONPATH = path.join(path.dirname(__dirname), "scraping_");
} else if (MODE === "pro") {
  python_script_dir = path.join(path.dirname(__dirname), "python_scripts");
  process.env.PYTHONPATH = path.join(path.dirname(__dirname), "scraping");
}

if (os_info == "win32") {
  python_path = path.join(
    path.dirname(__dirname),
    "python_modules",
    "python.exe"
  );
} else if (os_info == "darwin") {
  python_path = path.join(
    path.dirname(__dirname),
    "python_modules",
    "bin",
    "python3"
  );
}
console.log(python_path);

// win mac関係なく、BUYMAディレクトリのPATHが取れる
dir_home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
dir_buyma = path.join(dir_home, "Desktop", "BUYMA");
dir_data = path.join(dir_buyma, "data");
dir_image_conf = path.join(dir_buyma, "conf", "image.conf");
dir_manager_conf = path.join(dir_buyma, "conf", "manager.conf");
dir_scraping_conf = path.join(dir_buyma, "conf", "scraping.conf");
dir_base_conf = path.join(dir_buyma, "conf", "base.conf");

global.image_conf_data = {};
global.scraping_conf_data = {};
global.manager_conf_data = {};
global.base_conf_data = {};
global.imager_key = "";
global.scraper_key = "";
global.manager_key = "";

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ウィンドウ初期化処理
//■■■■■■■■■■■■■■■■■■■■■■■■■■
let mainWindow;
function createWindow() {
  // メインウィンドウを作成します
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    width: 1350,
    height: 750,
    // frame: false,
  });

  mainWindow.setMenu(null);

  // メインウィンドウに表示するURLを指定します
  mainWindow.loadFile(path.join(__dirname, "public", "exhibition.html"));
  initWindowMenu();

  // デベロッパーツールの起動
  // mainWindow.webContents.openDevTools()

  // First Check
  if (fs.existsSync(dir_buyma)) {
    console.log("BUYMAディレクトリは存在します。");
  } else {
    dialog.showErrorBox(
      "BUYMAフォルダがDesktopに存在しないか、正しくありません。",
      "こちらを参考にフォルダを作成してください。\nWindows：https://youtu.be/Dhyboyc3nbI?t=130\nMac：https://youtu.be/vw5tYmVHc9o?t=105"
    );
  }

  console.log("*********:");
  console.log(__dirname);
  if (
    os_info == "darwin" &&
    __dirname.indexOf("Desktop/PLUSELECT_TOOL") === -1 &&
    __dirname.indexOf("github") === -1
  ) {
    dialog.showErrorBox(
      "ツールを置いている場所が不適切です。",
      __dirname +
        "\nPLUSELECT_TOOLという名前の黒いアイコンのアプリ自体をデスクトップに移動させてください。\nhttps://youtu.be/vw5tYmVHc9o"
    );
  } else if (
    os_info == "win32" &&
    __dirname.indexOf("Desktop\\PLUSELECT_TOOL") === -1 &&
    __dirname.indexOf("github") === -1
  ) {
    dialog.showErrorBox(
      "ツールを置いている場所が不適切です。",
      __dirname +
        "\nフォルダ毎をデスクトップに移動させてください。\nhttps://youtu.be/Dhyboyc3nbI?t=74"
    );
  }

  // メインウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

//  初期化が完了した時の処理
app.on("ready", createWindow);

// 全てのウィンドウが閉じたときの処理
app.on("window-all-closed", () => {
  // macOSのとき以外はアプリケーションを終了させます
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    app.quit();
  }
});

// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on("activate", () => {
  // メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow();
  }
});

function initWindowMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "ファイル",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    // { role: 'editMenu' }
    {
      label: "編集",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "表示",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "ウィンドウ",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      label: "システム",
      submenu: [
        {
          label: "アップデート",
          click() {
            AutoUpdater();
          },
        },
        {
          label: "強制アップデート",
          click() {
            StartUpdate("Force Update", "Force Update");
          },
        },
        {
          label: "終了",
          click() {
            app.quit();
          },
        },
        {
          label: "終了2",
          click() {
            mainWindow.loadFile(path.join(__dirname, "public", "base.html"));
          },
        },
        {
          label: "在庫管理システム",
          click() {
            mainWindow.loadFile(
              path.join(__dirname, "public", "stockcheck.html")
            );
          },
        },
      ],
    },
    {
      label: "リンク",
      submenu: [
        {
          label: "PLUSELECT Webページ",
          click() {
            mainWindow.loadURL("https://pluselect.com/");
          },
        },
        {
          label: "お問い合わせ",
          click() {
            mainWindow.loadURL("mailto:pluselect.2019@gmail.com");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ページ遷移
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on("change-to-exhibition", (event) => {
  mainWindow.loadFile(path.join(__dirname, "public", "exhibition.html"));
});

ipcMain.on("change-to-manager", (event) => {
  mainWindow.loadFile(path.join(__dirname, "public", "manager.html"));
});

ipcMain.on("change-to-scraper", (event) => {
  mainWindow.loadFile(path.join(__dirname, "public", "scraper.html"));
});

ipcMain.on("change-to-imager", (event) => {
  mainWindow.loadFile(path.join(__dirname, "public", "imager.html"));
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 自動アップデートモジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
function StartUpdate(current_version, new_version) {
  var progressBar = new ProgressBar({
    closeOnComplete: false,
    text:
      "アップデートを実行" +
      current_version.toString() +
      "=>" +
      new_version.toString(),
    detail: "新しいファイルをダウンロードしています...",
    browserWindow: {
      closable: true,
      webPreferences: {
        nodeIntegration: true,
      },
      height: 250,
    },
  });
  progressBar.on("completed", function () {
    console.info(`completed...`);
    progressBar.title = "Finished";
    progressBar.detail =
      "重要※アプリを再起動してください！\nアップデートは正常に終了しました " +
      current_version.toString() +
      "=>" +
      new_version.toString();
  });
  console.log(progressBar.detail);
  // ZIPファイルをGithubからダウンロード
  new Promise((resolve, reject) => {
    console.log(path.join(__dirname, "..", "updater.zip"));
    try {
      request(
        {
          method: "GET",
          url: "https://github.com/plustry/Tool_Updater/archive/master.zip",
          encoding: null,
        },
        function (error, response, body) {
          console.log(response);
          if (!error && response.statusCode === 200) {
            fs.writeFileSync(
              path.join(__dirname, "..", "updater.zip"),
              body,
              "binary"
            );
            resolve("pass");
          }
        }
      );
    } catch (error) {
      progressBar.detail = "ツールは必ずデスクトップに置いてください。";
      reject("ツールは必ずデスクトップに置いてください。");
    }
  }).then((response) => {
    new Promise((resolve, reject) => {
      // ZIPファイルを解凍
      progressBar.detail = "新しいファイルを展開しています...";
      var stream = fs
        .createReadStream(path.join(__dirname, "..", "updater.zip"))
        .pipe(unzip.Extract({ path: path.join(__dirname, "..") }));
      stream.on("close", function () {
        resolve("pass");
      });
    }).then((response) => {
      // ディレクトリを移動
      try {
        progressBar.detail =
          "古いファイルを削除しています...\n5分以上経過しても終了しない場合はPCを再起動してもう一度お確かめください。";
        var update_list = fs.readdirSync(
          path.join(__dirname, "..", "Tool_Updater-master")
        );
        console.log(update_list);

        for (let i = 0; i < update_list.length; i++) {
          var update_path = path.join(__dirname, "..", update_list[i]);
          // console.log(update_path, fs.statSync(update_path).isDirectory())
          if (fs.statSync(update_path).isDirectory()) {
            deleteFolderRecursive(update_path);
          } else {
            fs.unlinkSync(update_path);
          }
          fs.renameSync(
            path.join(
              path.join(__dirname, "..", "Tool_Updater-master"),
              update_list[i]
            ),
            update_path
          );
        }
        progressBar.detail = "新しいファイルを適用しています...";
        if (os_info == "darwin") {
          fs.chmodSync(
            path.join(__dirname, "chromedriver", "chromedriver"),
            0o777
          );
        }
        // ZIPファイルを削除
        fs.unlinkSync(path.join(__dirname, "..", "updater.zip"));
        // 展開ディレクトリを削除
        deleteFolderRecursive(
          path.join(__dirname, "..", "Tool_Updater-master")
        );
        progressBar.detail =
          "アップデートに成功しました。\nアプリを再起動してください！";
        progressBar.setCompleted();
      } catch (error) {
        var message = error.message;
        if (error.message.indexOf("EPERM") != -1) {
          message =
            "アップデートに失敗しました。ファイルが別の場所で開かれているか、chromedriverがバックグラウンドで動いている可能性があります。https://drive.google.com/file/d/1kfrWoGcz4mhmBkOdb77HixiMHjdm6b08/view";
        } else if (error.massage.indexOf("ENOENT") != -1) {
          message =
            "アップデートに失敗しました。前回のアップデートが途中で終わった可能性があります。再度「強制アップデート」をお試しください。";
        }
        progressBar.detail = massage;
        progressBar.setCompleted();
      }
    });
  });
}

function AutoUpdater(event) {
  // 最新バージョンをGithubから確認
  process.on("unhandledRejection", console.dir);
  const url_req = new Promise((resolve, reject) => {
    request("https://plustry.github.io/Tool_Updater/versions", function (
      error,
      response,
      body
    ) {
      resolve(body);
    });
  }).then((new_version) => {
    console.log(new_version);
    // 保存されたファイルから現在のバージョンを確認
    let current_version = fs
      .readFileSync(path.join(__dirname, "..", "versions.html"), "utf-8")
      .toString();
    console.log(current_version);
    var detail_txt = "";
    if (new_version == current_version) {
      detail_txt =
        "アップデートはありませんでした Ver: " + new_version.toString();
      var options_ = {
        type: "info",
        title: "アップデート終了",
        message: "アップデートは終了しました",
        detail: detail_txt,
      };
      dialog.showMessageBox(mainWindow, options_);
    } else {
      StartUpdate(current_version, new_version);
    }
  });
}

function ErrorLog(event, message) {
  var ErrorMessage = "";
  // var ErrorMessage = message
  if (message.indexOf("ModuleNotFoundError") !== -1) {
    ErrorMessage += message.substring(message.indexOf("ModuleNotFoundError"));
  } else if (message.indexOf("FileNotFoundError") !== -1) {
    ErrorMessage += message.substring(message.indexOf("FileNotFoundError"));
  } else if (message.indexOf("NotFoundError") !== -1) {
    ErrorMessage += message.substring(message.indexOf("NotFoundError"));
  } else if (message.indexOf("BrokenPipeError") !== -1) {
    ErrorMessage += message.substring(message.indexOf("BrokenPipeError"));
  }
  if (ErrorMessage) {
    // ErrorMessage += "\nエラーが発生しました！アップデートを試してください。\nhttps://docs.google.com/document/d/1wT88HLOaG2011eJn0V5u6gnzYjqLiTcRv6f7xHvvngY/edit#heading=h.k92avs7xmxcx"
    event.sender.send("log-create", ErrorMessage);
  }
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// BASEモジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on("init-base", (event) => {
  // パラメータが存在すれば読み込む
  LoadConf(event, "base");

  // dataフォルダが存在すれば配下のディレクトリを表示させる
  base_dir_select(event);
});

function base_dir_select(event) {
  try {
    fs.statSync(dir_data);
    console.log(dir_data + "の中のフォルダを開きます。");
    event.sender.send("selected-directory", dir_data);
    // ディレクトリ&ファイル選択ボタン
    fs.readdir(dir_data, function (err, list) {
      if (err) {
        console.log(err);
      } else {
        var dirfile_list = [];
        console.log(list);
        for (var i = 0; i < list.length; i++) {
          var dir_check = fs
            .statSync(path.join(dir_data, list[i]))
            .isDirectory();
          if (dir_check || list[i].indexOf(".csv") !== -1) {
            dirfile_list.push(list[i]);
          }
        }
        event.sender.send("make-dirfile-button", dirfile_list);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

ipcMain.on("start-base", (event, args_list) => {
  // confを更新する
  args_list = JSON.parse(args_list);
  WriteConf(event, args_list, "base");

  let options = {
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"], // get print results in real-time
    args: JSON.stringify(args_list),
    encoding: "binary",
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }
  console.log(options);

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell("base.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    event.sender.send("log-create", message);
  });

  // DEBUG情報などを取得したい場合
  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    // 処理が終了した時に、設定情報を再度反映させる
    LoadConf(event, "base");
    event.sender.send("log-create", "処理は全て終了しました");
  });
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 画像加工モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on("init-imager", (event) => {
  // パラメータが存在すれば読み込む
  LoadConf(event, "imager");

  // dataフォルダが存在すれば配下のディレクトリを表示させる
  image_dir_select(event);
});

// フォルダ展開
ipcMain.on("open-file-imager", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((folder) => {
      if (folder.filePaths[0]) {
        // 選択したフォルダ配下のディレクトリを表示させる
        console.log(folder.filePaths[0]);
        image_dir_select(event, folder.filePaths[0]);
      }
    });
});

function image_dir_select(event) {
  try {
    fs.statSync(dir_data);
    console.log(dir_data + "の中のフォルダを開きます。");
    event.sender.send("selected-directory", dir_data);
    // ディレクトリ選択ボタン
    fs.readdir(dir_data, function (err, list) {
      if (err) {
        console.log(err);
      } else {
        var dir_list = [];
        for (var i = 0; i < list.length; i++) {
          var dir_check = fs
            .statSync(path.join(dir_data, list[i]))
            .isDirectory();
          if (dir_check) {
            dir_list.push(list[i]);
          }
        }
        event.sender.send("make-dir-button", dir_list);
      }
    });
  } catch (error) {
    console.log(error);
    dialog.showErrorBox(
      "BUYMAフォルダの場所に関するエラー",
      "Desktopがクラウドに存在していると上手く動かないことがあります。\n" +
        dir_data +
        "\n\n↓↓↓エラー内容↓↓↓\n" +
        error
    );
  }
}

// ファイル選択
ipcMain.on("open-file", (event, value) => {
  console.log(value);
  dialog
    .showOpenDialog({
      properties: ["openFile"],
    })
    .then((file) => {
      if (file.filePaths[0]) {
        event.sender.send(value, file.filePaths[0]);
      }
    });
});

ipcMain.on("start-imager", (event, args_list) => {
  // confを更新する
  args_list = JSON.parse(args_list);
  WriteConf(event, args_list, "imager");

  // 追加要素
  args_list["imager_key"] = imager_key;
  args_list["electron_dir"] = __dirname;

  let options = {
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"], // get print results in real-time
    args: JSON.stringify(args_list),
    encoding: "binary",
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }
  console.log(options);

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell("imager.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    // ログイン情報を保存
    if (message === "one time login key ***imager***") {
      imager_key = message;
    } else {
      event.sender.send("log-create", message);
    }
    // 作成した画像を表示させる
    if (message.indexOf("image.png") !== -1) {
      var image_path = message.slice(message.indexOf("：") + 1);
      event.sender.send("disp-image", image_path);
    }
  });

  // DEBUG情報などを取得したい場合
  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    // 処理が終了した時に、設定情報を再度反映させる
    LoadConf(event, "imager");
    event.sender.send("log-create", "処理は全て終了しました");
  });
});

function LoadConf(event, which_conf) {
  var dir_conf = "";
  if (which_conf === "imager") {
    dir_conf = dir_image_conf;
  } else if (which_conf === "scraper") {
    dir_conf = dir_scraping_conf;
  } else if (which_conf === "manager") {
    dir_conf = dir_manager_conf;
  } else if (which_conf === "base") {
    dir_conf = dir_base_conf;
  }

  var conf_data = "";
  try {
    conf_data = fs.readFileSync(dir_conf, { encoding: "utf-8" });
  } catch (error) {
    event.sender.send(
      "log-create",
      dir_conf + "：こちらにファイルを置くと設定情報が保存されます。"
    );
  }

  if (which_conf === "imager") {
    // image_conf_dataを設定
    try {
      image_conf_data = JSON.parse(conf_data);
      event.sender.send("load-image-conf", conf_data);
    } catch (error) {
      event.sender.send("log-create", "image.confの読み込みに失敗しました。");
    }
  } else if (which_conf === "scraper") {
    // scraping_conf_dataを設定
    try {
      scraping_conf_data = JSON.parse(conf_data);
      event.sender.send("load-scraping-conf", conf_data);
    } catch (error) {
      event.sender.send(
        "log-create",
        "scraping.confの読み込みに失敗しました。"
      );
    }
  } else if (which_conf === "manager") {
    // manager_conf_dataを設定
    try {
      manager_conf_data = JSON.parse(conf_data);
      event.sender.send("load-manager-conf", conf_data);
    } catch (error) {
      event.sender.send("log-create", "manager.confの読み込みに失敗しました。");
    }
  } else if (which_conf === "base") {
    // base_conf_dataを設定
    try {
      base_conf_data = JSON.parse(conf_data);
      event.sender.send("load-base-conf", conf_data);
    } catch (error) {
      event.sender.send("log-create", "base.confの読み込みに失敗しました。");
    }
  }
}

function WriteConf(event, args_list, which_conf) {
  var dir_conf = "";
  if (which_conf === "imager") {
    dir_conf = dir_image_conf;
  } else if (which_conf === "scraper") {
    dir_conf = dir_scraping_conf;
  } else if (which_conf === "manager") {
    dir_conf = dir_manager_conf;
  } else if (which_conf === "base") {
    dir_conf = dir_base_conf;
  }

  var conf_data = "";
  if (which_conf === "imager") {
    conf_data = image_conf_data;
  } else if (which_conf === "scraper") {
    conf_data = scraping_conf_data;
  } else if (which_conf === "manager") {
    conf_data = manager_conf_data;
  } else if (which_conf === "base") {
    conf_data = base_conf_data;
  }

  // image_conf_dataのメアドとパスワードを更新
  conf_data["login"] = {};
  conf_data["login"]["email"] = args_list["email"];
  conf_data["login"]["password"] = args_list["password"];

  // spider名を取得
  var spider_name = "";
  if (which_conf === "imager") {
    if (args_list["choiced_dir"].indexOf("_") !== -1) {
      spider_name = args_list["choiced_dir"].substring(
        0,
        args_list["choiced_dir"].indexOf("_")
      );
    }
  } else if (which_conf === "scraper") {
    spider_name = args_list["spider_name"];
  } else if (which_conf === "manager") {
    onoff = args_list["onoff"];
  }

  // 初めて設定するspiderの場合
  if (which_conf === "imager" || which_conf === "scraper") {
    if (Object.keys(conf_data).indexOf(spider_name) === -1) {
      conf_data[spider_name] = {};
    }
  } else if (which_conf === "manager") {
    if (Object.keys(conf_data).indexOf(onoff) === -1) {
      conf_data[spider_name] = {};
    }
  }

  var imager_conf_list = process.env.imager_conf_list.split(",");
  var scraper_conf_list = process.env.scraper_conf_list.split(",");
  var manager_conf_list = process.env.manager_conf_list.split(",");
  // var base_conf_list = process.env.base_conf_list.split(",");
  // console.log(imager_conf_list);
  // console.log(scraper_conf_list);
  // console.log(manager_conf_list);

  var conf_list = {};
  if (which_conf === "imager") {
    // カテゴリとスパイダー名を取得
    var category = "";
    if (args_list["img_new_category"]) {
      category = args_list["img_new_category"];
    } else if (args_list["img_category"]) {
      category = args_list["img_category"];
    }
    // カテゴリのパラメータを更新
    for (let i = 0; i < imager_conf_list.length; i++) {
      conf_list[imager_conf_list[i]] = args_list[imager_conf_list[i]];
    }
    conf_data[spider_name][category] = conf_list;
  } else if (which_conf === "scraper") {
    for (let i = 0; i < scraper_conf_list.length; i++) {
      conf_list[scraper_conf_list[i]] = args_list[scraper_conf_list[i]];
    }
    conf_data[spider_name] = conf_list;
  } else if (which_conf === "manager") {
    for (let i = 0; i < manager_conf_list.length; i++) {
      conf_list[manager_conf_list[i]] = args_list[manager_conf_list[i]];
    }
    conf_data[onoff] = conf_list;
  }

  // 書き出し
  fs.writeFile(dir_conf, JSON.stringify(conf_data), "utf8", (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(which_conf + "のconfファイルを保存しました。");
    }
  });
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 在庫確認 モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on("init-stockcheck", (event) => {
  try {
    fs.statSync(dir_data);
    console.log("デフォルトフォルダが存在したので開きます。");
    event.sender.send("selected-directory", dir_data);
  } catch (error) {
    console.log(error);
  }
  // パラメータが存在すれば読み込む
  LoadConf(event, "scraper");
});

// 在庫確認開始
ipcMain.on("start-stockcheck", (event, args_list) => {
  // 認証チェック
  if (scraper_key !== "one time login key ***scraper***") {
    event.sender.send("log-create", "認証が完了していません。");
    return;
  }
  // confを更新する
  args_list = JSON.parse(args_list);
  let options = {
    mode: "text",
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"],
    args: JSON.stringify(args_list),
    encoding: "binary",
  };

  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  console.log(options);
  let pyshell = new PythonShell("stock_check.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    event.sender.send("log-create", message);
  });

  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    event.sender.send("log-create", "処理は全て終了しました");
  });
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// スクレイピング モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on("init-scraper", (event) => {
  try {
    fs.statSync(dir_data);
    console.log("デフォルトフォルダが存在したので開きます。");
    event.sender.send("selected-directory", dir_data);
  } catch (error) {
    console.log(error);
  }
  // パラメータが存在すれば読み込む
  LoadConf(event, "scraper");
});

// フォルダ展開
ipcMain.on("open-file-scraper", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((folder) => {
      if (folder.filePaths[0]) {
        // 選択したディレクトリを表示
        event.sender.send("selected-directory", folder.filePaths[0]);
      }
    });
});

// SQLログイン
ipcMain.on("sql-login", (event, email, password, value) => {
  console.log(email, password);
  args_list = {
    email: email,
    password: password,
    value: value,
  };

  let options = {
    mode: "text",
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"],
    args: JSON.stringify(args_list),
    encoding: "binary",
  };

  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  // console.log(options)
  let pyshell = new PythonShell("login.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    // ログイン情報を保存
    if (message == "False") {
      event.sender.send("log-create", "認証に失敗しました");
    } else if (message === "one time login key ***scraper***") {
      scraper_key = message;
    } else if (message.indexOf(">>>>>") !== -1) {
      event.sender.send("log-create", message);
    } else {
      // datetime&シングルクオテーションがあるとエラーになる
      message = message.replace(/'/g, '"');
      event.sender.send("load-login-data", message);
    }
  });

  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    event.sender.send("log-create", "認証が終了しました");
  });
});

// スクレイピング開始
ipcMain.on("start-scrapy", (event, args_list) => {
  // 認証チェック
  if (scraper_key !== "one time login key ***scraper***") {
    event.sender.send("log-create", "認証が完了していません。");
    return;
  }
  // confを更新する
  args_list = JSON.parse(args_list);
  WriteConf(event, args_list, "scraper");

  let options = {
    mode: "text",
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"],
    args: JSON.stringify(args_list),
    encoding: "binary",
  };

  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  console.log(options);
  let pyshell = new PythonShell("scrapy_start.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    event.sender.send("log-create", message);
  });

  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    // 処理が終了した時に、設定情報を再度反映させる
    LoadConf(event, "scraper");
    event.sender.send("log-create", "処理は全て終了しました");
  });
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// BuyManager モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 開いた時にデスクトップにBUYMAフォルダがあれば展開
ipcMain.on("init-manager", (event) => {
  try {
    fs.statSync(dir_buyma);
    console.log("デフォルトフォルダが存在したので開きます。");
    event.sender.send("selected-directory", dir_buyma);
  } catch (error) {
    console.log(error);
  }
  LoadConf(event, "manager");
});

// フォルダ展開
ipcMain.on("open-file-manager", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((folder) => {
      if (folder.filePaths[0]) {
        // 選択したディレクトリを表示
        event.sender.send("selected-directory", folder.filePaths[0]);
      }
    });
});

// BuyManager実行
ipcMain.on("start-manager", (event, args_list) => {
  args_list = JSON.parse(args_list);
  args_list["electron_dir"] = __dirname;

  // confを更新する
  WriteConf(event, args_list, "manager");

  let options = {
    mode: "text",
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"], // get print results in real-time
    args: JSON.stringify(args_list),
    encoding: "binary",
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }
  // console.log(options)

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell("BuyManager.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    // received a message sent from the Python script (a simple "print" statement)
    event.sender.send("log-create", message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    event.sender.send("log-create", "処理は全て終了しました");
  });
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 自動出品ツール モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ユーザーディレクトリ新規作成
ipcMain.on("make-account-dir", (event, user_name) => {
  console.log(user_name);
  if (user_name == "") {
    dialog.showErrorBox(
      "空白ディレクトリ",
      "新規アカウントディレクトリを作成する場合はアカウント名を入力してください"
    );
  } else {
    dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((folder) => {
        if (folder.filePaths[0]) {
          makeDir(path.join(folder.filePaths[0], "BUYMA")).then((buyma_dir) => {
            //logsディレクトリ作成
            makeDir(path.join(buyma_dir, "logs"));
            //dataディレクトリ作成
            makeDir(path.join(buyma_dir, "data"));
            //confディレクトリ作成
            makeDir(path.join(buyma_dir, "conf")).then((dir) => {
              var txt_list = [
                "image.conf",
                "scraping.conf",
                "manager.conf",
                "base.conf",
              ];
              for (let i = 0; i < txt_list.length; i++) {
                var conf_path = path.join(dir, txt_list[i]);
                if (!isExistFile(conf_path)) {
                  fs.writeFile(conf_path, "", (err) => {
                    if (err) throw err;
                  });
                }
              }
            });

            //tmp_brandディレクトリ作成
            makeDir(path.join(buyma_dir, "tmp_brand")).then((dir) => {
              makeDir(path.join(dir, "Saint Laurent")).then((dir) => {
                mkCategoryFile(dir);
                var text_data =
                  "「カテゴリーコメント」\n【SAINT LAURENT】\nサンローランとしても知られるイブサンローランSASは\nイブサンローランと彼のパートナーである\nピエールベルジェによって設立された\nフランスの高級ファッションハウスです。";
                var text_path = path.join(dir, "Saint Laurent.txt");
                if (!isExistFile(text_path)) {
                  fs.writeFile(text_path, text_data, (err) => {
                    if (err) throw err;
                  });
                }
              });
            });

            // tmp_categoryディレクトリ作成
            makeDir(path.join(buyma_dir, "tmp_category")).then((dir) => {
              mkCategoryFile(dir);
            });

            //img_contentディレクトリ作成
            makeDir(path.join(buyma_dir, "img_content")).then((dir) => {
              console.log(dir);
              makeDir(path.join(dir, "background"));
              makeDir(path.join(dir, "effect"));
              makeDir(path.join(dir, "frame"));
              makeDir(path.join(dir, "logo"));
            });

            //accountディレクトリ作成
            makeDir(path.join(buyma_dir, "account")).then((dir) => {
              console.log(dir);
              makeDir(path.join(dir, user_name)).then((dir) => {
                console.log(dir);
                makeDir(path.join(dir, "template")).then((dir) => {
                  console.log(dir);
                  var txt_list = [
                    "ColorFooter.txt",
                    "ColorHeader.txt",
                    "CommentFooter.txt",
                    "CommentHeader.txt",
                  ];
                  for (let i = 0; i < txt_list.length; i++) {
                    var temp_path = path.join(dir, txt_list[i]);
                    if (!isExistFile(temp_path)) {
                      fs.writeFile(temp_path, " ", (err) => {
                        if (err) throw err;
                      });
                    }
                  }
                });
              });
            });
          });
        }
      });
  }
});

//ファイル選択画面-ipc受信
ipcMain.on("open-file-exhibition", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((folder) => {
      if (folder.filePaths[0]) {
        // 選択したディレクトリを表示
        event.sender.send("selected-directory", folder.filePaths[0]);
        var files = fs.readdirSync(folder.filePaths[0]);
        var fileList = [];
        for (let index = 0; index < files.length; index++) {
          if (files[index].indexOf(".csv") !== -1) {
            fileList.push(files[index]);
          }
          // 選択したディレクトリにバックアップがあれば読み込み
          if (files[index].indexOf("access_code.backup") !== -1) {
            event.sender.send(
              "update-accesscode",
              readTXT(path.join(folder.filePaths[0], files[index]))
            );
          }
        }
      }
      event.sender.send("selected-csv", fileList);
    });
});

//CSV読み込み-ipc受信
ipcMain.on("load-csv", (event, csv_file_name) => {
  const res_data = readCSV(csv_file_name);
  const table_data = ARRAYtoTABLE(res_data);
  event.sender.send("selected-filedata", table_data);
});

//自動出品開始
ipcMain.on("start-exhibition", (event, args_list) => {
  args_list = JSON.parse(args_list);
  args_list["electron_dir"] = __dirname;
  cookie = args_list["cookie"];
  dir_path = args_list["dir_path"];

  // アクセスコードのバックアップ
  fs.writeFile(
    path.join(dir_path, "access_code.backup"),
    cookie,
    (err, data) => {
      if (err) event.sender.send("log-create", err);
      else event.sender.send("log-create", "maked backup: access code");
    }
  );
  let options = {
    mode: "text",
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ["-u"],
    args: JSON.stringify(args_list),
    encoding: "binary",
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"];
  }
  // console.log(options)

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell("exhibition.py", options);

  pyshell.on("message", function (message) {
    message = toString(message);
    // received a message sent from the Python script (a simple "print" statement)
    event.sender.send("log-create", message);
  });

  // DEBUG情報などを取得したい場合
  pyshell.on("stderr", function (message) {
    ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    event.sender.send("log-create", "出品処理は全て終了しました");
  });
});

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 共通モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 再帰的にファイルを作成
function fcmkfile(file_path) {
  return new Promise((resolve) => {
    fs.mkdir(getDirName(file_path), { recursive: true }, (err) => {
      if (err) console.log(err);
      if (!isExistFile(file_path)) {
        fs.writeFile(file_path, "", (err) => {
          if (err) console.log(err);
          resolve();
        });
      }
    });
  });
}

async function mkCategoryFile(dir) {
  // カテゴリテンプレートのリスト作成
  file_list = [];
  for (let i = 0; i < category_list.length; i++) {
    var category = category_list[i].split(" ");
    var category_tmp_path = "";
    for (let j = 0; j < category.length; j++) {
      category_tmp_path = path.join(category_tmp_path, category[j]);
    }
    category_tmp_path = path.join(category_tmp_path, "comment.txt");
    file_list.push(category_tmp_path);
  }
  console.log(file_list);

  for (var i = 0; i < file_list.length; i++) {
    await fcmkfile(path.join(dir, file_list[i]));
  }
  return "ループ終わった。";
}

// エラー表示用
ipcMain.on("cause-error", (event, txt1, txt2) => {
  dialog.showErrorBox(txt1, txt2);
});

// 情報表示用
ipcMain.on("show-info", (event, title, message, detail) => {
  var options = {
    type: "info",
    title: title,
    message: message,
    detail: detail,
  };
  dialog.showMessageBox(mainWindow, options);
});

// ファイル読み込み用
function readCSV(path) {
  let data = fs.readFileSync(path);
  let res = csvSync(data);
  return res;
}

function readTXT(path) {
  let res = fs.readFileSync(path);
  return res;
}

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false;
  }
}

// 文字列を表形式(HTML)に
function ARRAYtoTABLE(res_data) {
  var table_text = '<table rules="all">';
  var data_list = res_data;
  var need_list = [0, 1, 2, 4, 8, 18];

  // 項目処理
  for (let i = 0; i < data_list.length; i++) {
    // 見出し処理
    if (i == 0) {
      var start_tag = "<th nowrap>";
      var end_tag = "</th>";
    } else {
      var start_tag = "<td nowrap>";
      var end_tag = "</td>";
    }

    if (i == 0) {
      table_text += "<thead> <tr>";
    } else {
      table_text += "<tr>";
    }
    for (let j = 0; j < data_list[i].length; j++) {
      for (let need = 0; need < need_list.length; need++) {
        if (need_list[need] == j) {
          table_text += start_tag + data_list[i][j] + end_tag;
        }
      }
    }
    if (i == 0) {
      table_text += "</tr> </thead> <tbody>";
    } else {
      table_text += "</tr>";
    }
  }
  table_text += "</tbody> </table>";

  return table_text;
}

// 文字列変換用
const toString = (bytes) => {
  if (os_info == "win32") {
    return Encoding.convert(bytes, {
      from: "SJIS",
      to: "UNICODE",
      type: "string",
    });
  } else if (os_info == "darwin") {
    return bytes;
  }
};

// ディレクトリ削除
var deleteFolderRecursive = function (pathe) {
  if (fs.existsSync(pathe)) {
    fs.readdirSync(pathe).forEach(function (file) {
      var curPath = path.join(pathe, file);
      if (fs.statSync(curPath).isDirectory()) {
        //recurse
        deleteFolderRecursive(curPath);
      } else {
        //delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathe);
  }
};

category_list = [
  "レディースファッション トップス トップスその他",
  "レディースファッション トップス Tシャツ・カットソー",
  "レディースファッション トップス ブラウス・シャツ",
  "レディースファッション トップス ニット・セーター",
  "レディースファッション トップス スウェット・トレーナー",
  "レディースファッション トップス パーカー・フーディ",
  "レディースファッション トップス カーディガン",
  "レディースファッション トップス アンサンブル",
  "レディースファッション トップス ベスト・ジレ",
  "レディースファッション トップス ポロシャツ",
  "レディースファッション トップス キャミソール",
  "レディースファッション トップス タンクトップ",
  "レディースファッション トップス チュニック",
  "レディースファッション ボトムス ボトムスその他",
  "レディースファッション ボトムス スカート",
  "レディースファッション ボトムス ミニスカート",
  "レディースファッション ボトムス パンツ",
  "レディースファッション ボトムス ショートパンツ",
  "レディースファッション ボトムス デニム・ジーパン",
  "レディースファッション ワンピース・オールインワン ワンピースその他",
  "レディースファッション ワンピース・オールインワン ワンピース",
  "レディースファッション ワンピース・オールインワン オールインワン・サロペット",
  "レディースファッション ワンピース・オールインワン セットアップ",
  "レディースファッション アウター アウターその他",
  "レディースファッション アウター コート",
  "レディースファッション アウター ジャケット",
  "レディースファッション アウター ダウンジャケット・コート",
  "レディースファッション アウター レザージャケット・コート",
  "レディースファッション アウター ムートン・ファーコート",
  "レディースファッション アウター ダウンベスト",
  "レディースファッション アウター ブルゾン",
  "レディースファッション アウター トレンチコート",
  "レディースファッション アウター ベスト・ジレ",
  "レディースファッション アウター ポンチョ・ケープ",
  "レディースファッション ブライダル・パーティー パーティー小物その他",
  "レディースファッション ブライダル・パーティー ブライダルその他",
  "レディースファッション ブライダル・パーティー パーティードレス",
  "レディースファッション ブライダル・パーティー ボレロ・ショール",
  "レディースファッション ブライダル・パーティー ウェディングドレス",
  "レディースファッション ブライダル・パーティー ウェディングアクセサリー",
  "レディースファッション ブライダル・パーティー ウェディングシューズ",
  "レディースファッション ブライダル・パーティー ブライダル小物",
  "レディースファッション ブライダル・パーティー 引き出物",
  "レディースファッション 水着・ビーチグッズ 水着・ビーチグッズその他",
  "レディースファッション 水着・ビーチグッズ ビキニ",
  "レディースファッション 水着・ビーチグッズ ワンピース水着",
  "レディースファッション 水着・ビーチグッズ タンキニ",
  "レディースファッション 水着・ビーチグッズ ラッシュガード",
  "レディースファッション 水着・ビーチグッズ ボードショーツ・レギンス",
  "レディースファッション 水着・ビーチグッズ うきわ",
  "レディースファッション 水着・ビーチグッズ ビーチタオル",
  "レディースファッション その他ファッション その他",
  "レディースファッション その他ファッション スーツ",
  "レディースファッション その他ファッション コスプレ・衣装",
  "レディースファッション その他ファッション 浴衣・着物・和装",
  "レディースファッション 帽子 帽子その他",
  "レディースファッション 帽子 ハット",
  "レディースファッション 帽子 キャップ",
  "レディースファッション 帽子 ストローハット",
  "レディースファッション 帽子 ニットキャップ・ビーニー",
  "レディースファッション 帽子 ベレー帽",
  "レディースファッション 帽子 ハンチング・キャスケット",
  "レディースファッション ファッション雑貨・小物 ファッション雑貨・小物その他",
  "レディースファッション ファッション雑貨・小物 スカーフ",
  "レディースファッション ファッション雑貨・小物 マフラー・ストール",
  "レディースファッション ファッション雑貨・小物 マスク",
  "レディースファッション ファッション雑貨・小物 手袋",
  "レディースファッション ファッション雑貨・小物 イヤーマフ",
  "レディースファッション ファッション雑貨・小物 ベルト",
  "レディースファッション ファッション雑貨・小物 傘・レイングッズ",
  "レディースファッション ファッション雑貨・小物 ハンカチ",
  "レディースファッション 財布・小物 財布・小物その他",
  "レディースファッション 財布・小物 長財布",
  "レディースファッション 財布・小物 折りたたみ財布",
  "レディースファッション 財布・小物 コインケース・小銭入れ",
  "レディースファッション 財布・小物 カードケース・名刺入れ",
  "レディースファッション 財布・小物 パスケース",
  "レディースファッション 財布・小物 キーケース",
  "レディースファッション 財布・小物 キーホルダー・キーリング",
  "レディースファッション 財布・小物 ポーチ",
  "レディースファッション 財布・小物 バッグチャーム",
  "レディースファッション アクセサリー アクセサリーその他",
  "レディースファッション アクセサリー ネックレス・ペンダント",
  "レディースファッション アクセサリー ピアス",
  "レディースファッション アクセサリー イヤリング",
  "レディースファッション アクセサリー 指輪・リング",
  "レディースファッション アクセサリー ブレスレット",
  "レディースファッション アクセサリー アンクレット",
  "レディースファッション アクセサリー ヘアアクセサリー",
  "レディースファッション アクセサリー パーティーアクセサリー",
  "レディースファッション アクセサリー 天然石・パワーストーン",
  "レディースファッション 腕時計 アナログ腕時計",
  "レディースファッション 腕時計 デジタル腕時計",
  "レディースファッション 腕時計 腕時計用ベルト・バンド",
  "レディースファッション 腕時計 腕時計その他",
  "レディースファッション アイウェア アイウェアその他",
  "レディースファッション アイウェア サングラス",
  "レディースファッション アイウェア メガネ",
  "レディースファッション スマホケース・テックアクセサリー",
  "レディースファッション 靴・シューズ シューズ・サンダルその他",
  "レディースファッション 靴・シューズ スニーカー",
  "レディースファッション 靴・シューズ サンダル・ミュール",
  "レディースファッション 靴・シューズ スリッポン",
  "レディースファッション 靴・シューズ パンプス",
  "レディースファッション 靴・シューズ フラットシューズ",
  "レディースファッション 靴・シューズ ローファー・オックスフォード",
  "レディースファッション 靴・シューズ バレエシューズ",
  "レディースファッション 靴・シューズ パーティーシューズ",
  "レディースファッション 靴・シューズ レインシューズ",
  "レディースファッション ブーツ ブーツその他",
  "レディースファッション ブーツ ショートブーツ・ブーティ",
  "レディースファッション ブーツ ロングブーツ",
  "レディースファッション ブーツ ミドルブーツ",
  "レディースファッション ブーツ レインブーツ",
  "レディースファッション バッグ・カバン バッグ・カバンその他",
  "レディースファッション バッグ・カバン トートバッグ",
  "レディースファッション バッグ・カバン ハンドバッグ",
  "レディースファッション バッグ・カバン ショルダーバッグ・ポシェット",
  "レディースファッション バッグ・カバン バックパック・リュック",
  "レディースファッション バッグ・カバン クラッチバッグ",
  "レディースファッション バッグ・カバン かごバッグ",
  "レディースファッション バッグ・カバン ボストンバッグ",
  "レディースファッション バッグ・カバン パーティーバッグ",
  "レディースファッション バッグ・カバン エコバッグ",
  "レディースファッション インナー・ルームウェア インナー・ルームウェアその他",
  "レディースファッション インナー・ルームウェア ルームウェア・パジャマ",
  "レディースファッション インナー・ルームウェア ブラジャー",
  "レディースファッション インナー・ルームウェア ショーツ",
  "レディースファッション インナー・ルームウェア ブラジャー＆ショーツ",
  "レディースファッション インナー・ルームウェア スリップ・インナー・キャミ",
  "レディースファッション インナー・ルームウェア スパッツ・レギンス",
  "レディースファッション インナー・ルームウェア タイツ・ソックス",
  "レディースファッション ヨガ・フィットネス ヨガ・フィットネスその他",
  "レディースファッション ヨガ・フィットネス フィットネストップス",
  "レディースファッション ヨガ・フィットネス フィットネスボトムス",
  "レディースファッション ヨガ・フィットネス ヨガマット",
  "レディースファッション ヨガ・フィットネス フィットネスバッグ",
  "レディースファッション ヨガ・フィットネス フィットネスシューズ",
  "レディースファッション ヨガ・フィットネス フィットネスアクセサリー",
  "メンズファッション トップス トップスその他",
  "メンズファッション トップス Tシャツ・カットソー",
  "メンズファッション トップス ポロシャツ",
  "メンズファッション トップス シャツ",
  "メンズファッション トップス パーカー・フーディ",
  "メンズファッション トップス スウェット・トレーナー",
  "メンズファッション トップス ニット・セーター",
  "メンズファッション トップス カーディガン",
  "メンズファッション トップス タンクトップ",
  "メンズファッション トップス ベスト・ジレ",
  "メンズファッション アウター・ジャケット アウターその他",
  "メンズファッション アウター・ジャケット コートその他",
  "メンズファッション アウター・ジャケット ジャケットその他",
  "メンズファッション アウター・ジャケット ダウンジャケット",
  "メンズファッション アウター・ジャケット ブルゾン",
  "メンズファッション アウター・ジャケット レザージャケット",
  "メンズファッション アウター・ジャケット ピーコート",
  "メンズファッション アウター・ジャケット ダッフルコート",
  "メンズファッション アウター・ジャケット トレンチコート",
  "メンズファッション アウター・ジャケット ジャージ",
  "メンズファッション アウター・ジャケット ダウンベスト",
  "メンズファッション アウター・ジャケット テーラードジャケット",
  "メンズファッション ボトムス ボトムスその他",
  "メンズファッション ボトムス パンツ",
  "メンズファッション ボトムス デニム・ジーパン",
  "メンズファッション ボトムス ハーフ・ショートパンツ",
  "メンズファッション その他ファッション",
  "メンズファッション スーツ",
  "メンズファッション 水着・ビーチグッズ 水着・ビーチグッズその他",
  "メンズファッション 水着・ビーチグッズ 水着",
  "メンズファッション 水着・ビーチグッズ ラッシュガード",
  "メンズファッション 水着・ビーチグッズ うきわ",
  "メンズファッション 水着・ビーチグッズ ビーチタオル",
  "メンズファッション セットアップ",
  "メンズファッション 帽子 帽子その他",
  "メンズファッション 帽子 ハット",
  "メンズファッション 帽子 キャップ",
  "メンズファッション 帽子 ストローハット",
  "メンズファッション 帽子 ニットキャップ・ビーニー",
  "メンズファッション 帽子 ベレー帽",
  "メンズファッション 帽子 ハンチング・キャスケット",
  "メンズファッション 帽子 サンバイザー",
  "メンズファッション アクセサリー アクセサリーその他",
  "メンズファッション アクセサリー ピアス",
  "メンズファッション アクセサリー イヤリング",
  "メンズファッション アクセサリー アンクレット",
  "メンズファッション アクセサリー ネックレス・チョーカー",
  "メンズファッション アクセサリー ブレスレット",
  "メンズファッション アクセサリー 指輪・リング",
  "メンズファッション 腕時計 腕時計その他",
  "メンズファッション 腕時計 アナログ時計",
  "メンズファッション 腕時計 デジタル時計",
  "メンズファッション アイウェア アイウェアその他",
  "メンズファッション アイウェア サングラス",
  "メンズファッション アイウェア メガネ",
  "メンズファッション 財布・雑貨 雑貨・その他",
  "メンズファッション 財布・雑貨 長財布",
  "メンズファッション 財布・雑貨 折りたたみ財布",
  "メンズファッション 財布・雑貨 キーケース・キーリング",
  "メンズファッション 財布・雑貨 カードケース・名刺入れ",
  "メンズファッション 財布・雑貨 コインケース・小銭入れ",
  "メンズファッション 財布・雑貨 ステーショナリー",
  "メンズファッション ファッション雑貨・小物 ファッション雑貨・小物その他",
  "メンズファッション ファッション雑貨・小物 マフラー",
  "メンズファッション ファッション雑貨・小物 ストール",
  "メンズファッション ファッション雑貨・小物 手袋",
  "メンズファッション ファッション雑貨・小物 ベルト",
  "メンズファッション ファッション雑貨・小物 ネクタイ",
  "メンズファッション ファッション雑貨・小物 傘・レイングッズ",
  "メンズファッション ファッション雑貨・小物 ハンカチ",
  "メンズファッション ファッション雑貨・小物 靴下・ソックス",
  "メンズファッション スマホケース・テックアクセサリー",
  "メンズファッション 靴・ブーツ・サンダル 靴・ブーツ・サンダルその他",
  "メンズファッション 靴・ブーツ・サンダル スニーカー",
  "メンズファッション 靴・ブーツ・サンダル サンダル",
  "メンズファッション 靴・ブーツ・サンダル ドレスシューズ・革靴・ビジネスシューズ",
  "メンズファッション 靴・ブーツ・サンダル ブーツ",
  "メンズファッション バッグ・カバン バッグ・カバンその他",
  "メンズファッション バッグ・カバン ショルダーバッグ",
  "メンズファッション バッグ・カバン トートバッグ",
  "メンズファッション バッグ・カバン ボストンバッグ",
  "メンズファッション バッグ・カバン バックパック・リュック",
  "メンズファッション バッグ・カバン ビジネスバッグ・アタッシュケース",
  "メンズファッション バッグ・カバン クラッチバッグ",
  "メンズファッション インナー・ルームウェア インナー・ルームウェアその他",
  "メンズファッション インナー・ルームウェア アンダーシャツ・インナー",
  "メンズファッション インナー・ルームウェア トランクス",
  "メンズファッション インナー・ルームウェア ブリーフ",
  "メンズファッション インナー・ルームウェア ボクサーパンツ",
  "メンズファッション インナー・ルームウェア ルームウェア・パジャマ",
  "メンズファッション フィットネス フィットネスその他",
  "メンズファッション フィットネス フィットネストップス",
  "メンズファッション フィットネス フィットネスボトムス",
  "メンズファッション フィットネス フィットネスバッグ",
  "メンズファッション フィットネス フィットネスシューズ",
  "メンズファッション フィットネス フィットネスアクセサリー",
  "ライフスタイル 家具・日用品 家具・日用品その他",
  "ライフスタイル 家具・日用品 家具・収納",
  "ライフスタイル 家具・日用品 照明",
  "ライフスタイル 家具・日用品 バス・ランドリー",
  "ライフスタイル 家具・日用品 洗剤・清掃グッズ",
  "ライフスタイル 家具・日用品 ダストボックス(ゴミ箱)・傘立て",
  "ライフスタイル キッチン・ダイニング キッチン・ダイニングその他",
  "ライフスタイル キッチン・ダイニング 調理器具",
  "ライフスタイル キッチン・ダイニング 食器（皿）",
  "ライフスタイル キッチン・ダイニング コップ・グラス・マグカップ",
  "ライフスタイル キッチン・ダイニング タンブラー",
  "ライフスタイル キッチン・ダイニング カトラリー",
  "ライフスタイル キッチン・ダイニング 容器・ストッカー",
  "ライフスタイル キッチン・ダイニング キッチン雑貨",
  "ライフスタイル キッチン・ダイニング テーブルリネン",
  "ライフスタイル キッチン・ダイニング エプロン",
  "ライフスタイル キッチン・ダイニング キッチン収納",
  "ライフスタイル キッチン・ダイニング 料理本",
  "ライフスタイル インテリア雑貨・DIY インテリア雑貨・DIYその他",
  "ライフスタイル インテリア雑貨・DIY ＤＩＹ・工具",
  "ライフスタイル インテリア雑貨・DIY ポスター・ウォールステッカー",
  "ライフスタイル インテリア雑貨・DIY 壁紙",
  "ライフスタイル インテリア雑貨・DIY タペストリー",
  "ライフスタイル インテリア雑貨・DIY ルームフレグランス",
  "ライフスタイル インテリア雑貨・DIY キャンドル",
  "ライフスタイル インテリア雑貨・DIY 時計",
  "ライフスタイル インテリア雑貨・DIY アート・美術品",
  "ライフスタイル ファブリック ファブリックその他",
  "ライフスタイル ファブリック ベッドカバー・リネン",
  "ライフスタイル ファブリック ブランケット",
  "ライフスタイル ファブリック クッション・クッションカバー",
  "ライフスタイル ファブリック ラグ・マット・カーペット",
  "ライフスタイル ファブリック カーテン",
  "ライフスタイル ファブリック タオル",
  "ライフスタイル トラベルグッズ トラベルその他",
  "ライフスタイル トラベルグッズ スーツケース",
  "ライフスタイル トラベルグッズ バッグ",
  "ライフスタイル トラベルグッズ ラゲッジタグ",
  "ライフスタイル トラベルグッズ パスポートケース・ウォレット",
  "ライフスタイル トラベルグッズ トラベルポーチ",
  "ライフスタイル トラベルグッズ トラベル小物",
  "ライフスタイル レジャー・アウトドア レジャー・アウトドアその他",
  "ライフスタイル レジャー・アウトドア バーベキュー・クッキング用品",
  "ライフスタイル レジャー・アウトドア レジャー・ピクニック用品",
  "ライフスタイル レジャー・アウトドア テーブル・チェア",
  "ライフスタイル レジャー・アウトドア 寝袋・シュラフ",
  "ライフスタイル レジャー・アウトドア テント・タープ",
  "ライフスタイル レジャー・アウトドア オートバイ・自転車",
  "ライフスタイル ペット用品 首輪・ハーネス・リード",
  "ライフスタイル ペット用品 ペットキャリー",
  "ライフスタイル ペット用品 洋服",
  "ライフスタイル ペット用品 ペットベッド・ケージ",
  "ライフスタイル ペット用品 おもちゃ・キャットタワー",
  "ライフスタイル ペット用品 フードボウル・えさ関連",
  "ライフスタイル ペット用品 衛生用品",
  "ライフスタイル ペット用品 ペット用品その他",
  "ライフスタイル ホビー・カルチャー ゲーム",
  "ライフスタイル ホビー・カルチャー キャラクターグッズ",
  "ライフスタイル ホビー・カルチャー 模型・プラモデル・ラジコン",
  "ライフスタイル ホビー・カルチャー カメラ・カメラグッズ",
  "ライフスタイル ホビー・カルチャー AV機器(オーディオ・映像)",
  "ライフスタイル ホビー・カルチャー 楽器・音楽機材",
  "ライフスタイル ホビー・カルチャー 手芸・工芸道具",
  "ライフスタイル ホビー・カルチャー 花・ガーデニング",
  "ライフスタイル ホビー・カルチャー ミュージシャン・タレント・映画グッズ",
  "ライフスタイル ホビー・カルチャー 絵本・書籍",
  "ライフスタイル ホビー・カルチャー CD・DVD",
  "ライフスタイル ホビー・カルチャー 衣装・コスチューム",
  "ライフスタイル ホビー・カルチャー パーティーグッズ",
  "ライフスタイル ホビー・カルチャー ホビー・カルチャーその他",
  "ライフスタイル ステーショナリ・文房具 手帳",
  "ライフスタイル ステーショナリ・文房具 鉛筆・ペン・万年筆",
  "ライフスタイル ステーショナリ・文房具 レターセット・ポストカード",
  "ライフスタイル ステーショナリ・文房具 ノート",
  "ライフスタイル ステーショナリ・文房具 ペンケース",
  "ライフスタイル ステーショナリ・文房具 ステーショナリ・文房具その他",
  "ライフスタイル 電子タバコ スターターキット",
  "ライフスタイル 電子タバコ リキッド",
  "ライフスタイル 電子タバコ アクセサリー",
  "ライフスタイル ライフスタイルその他",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーロンパース・カバーオール",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーワンピース",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用トップス",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用ボトムス",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) べビーアウター",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用靴下、タイツ、ブルマ、スパッツ類",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) よだれかけ・スタイ・ビブ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー肌着・下着",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーパジャマ・ルームウェア・スリーパー",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) おくるみ・ブランケット",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーレインコート・レイングッズ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー水着・ビーチグッズ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用コスチューム・着ぐるみ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用フォーマル・セレモニーウェア",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー帽子・手袋・ファッション小物",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーその他",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズ用トップス",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズ用ボトムス",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズワンピース・オールインワン",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズアウター",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用靴下、タイツ、ブルマ、スパッツ類",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用肌着・下着",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用パジャマ・ルームウェア・スリーパー",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズスポーツウェア",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用レインコート・レイングッズ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用水着・ビーチグッズ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用コスチューム・着ぐるみ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用フォーマル・セレモニーウェア",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用帽子・手袋・ファッション小物",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズその他",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビースニーカー",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーバレエシューズ・フラットシューズ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーサンダル",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーブーツ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーレインブーツ・長靴",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーフォーマルシューズ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーシューズ・靴その他",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズスニーカー",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズバレエシューズ・フラットシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズサンダル",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズブーツ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズレインブーツ・長靴",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズルームシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズフォーマルシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズシューズ・靴その他",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティトップス",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティパンツ・スカート",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティレギンス・タイツ",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティワンピース",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティコート・アウター",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティ下着・肌着",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティパジャマ・ルームウェア",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティ水着・フィットネス・スポーツウェア",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティドレス・フォーマル",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ 母子手帳ケース",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティウェア・授乳服・グッズその他",
  "ベビー・キッズ マザーズバッグ 子供用リュック・バックパック",
  "ベビー・キッズ マザーズバッグ 子供用トート・レッスンバッグ",
  "ベビー・キッズ マザーズバッグ 子供用ショルダー・ポシェット・ボディバッグ",
  "ベビー・キッズ マザーズバッグ キッズバッグ・財布その他",
  "ベビー・キッズ キッズバッグ・財布 子供用リュック・バックパック",
  "ベビー・キッズ キッズバッグ・財布 子供用トート・レッスンバッグ",
  "ベビー・キッズ キッズバッグ・財布 子供用ショルダー・ポシェット・ボディバッグ",
  "ベビー・キッズ キッズバッグ・財布 キッズバッグ・財布その他",
  "ベビー・キッズ ベビーカー",
  "ベビー・キッズ チャイルドシート(ベビー/ジュニア)",
  "ベビー・キッズ 抱っこ紐・スリング・ベビーキャリア",
  "ベビー・キッズ おしゃぶり・授乳・離乳食グッズ",
  "ベビー・キッズ 赤ちゃん用スキンケア",
  "ベビー・キッズ おもちゃ・知育玩具 プレイマット・ベビーマット",
  "ベビー・キッズ おもちゃ・知育玩具 ガラガラ・ラトル",
  "ベビー・キッズ おもちゃ・知育玩具 ぬいぐるみ・フィギュア・ドールハウス",
  "ベビー・キッズ おもちゃ・知育玩具 おままごとセット",
  "ベビー・キッズ おもちゃ・知育玩具 ブロック・パズル・ゲーム",
  "ベビー・キッズ おもちゃ・知育玩具 絵本・ぬり絵・シール",
  "ベビー・キッズ おもちゃ・知育玩具 ミニカー・電車・乗り物おもちゃ",
  "ベビー・キッズ おもちゃ・知育玩具 バストイ・水遊びグッズ",
  "ベビー・キッズ おもちゃ・知育玩具 おもちゃ・知育玩具その他",
  "ベビー・キッズ キッズ・ベビー・マタニティその他",
];
