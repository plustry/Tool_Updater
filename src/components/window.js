/**********************************
* ウィンドウ管理用スクリプト
* 
* ウィンドウ作成
* createWindow() -> return BrowserWindow
*
* メニュー画面作成
* initWindowMenu() -> null
**********************************/

// requires
const {app, BrowserWindow, Menu, dialog} = require("electron");
const fs = require("fs");
const path = require("path");
const src_dir = path.dirname(__dirname)
// requires components
const updater = require('./updater.js')

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
  mainWindow.loadFile(path.join(src_dir, "public", "exhibition.html"));
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

  // メインウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function initWindowMenu () {
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
            updater.AutoUpdater();
          },
        },
        {
          label: "強制アップデート",
          click() {
            updater.StartUpdate("Force Update", "Force Update");
          },
        },
        {
          label: "終了",
          click() {
            app.quit();
          },
        },
        {
          label: "BASE自動システム",
          click() {
            mainWindow.loadFile(path.join(src_dir, "public", "base.html"));
          },
        },
        {
          label: "在庫管理システム",
          click() {
            mainWindow.loadFile(
              path.join(src_dir, "public", "stockcheck.html")
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

module.exports = {createWindow}