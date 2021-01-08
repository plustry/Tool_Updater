// requires
const {app, ipcMain} = require("electron");
const path = require("path");

// Components modules
const WindowComponents = require('./components/window.js')
const BaseComponents = require('./components/base.js')
const ImagerComponents = require('./components/imager.js')
const ScraperComponents = require('./components/scraper.js')
const CommonCompnents = require('./components/common.js')
const ExhibitionComponents = require('./components/exhibition.js')
const ManagerComponents = require('./components/manager.js')
const StockComponents = require('./components/stock.js')

// win mac関係なく、BUYMAディレクトリのPATHが取れる
dir_home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
dir_buyma = path.join(dir_home, "Desktop", "BUYMA");
dir_account = path.join(dir_buyma, "account")
dir_data = path.join(dir_buyma, "data");
dir_image_conf = path.join(dir_buyma, "conf", "image.conf");
dir_manager_conf = path.join(dir_buyma, "conf", "manager.conf");
dir_scraping_conf = path.join(dir_buyma, "conf", "scraping.conf");
dir_base_conf = path.join(dir_buyma, "conf", "base.conf");

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ウィンドウ初期化処理
//■■■■■■■■■■■■■■■■■■■■■■■■■■
//  初期化が完了した時の処理
app.on("ready", () => {
  mainWindow = WindowComponents.createWindow();
});

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
    mainWindow = WindowComponents.createWindow();
  }
});

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


BaseComponents.IPCInitialize()
ImagerComponents.IPCInitialize()
ScraperComponents.IPCInitialize()
CommonCompnents.IPCInitialize()
ExhibitionComponents.IPCInitialize()
ManagerComponents.IPCInitialize()
StockComponents.IPCInitialize()