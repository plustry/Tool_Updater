// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow, ipcMain, dialog, session, Menu } = require('electron')
const fs = require("fs")
const async = require('async')
const path = require('path')
const getDirName = require("path").dirname
const request = require('request')
const unzip = require("node-unzip-2")
const csvSync = require('csv-parse/lib/sync')
const makeDir = require("make-dir")
const { PythonShell } = require('python-shell')
const Encoding = require('encoding-japanese')
const ProgressBar = require('electron-progressbar')
python_script_dir = path.join(path.dirname(__dirname), 'python_scripts')
// python_script_dir = path.join(path.dirname(__dirname), 'python_scripts_')

// modelsを読み込むために必要
const os_info = process.platform

// .envを読み込むための処理
const ENV_PATH = path.join(path.dirname(__dirname), '.env')
require('dotenv').config({ path: ENV_PATH })

process.env.PYTHONPATH = path.join(path.dirname(__dirname), "scraping")

if (os_info == "win32") {
  python_path = path.join(path.dirname(__dirname), "python_modules", "python.exe")
} else if (os_info == "darwin") {
  python_path = path.join(path.dirname(__dirname), "python_modules", "bin", "python3")
}
console.log(python_path)

// win mac関係なく、HOMEディレクトリのPATHが取れる
dir_home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]
dir_data = require("path").join(dir_home, "Desktop", "BUYMA", "data")
dir_account = require("path").join(dir_home, "Desktop", "BUYMA", "account")
dir_image_conf = path.join(dir_home, "Desktop", "BUYMA", "conf", "image.conf")
dir_scraping_conf = path.join(dir_home, "Desktop", "BUYMA", "conf", "scraping.conf")

global.image_conf_data = {}
global.scraping_conf_data = {}
global.imager_key = ""
global.scraper_key = ""


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
    width: 1350, height: 750,
    // frame: false,
  })

  mainWindow.setMenu(null)

  // メインウィンドウに表示するURLを指定します
  mainWindow.loadFile(path.join(__dirname, 'public', 'exhibition.html'))
  initWindowMenu()

  // デベロッパーツールの起動
  // mainWindow.webContents.openDevTools()

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  })
}

//  初期化が完了した時の処理
app.on('ready', createWindow)

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
// macOSのとき以外はアプリケーションを終了させます
if (process.platform !== 'darwin') {
  app.quit()
}else{
  app.quit()
}
})

// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', () => {
  // メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow()
  }
})

function initWindowMenu(){
  const isMac = process.platform === 'darwin'

  const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'ファイル',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: '編集',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startspeaking' },
            { role: 'stopspeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: '表示',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'ウィンドウ',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    label: 'システム',
    submenu: [
      {
        label: 'アップデート',
        click () { AutoUpdater() }
      },
      {
        label: '強制アップデート',
        click () { StartUpdate("Force Update", "Force Update") }
      },
      {
        label: '終了',
        click () { app.quit() }
      }
    ]
  },
  {
    label: 'リンク',
    submenu: [
      {
        label: 'PLUSELECT Webページ',
        click () { mainWindow.loadURL('https://pluselect.com/') }
      },
      {
        label: 'お問い合わせ',
        click () { mainWindow.loadURL('mailto:pluselect.2019@gmail.com') }
      },
    ]
  }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ページ遷移
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on('change-to-exhibition', (event) => {
  mainWindow.loadFile(path.join(__dirname, 'public', 'exhibition.html'))
})

ipcMain.on('change-to-manager', (event) => {
  mainWindow.loadFile(path.join(__dirname, 'public', 'manager.html'))
})

ipcMain.on('change-to-scraper', (event) => {
  mainWindow.loadFile(path.join(__dirname, 'public', 'scraper.html'))
})

ipcMain.on('change-to-imager', (event) => {
  mainWindow.loadFile(path.join(__dirname, 'public', 'imager.html'))
})

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 自動アップデートモジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
function StartUpdate(current_version, new_version) {
  var progressBar = new ProgressBar({
    closeOnComplete: false,
    text: 'アップデートを実行' + current_version.toString() + "=>" + new_version.toString(),
    detail: '新しいファイルをダウンロードしています...',
    browserWindow: {
      closable: true,
      webPreferences: {
          nodeIntegration: true
      },
      height: 250
    }
  })
  progressBar.on('completed', function() {
    console.info(`completed...`)
    progressBar.title = "Finished"
    progressBar.detail = "重要※アプリを再起動してください！\nアップデートは正常に終了しました " + current_version.toString() + "=>" + new_version.toString()
  })
  console.log(progressBar.detail)
  // ZIPファイルをGithubからダウンロード
  const zip_req = new Promise((resolve, reject)=>{
    request(
      {method: 'GET', url: "https://github.com/plustry/Tool_Updater/archive/master.zip", encoding: null},
      function (error, response, body){
        if(!error && response.statusCode === 200){
            fs.writeFileSync(path.join(__dirname, "..", 'updater.zip'), body, 'binary')
            resolve("pass")
        }
      }
    )
  }).then (response => {
    const zip_req2 = new Promise((resolve, reject)=>{
      // ZIPファイルを解凍
      progressBar.detail = "新しいファイルを展開しています..."
      var stream = fs.createReadStream(path.join(__dirname, "..", 'updater.zip')).pipe(unzip.Extract({path: path.join(__dirname, "..")}))
      stream.on('close', function(){
        resolve("pass")
      })
    }).then(response => {
      // ディレクトリを移動
      try {
        progressBar.detail = "古いファイルを削除しています...\n5分以上経過しても終了しない場合はPCを再起動してもう一度お確かめください。"
        var update_list = fs.readdirSync(path.join(__dirname, "..", 'Tool_Updater-master'))
        console.log(update_list)

        for (let i = 0; i < update_list.length; i++) {
          var update_path = path.join(__dirname, "..", update_list[i])
          // console.log(update_path, fs.statSync(update_path).isDirectory())
          if (fs.statSync(update_path).isDirectory()) {
              deleteFolderRecursive(update_path)
          } else {
              fs.unlinkSync(update_path)
          }
          fs.renameSync(path.join(path.join(__dirname, "..", 'Tool_Updater-master'), update_list[i]), update_path)
        }
        progressBar.detail = "新しいファイルを適用しています..."
        if (os_info == "darwin") {
          fs.chmodSync(path.join(__dirname, "chromedriver", "chromedriver"), 0o777)
        }
        // ZIPファイルを削除
        fs.unlinkSync(path.join(__dirname, "..", 'updater.zip'))
        // 展開ディレクトリを削除
        deleteFolderRecursive(path.join(__dirname, "..", 'Tool_Updater-master'))
        progressBar.detail = "アップデートに成功しました。\nアプリを再起動してください！"
        progressBar.setCompleted()
      } catch (error) {
        var message = error.message
        if(error.message.indexOf("EPERM") != -1) {
          message = "アップデートに失敗しました。ファイルが別の場所で開かれているか、chromedriverがバックグラウンドで動いている可能性があります。https://drive.google.com/file/d/1kfrWoGcz4mhmBkOdb77HixiMHjdm6b08/view"
        } else if (error.massage.indexOf("ENOENT") != -1) {
          message = "アップデートに失敗しました。前回のアップデートが途中で終わった可能性があります。再度「強制アップデート」をお試しください。"  
        }
        progressBar.detail = massage
        progressBar.setCompleted()
      }
    })
  }) 
}

function AutoUpdater(event) {
  // 最新バージョンをGithubから確認
  process.on('unhandledRejection', console.dir)
  const url_req = new Promise((resolve, reject)=>{
    request('https://plustry.github.io/Tool_Updater/versions', function(error, response, body) {
    resolve(body)
    })
  }).then(new_version => {
    console.log(new_version)
    // 保存されたファイルから現在のバージョンを確認
    let current_version = fs.readFileSync(path.join(__dirname, "..", "versions.html"), "utf-8").toString()
    console.log(current_version)
    var detail_txt = ""
    if (new_version == current_version) {
      detail_txt = "アップデートはありませんでした Ver: " + new_version.toString()
      var options_ = {
        type: 'info',
        title: "アップデート終了",
        message: "アップデートは終了しました",
        detail: detail_txt
      }
      dialog.showMessageBox(mainWindow, options_)
    } else {
      StartUpdate(current_version, new_version)
    }
  })
}

function ErrorLog(event, message) {
  var ErrorMessage = ""
  // var ErrorMessage = message
  if(message.indexOf("ModuleNotFoundError") !== -1){
    ErrorMessage += message.substring(message.indexOf("ModuleNotFoundError"))
  }else if(message.indexOf("FileNotFoundError") !== -1){
    ErrorMessage += message.substring(message.indexOf("FileNotFoundError"))
  }else if(message.indexOf("NotFoundError") !== -1){
    ErrorMessage += message.substring(message.indexOf("NotFoundError"))
  }
  if(ErrorMessage){
    // ErrorMessage += "\nエラーが発生しました！アップデートを試してください。\nhttps://docs.google.com/document/d/1wT88HLOaG2011eJn0V5u6gnzYjqLiTcRv6f7xHvvngY/edit#heading=h.k92avs7xmxcx"
    event.sender.send('log-create', ErrorMessage)
  }
}

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 画像加工モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on('init-imager', (event) => {
  // パラメータが存在すれば読み込む
  LoadConf(event, "imager")

  // dataフォルダが存在すれば配下のディレクトリを表示させる
  image_dir_select(event)
})


// フォルダ展開
ipcMain.on('open-file-imager', (event) => { 
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then (folder => {
    if (folder.filePaths[0]) {
      // 選択したフォルダ配下のディレクトリを表示させる
      console.log(folder.filePaths[0])
      image_dir_select(event, folder.filePaths[0])
    }
  })
})

function image_dir_select(event) {
  try {
    fs.statSync(dir_data)
    console.log(dir_data + 'の中のフォルダを開きます。')
    event.sender.send('selected-directory', dir_data)
    // ディレクトリ選択ボタン
    fs.readdir(dir_data, function (err, list) {
      if (err) {
        console.log(err)
      }else {
        var dir_list = []
        for (var i = 0; i < list.length; i++) {
          var dir_check = fs.statSync(path.join(dir_data, list[i])).isDirectory()
          if (dir_check) {
            dir_list.push(list[i])
          }
        }
        event.sender.send('make-dir-button', dir_list)
      }
    })
  } catch (error) {
    console.log(error)
  }
}


// ファイル選択
ipcMain.on('open-file', (event, value) => { 
  console.log(value)
  dialog.showOpenDialog({
    properties: ['openFile'],
  }).then (file => {
    if (file.filePaths[0]) {
      event.sender.send(value, file.filePaths[0])
    }
  })
})

ipcMain.on('start-imager', (event, args_list) => {
  // confを更新する
  args_list = JSON.parse(args_list)
  WriteConf(event, args_list, "imager")

  // 追加要素
  args_list["imager_key"] = imager_key
  args_list["electron_dir"] = __dirname


  let options = {
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ['-u'], // get print results in real-time
    args: JSON.stringify(args_list),
    encoding: "binary"
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"]
  }
  console.log(options)

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell('imager.py', options)

  pyshell.on('message', function (message) {
    message = toString(message)
    // ログイン情報を保存
    if (message === "one time login key ***imager***") {
      imager_key = message
    }else{
      event.sender.send('log-create', message)
    }
    // 作成した画像を表示させる
    if (message.indexOf("image.png") !== -1) {
      var image_path = message.slice(message.indexOf("：") + 1)
      event.sender.send('disp-image', image_path)
    }
  })

  // DEBUG情報などを取得したい場合
  pyshell.on('stderr', function (message) {
    ErrorLog(event, message)
  })

  pyshell.end(function (err,code,signal) {
    if (err) throw err
    // 処理が終了した時に、設定情報を再度反映させる
    LoadConf(event, "imager")
    event.sender.send('log-create', '処理は全て終了しました')
  })
})



function LoadConf(event, which_conf) {
  var dir_conf = ""
  if(which_conf === "imager"){
    dir_conf = dir_image_conf
  }else if(which_conf === "scraper"){
    dir_conf = dir_scraping_conf
  }

  var conf_data = ""
  try {
    conf_data = fs.readFileSync(dir_conf, {encoding: 'utf-8'})
  } catch (error) {
    event.sender.send('log-create', dir_conf + "：こちらにファイルを置くと設定情報が保存されます。")
  }

  if(which_conf === "imager"){
    // image_conf_dataを設定
    try {
      image_conf_data = JSON.parse(conf_data)
      event.sender.send('load-image-conf', conf_data)
    } catch (error) {
      event.sender.send('log-create', "image.confの読み込みに失敗しました。")
    }
  }else if(which_conf === "scraper"){
    // scraping_conf_dataを設定
    try {
      scraping_conf_data = JSON.parse(conf_data)
      event.sender.send('load-scraping-conf', conf_data)
    } catch (error) {
      event.sender.send('log-create', "scraping.confの読み込みに失敗しました。")
    }
  }
}

function WriteConf(event, args_list, which_conf) {
  var dir_conf = ""
  if(which_conf === "imager"){
    dir_conf = dir_image_conf
  }else if(which_conf === "scraper"){
    dir_conf = dir_scraping_conf
  }

  var conf_data = ""
  if(which_conf === "imager"){
    conf_data = image_conf_data
  }else if(which_conf === "scraper"){
    conf_data = scraping_conf_data
  }

  // image_conf_dataのメアドとパスワードを更新
  conf_data["login"] = {}
  conf_data["login"]["email"] = args_list["email"]
  conf_data["login"]["password"] = args_list["password"]

  // spider名を取得
  var spider_name = ""
  if(which_conf === "imager"){
    if(args_list["choiced_dir"].indexOf("_") !== -1){
      spider_name = args_list["choiced_dir"].substring(0, args_list["choiced_dir"].indexOf("_"))
    }
  }else if(which_conf === "scraper"){
    spider_name = args_list["spider_name"]
  }
  
  // 初めて設定するspiderの場合
  if(Object.keys(conf_data).indexOf(spider_name) === -1){
    conf_data[spider_name] = {}
  }

  var imager_conf_list = process.env.imager_conf_list.split(',')
  var scraper_conf_list = process.env.scraper_conf_list.split(',')
  console.log(imager_conf_list)
  console.log(scraper_conf_list)

  var conf_list = {}
  if(which_conf === "imager"){
    // カテゴリとスパイダー名を取得
    var category = ""
    if(args_list["img_new_category"]){
      category = args_list["img_new_category"]
    }else if(args_list["img_category"]){
      category = args_list["img_category"]
    }
    // カテゴリのパラメータを更新
    for (let i = 0; i < imager_conf_list.length; i++) {
      conf_list[imager_conf_list[i]] = args_list[imager_conf_list[i]]
    }
    conf_data[spider_name][category] = conf_list
  }else if(which_conf === "scraper"){
    for (let i = 0; i < scraper_conf_list.length; i++) {
      conf_list[scraper_conf_list[i]] = args_list[scraper_conf_list[i]]
    }
    conf_data[spider_name] = conf_list
  }
  
  // 書き出し
  fs.writeFile(dir_conf, JSON.stringify(conf_data), 'utf8', (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(which_conf + 'のconfファイルを保存しました。');
    }
  })
}


//■■■■■■■■■■■■■■■■■■■■■■■■■■
// スクレイピング モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
ipcMain.on('init-scraper', (event) => {
  try {
    fs.statSync(dir_data)
    console.log('デフォルトフォルダが存在したので開きます。')
    event.sender.send('selected-directory', dir_data)
  } catch (error) {
    console.log(error)
  }

  // パラメータが存在すれば読み込む
  LoadConf(event, "scraper")
})

// フォルダ展開
ipcMain.on('open-file-scraper', (event) => { 
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then (folder => {
    if (folder.filePaths[0]) {
      // 選択したディレクトリを表示
      event.sender.send('selected-directory', folder.filePaths[0])
    }
  })
})

// SQLログイン
ipcMain.on('sql-login', (event, email, password) => {
  console.log(email, password)
  args_list = {
    "email":email,
    "password":password,
  }

  let options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ['-u'],
    args: JSON.stringify(args_list),
    encoding: "binary"
  }

  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"]
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  // console.log(options)
  let pyshell = new PythonShell('login.py', options)

  pyshell.on('message', function (message) {
    message = toString(message)
    // ログイン情報を保存
    if (message == "False") {
      event.sender.send('log-create', '認証に失敗しました')
    }else if (message === "one time login key ***scraper***") {
      scraper_key = message
    }else if (message.indexOf(">>>>>") !== -1){
      event.sender.send('log-create', message)
    }else{
      // datetime&シングルクオテーションがあるとエラーになる
      message = message.replace(/'/g, '"')
      event.sender.send('load-login-data', message)
    }
  })

  pyshell.on('stderr', function (message) {
    ErrorLog(event, message)
  })

  pyshell.end(function (err,code,signal) {
    if (err) throw err;
    event.sender.send('log-create', '認証が終了しました')
  })
})

// スクレイピング開始
ipcMain.on('start-scrapy', (event, args_list) => {
  // 認証チェック
  if(scraper_key !== "one time login key ***scraper***"){
    event.sender.send('log-create', '認証が完了していません。')
    return
  }
  // confを更新する
  args_list = JSON.parse(args_list)
  WriteConf(event, args_list, "scraper")

  let options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ['-u'],
    args: JSON.stringify(args_list),
    encoding: "binary"
  }

  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"]
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  console.log(options)
  let pyshell = new PythonShell('scrapy_start.py', options)

  pyshell.on('message', function (message) {
    message = toString(message)
    event.sender.send('log-create', message)
  })

  pyshell.on('stderr', function (message) {
    ErrorLog(event, message)
  })

  pyshell.end(function (err,code,signal) {
    if (err) throw err
    // 処理が終了した時に、設定情報を再度反映させる
    LoadConf(event, "scraper")
    event.sender.send('log-create', '処理は全て終了しました')
  })
})

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// BUY Manager モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 開いた時にデスクトップにBUYMAフォルダがあれば展開
ipcMain.on('init-manager', (event) => {
  try {
    fs.statSync(dir_account)
    console.log('デフォルトフォルダが存在したので開きます。')
    event.sender.send('selected-directory', dir_account)
  } catch (error) {
    console.log(error)
  }
})

// フォルダ展開
ipcMain.on('open-file-manager', (event) => { 
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then (folder => {
    if (folder.filePaths[0]) {
      // 選択したディレクトリを表示
      event.sender.send('selected-directory', folder.filePaths[0])
    }
  })
})

// BUY Manager実行
ipcMain.on('start-manager', (event, args_list) => {
  args_list = JSON.parse(args_list)
  args_list["electron_dir"] = __dirname
  // console.log(args_list)

  let options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ['-u'], // get print results in real-time
    args: JSON.stringify(args_list),
    encoding: "binary"
  };
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"]
  }
  // console.log(options)

// pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
let pyshell = new PythonShell('BuyManager.py', options)

pyshell.on('message', function (message) {
  message = toString(message)
  // received a message sent from the Python script (a simple "print" statement)
  event.sender.send('log-create', message)
})

  pyshell.end(function (err,code,signal) {
    if (err) throw err;
    event.sender.send('log-create', '処理は全て終了しました')
  })
})

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 自動出品ツール モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
// ユーザーディレクトリ新規作成
ipcMain.on('make-account-dir', (event, user_name) => {
  console.log(user_name)
  if (user_name == "") {
    dialog.showErrorBox("空白ディレクトリ", "新規アカウントディレクトリを作成する場合はアカウント名を入力してください")
  }else{
    dialog.showOpenDialog({
      properties: ['openDirectory'],
    }).then (folder => {
      if (folder.filePaths[0]) {
        makeDir(path.join(folder.filePaths[0], "BUYMA")).then(new_user_dir => {
          //logsディレクトリ作成
        makeDir(path.join(new_user_dir, 'logs'))
          //dataディレクトリ作成
        makeDir(path.join(new_user_dir, 'data'))
          //confディレクトリ作成
        makeDir(path.join(new_user_dir, 'conf')).then(dir_path => {
        var txt_list = ["image.conf", "scraping.conf"]
        for (let i = 0; i < txt_list.length; i++) {
          var conf_path = path.join(dir_path, txt_list[i])
          if(!fs.existsSync(conf_path)){
            fs.writeFile(conf_path , "" , (err) => {
            if(err) throw err;
          })
          }
        }
        })

          //tmp_brandディレクトリ作成
        makeDir(path.join(new_user_dir, 'tmp_brand')).then(dir_path => {
        makeDir(path.join(dir_path, "Saint Laurent")).then(dir_path2 => {
        mkfile(dir_path2)
            
        text_data = "「商品コメント」\n「カテゴリーコメント」\n【SAINT LAURENT】\nサンローランとしても知られるイブサンローランSASは\nイブサンローランと彼のパートナーである\nピエールベルジェによって設立された\nフランスの高級ファッションハウスです。"
        var brand_path = path.join(dir_path2, 'Saint Laurent.txt')
        if(!fs.existsSync(brand_path)){
          fs.writeFile(brand_path, text_data, function(err){
            if(err) throw err;
        })
        }
      })
    })

          //img_contentディレクトリ作成
        makeDir(path.join(new_user_dir, 'img_content')).then(dir_path => {
          console.log(dir_path)
          makeDir(path.join(dir_path, 'background'))
          makeDir(path.join(dir_path, 'effect'))
          makeDir(path.join(dir_path, 'frame'))
          makeDir(path.join(dir_path, 'logo'))
        })

          //accountディレクトリ作成
        makeDir(path.join(new_user_dir, 'account')).then(dir_path => {
          console.log(dir_path)
          makeDir(path.join(dir_path, user_name)).then(dir_path2 => {
            console.log(dir_path2)
            makeDir(path.join(dir_path2, "template")).then(dir_path3 => {
              console.log(dir_path3)
              var txt_list = ["ColorFooter.txt", "ColorHeader.txt", "CommentFooter.txt", "CommentHeader.txt"]
              for (let i = 0; i < txt_list.length; i++) {
                var temp_path = path.join(dir_path3, txt_list[i])
                if(!fs.existsSync(temp_path)){
                  fs.writeFile(temp_path , "" , (err) => {
                  if(err) throw err;
                })
                }
              }
            })
          })
        })
      })
      }
    })
  }
})

//ファイル選択画面-ipc受信
ipcMain.on('open-file-exhibition', (event) => { 
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then (folder => {
    if (folder.filePaths[0]) {
      // 選択したディレクトリを表示
      event.sender.send('selected-directory', folder.filePaths[0])
      var files = fs.readdirSync(folder.filePaths[0])
      var fileList = []
      for (let index = 0; index < files.length; index++) {
        if (files[index].indexOf(".csv") !== -1) {
          fileList.push(files[index])
        }
      // 選択したディレクトリにバックアップがあれば読み込み
        if (files[index].indexOf("access_code.backup") !== -1) {
          event.sender.send('update-accesscode', readTXT(path.join(folder.filePaths[0], files[index])))
        }
      }
    }
    event.sender.send('selected-csv', fileList)
  })
})


//CSV読み込み-ipc受信
ipcMain.on('load-csv', (event, csv_file_name) => {
  const res_data = readCSV(csv_file_name)
  const table_data = ARRAYtoTABLE(res_data)
  event.sender.send('selected-filedata', table_data)
})

//自動出品開始
ipcMain.on('start-exhibition', (event, args_list) => {
  args_list = JSON.parse(args_list)
  args_list["electron_dir"] = __dirname
  cookie = args_list["cookie"]
  dir_path = args_list["dir_path"]

  // アクセスコードのバックアップ
  fs.writeFile(path.join(dir_path, 'access_code.backup'), cookie, (err, data) => {
    if(err) event.sender.send('log-create', err)
    else event.sender.send('log-create', 'maked backup: access code')
  })
  let options = {
    mode: 'text',
    pythonPath: python_path,
    scriptPath: python_script_dir,
    pythonOptions: ['-u'],
    args: JSON.stringify(args_list),
    encoding: "binary"
  }
  // Macのときはエンコーディングする必要がない
  if (os_info == "darwin") {
    delete options["encoding"]
  }

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = new PythonShell('exhibition.py', options)

  pyshell.on('message', function (message) {
    message = toString(message)
    // received a message sent from the Python script (a simple "print" statement)
    event.sender.send('log-create', message)
  })

  // DEBUG情報などを取得したい場合
  pyshell.on('stderr', function (message) {
    ErrorLog(event, message)
  })

  pyshell.end(function (err,code,signal) {
    if (err) throw err;
    event.sender.send('log-create', '出品処理は全て終了しました')
  })
})

//■■■■■■■■■■■■■■■■■■■■■■■■■■
// 共通モジュール
//■■■■■■■■■■■■■■■■■■■■■■■■■■
  // 再帰的にファイルを作成
function fcmkfile(file_path) {
  return new Promise(resolve => {
    fs.mkdir(getDirName(file_path), {recursive: true}, err => {
      if(err) console.log(err)
      fs.writeFile(file_path, "", err => {
      if(err) console.log(err)
      resolve()
      })
    })
  })
}

async function mkfile(dir_path2) {
  for (var i = 0; i < file_list.length; i++) {
      await fcmkfile(path.join(dir_path2, file_list[i]))
  }
  return 'ループ終わった。'
}

// エラー表示用
ipcMain.on('cause-error', (event, txt1, txt2) => {
  dialog.showErrorBox(txt1, txt2)
})

// 情報表示用
ipcMain.on('show-info', (event, title, message, detail) => {
  var options = {
    type: 'info',
    title: title,
    message: message,
    detail: detail
  }
  dialog.showMessageBox(mainWindow, options)
})

// ファイル読み込み用
function readCSV(path) {
  let data = fs.readFileSync(path)
  let res = csvSync(data)
  return res;
}

function readTXT(path) {
  let res = fs.readFileSync(path)
  return res
}

// 文字列を表形式(HTML)に
function ARRAYtoTABLE(res_data) {
  var table_text = '<table rules="all">';
  var data_list = res_data
  var need_list = [0, 1, 2, 4, 8, 18]

  // 項目処理
  for (let i = 0; i < data_list.length; i++) {
    // 見出し処理
    if (i == 0) {
      var start_tag = "<th nowrap>"
      var end_tag = "</th>"
    } else {
      var start_tag = "<td nowrap>"
      var end_tag = "</td>"
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
      from: 'SJIS',
      to: 'UNICODE',
      type: 'string',
    })
  }else if (os_info == "darwin") {
    return bytes
  }
}

// ディレクトリ削除
var deleteFolderRecursive = function(pathe) {
if( fs.existsSync(pathe) ) {
    fs.readdirSync(pathe).forEach(function(file) {
      var curPath = path.join(pathe, file)
        if(fs.statSync(curPath).isDirectory()) {//recurse
            deleteFolderRecursive(curPath)
        } else {//delete file
            fs.unlinkSync(curPath)
        }
    })
    fs.rmdirSync(pathe)
  }
};


file_list = [
path.join("レディースファッション","トップス","トップスその他","comment.txt"),
path.join("レディースファッション","トップス","Tシャツ・カットソー","comment.txt"),
path.join("レディースファッション","トップス","ブラウス・シャツ","comment.txt"),
path.join("レディースファッション","トップス","ニット・セーター","comment.txt"),
path.join("レディースファッション","トップス","スウェット・トレーナー","comment.txt"),
path.join("レディースファッション","トップス","パーカー・フーディ","comment.txt"),
path.join("レディースファッション","トップス","カーディガン","comment.txt"),
path.join("レディースファッション","トップス","アンサンブル","comment.txt"),
path.join("レディースファッション","トップス","ベスト・ジレ","comment.txt"),
path.join("レディースファッション","トップス","ポロシャツ","comment.txt"),
path.join("レディースファッション","トップス","キャミソール","comment.txt"),
path.join("レディースファッション","トップス","タンクトップ","comment.txt"),
path.join("レディースファッション","トップス","チュニック","comment.txt"),
path.join("レディースファッション","ボトムス","ボトムスその他","comment.txt"),
path.join("レディースファッション","ボトムス","スカート","comment.txt"),
path.join("レディースファッション","ボトムス","ミニスカート","comment.txt"),
path.join("レディースファッション","ボトムス","パンツ","comment.txt"),
path.join("レディースファッション","ボトムス","ショートパンツ","comment.txt"),
path.join("レディースファッション","ボトムス","デニム・ジーパン","comment.txt"),
path.join("レディースファッション","ワンピース・オールインワン","ワンピースその他","comment.txt"),
path.join("レディースファッション","ワンピース・オールインワン","ワンピース","comment.txt"),
path.join("レディースファッション","ワンピース・オールインワン","オールインワン・サロペット","comment.txt"),
path.join("レディースファッション","ワンピース・オールインワン","セットアップ","comment.txt"),
path.join("レディースファッション","アウター","アウターその他","comment.txt"),
path.join("レディースファッション","アウター","コート","comment.txt"),
path.join("レディースファッション","アウター","ジャケット","comment.txt"),
path.join("レディースファッション","アウター","ダウンジャケット・コート","comment.txt"),
path.join("レディースファッション","アウター","レザージャケット・コート","comment.txt"),
path.join("レディースファッション","アウター","ムートン・ファーコート","comment.txt"),
path.join("レディースファッション","アウター","ダウンベスト","comment.txt"),
path.join("レディースファッション","アウター","ブルゾン","comment.txt"),
path.join("レディースファッション","アウター","トレンチコート","comment.txt"),
path.join("レディースファッション","アウター","ベスト・ジレ","comment.txt"),
path.join("レディースファッション","アウター","ポンチョ・ケープ","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","パーティー小物その他","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ブライダルその他","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ドレス-ロング","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ドレス-ミニ・ミディアム","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ボレロ・ショール","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ウェディングドレス","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ウェディングアクセサリー","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ウェディングシューズ","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","ブライダル小物","comment.txt"),
path.join("レディースファッション","ブライダル・パーティー","引き出物","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","水着・ビーチグッズその他","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","ビキニ","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","ワンピース水着","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","タンキニ","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","ラッシュガード","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","ボードショーツ・レギンス","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","うきわ","comment.txt"),
path.join("レディースファッション","水着・ビーチグッズ","ビーチタオル","comment.txt"),
path.join("レディースファッション","その他ファッション","その他","comment.txt"),
path.join("レディースファッション","その他ファッション","スーツ","comment.txt"),
path.join("レディースファッション","その他ファッション","コスプレ・衣装","comment.txt"),
path.join("レディースファッション","その他ファッション","浴衣・着物・和装","comment.txt"),
path.join("レディースファッション","帽子","帽子・その他","comment.txt"),
path.join("レディースファッション","帽子","ハット","comment.txt"),
path.join("レディースファッション","帽子","キャップ","comment.txt"),
path.join("レディースファッション","帽子","ストローハット","comment.txt"),
path.join("レディースファッション","帽子","ニットキャップ・ビーニー","comment.txt"),
path.join("レディースファッション","帽子","ベレー帽","comment.txt"),
path.join("レディースファッション","帽子","ハンチング・キャスケット","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","ファッション雑貨・小物その他","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","スカーフ","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","ストール・ショール","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","マフラー","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","手袋","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","イヤーマフ","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","ベルト","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","傘・レイングッズ","comment.txt"),
path.join("レディースファッション","ファッション雑貨・小物","ハンカチ","comment.txt"),
path.join("レディースファッション","財布・小物","財布・小物その他","comment.txt"),
path.join("レディースファッション","財布・小物","長財布","comment.txt"),
path.join("レディースファッション","財布・小物","折りたたみ財布","comment.txt"),
path.join("レディースファッション","財布・小物","コインケース・小銭入れ","comment.txt"),
path.join("レディースファッション","財布・小物","カードケース・名刺入れ","comment.txt"),
path.join("レディースファッション","財布・小物","パスケース","comment.txt"),
path.join("レディースファッション","財布・小物","キーケース","comment.txt"),
path.join("レディースファッション","財布・小物","キーホルダー・キーリング","comment.txt"),
path.join("レディースファッション","財布・小物","ポーチ","comment.txt"),
path.join("レディースファッション","財布・小物","バッグチャーム","comment.txt"),
path.join("レディースファッション","アクセサリー","アクセサリーその他","comment.txt"),
path.join("レディースファッション","アクセサリー","ネックレス・ペンダント","comment.txt"),
path.join("レディースファッション","アクセサリー","ピアス","comment.txt"),
path.join("レディースファッション","アクセサリー","イヤリング","comment.txt"),
path.join("レディースファッション","アクセサリー","指輪・リング","comment.txt"),
path.join("レディースファッション","アクセサリー","ブレスレット","comment.txt"),
path.join("レディースファッション","アクセサリー","アンクレット","comment.txt"),
path.join("レディースファッション","アクセサリー","ヘアアクセサリー","comment.txt"),
path.join("レディースファッション","アクセサリー","パーティーアクセサリー","comment.txt"),
path.join("レディースファッション","アクセサリー","天然石・パワーストーン","comment.txt"),
path.join("レディースファッション","腕時計","アナログ腕時計","comment.txt"),
path.join("レディースファッション","腕時計","デジタル腕時計","comment.txt"),
path.join("レディースファッション","腕時計","腕時計用ベルト・バンド","comment.txt"),
path.join("レディースファッション","腕時計","腕時計その他","comment.txt"),
path.join("レディースファッション","アイウェア","アイウェアその他","comment.txt"),
path.join("レディースファッション","アイウェア","サングラス","comment.txt"),
path.join("レディースファッション","アイウェア","メガネ","comment.txt"),
path.join("レディースファッション","スマホケース・テックアクセサリー","レディース","comment.txt"),
path.join("レディースファッション","靴・シューズ","シューズ・サンダルその他","comment.txt"),
path.join("レディースファッション","靴・シューズ","スニーカー","comment.txt"),
path.join("レディースファッション","靴・シューズ","サンダル・ミュール","comment.txt"),
path.join("レディースファッション","靴・シューズ","スリッポン","comment.txt"),
path.join("レディースファッション","靴・シューズ","パンプス","comment.txt"),
path.join("レディースファッション","靴・シューズ","フラットシューズ","comment.txt"),
path.join("レディースファッション","靴・シューズ","ローファー・オックスフォード","comment.txt"),
path.join("レディースファッション","靴・シューズ","バレエシューズ","comment.txt"),
path.join("レディースファッション","靴・シューズ","パーティーシューズ","comment.txt"),
path.join("レディースファッション","靴・シューズ","レインシューズ","comment.txt"),
path.join("レディースファッション","ブーツ","ブーツその他","comment.txt"),
path.join("レディースファッション","ブーツ","ショートブーツ・ブーティ","comment.txt"),
path.join("レディースファッション","ブーツ","ロングブーツ","comment.txt"),
path.join("レディースファッション","ブーツ","ミドルブーツ","comment.txt"),
path.join("レディースファッション","ブーツ","レインブーツ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","バッグ・カバンその他","comment.txt"),
path.join("レディースファッション","バッグ・カバン","トートバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","ハンドバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","ショルダーバッグ・ポシェット","comment.txt"),
path.join("レディースファッション","バッグ・カバン","バックパック・リュック","comment.txt"),
path.join("レディースファッション","バッグ・カバン","クラッチバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","かごバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","ボストンバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","パーティーバッグ","comment.txt"),
path.join("レディースファッション","バッグ・カバン","エコバッグ","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","インナー・ルームウェアその他","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","ルームウェア・パジャマ","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","ブラジャー","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","ショーツ","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","ブラジャー＆ショーツ","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","スリップ・インナー・キャミ","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","スパッツ・レギンス","comment.txt"),
path.join("レディースファッション","インナー・ルームウェア","タイツ・ソックス","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","ヨガ・フィットネスその他","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","フィットネストップス","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","フィットネスボトムス","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","ヨガマット","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","フィットネスバッグ","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","フィットネスシューズ","comment.txt"),
path.join("レディースファッション","ヨガ・フィットネス","フィットネスアクセサリー","comment.txt"),
path.join("スポーツ","ゴルフ","ゴルフその他","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・トップス","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・ボトムス","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・ワンピース","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・アウター","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・シューズ","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","ゴルフ","レディース・クラブ","comment.txt"),
path.join("スポーツ","ランニング","ランニングその他","comment.txt"),
path.join("スポーツ","ランニング","レディース・トップス","comment.txt"),
path.join("スポーツ","ランニング","レディース・ボトムス","comment.txt"),
path.join("スポーツ","ランニング","レディース・ワンピース","comment.txt"),
path.join("スポーツ","ランニング","レディース・アウター","comment.txt"),
path.join("スポーツ","ランニング","レディース・インナー","comment.txt"),
path.join("スポーツ","ランニング","レディース・シューズ","comment.txt"),
path.join("スポーツ","ランニング","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","アウトドア","アウトドアその他","comment.txt"),
path.join("スポーツ","アウトドア","バッグ","comment.txt"),
path.join("スポーツ","アウトドア","フィッシング用品","comment.txt"),
path.join("スポーツ","アウトドア","キャンプ用品","comment.txt"),
path.join("スポーツ","アウトドア","レディース・トップス","comment.txt"),
path.join("スポーツ","アウトドア","レディース・ボトムス","comment.txt"),
path.join("スポーツ","アウトドア","レディース・アウター","comment.txt"),
path.join("スポーツ","アウトドア","レディース・インナー","comment.txt"),
path.join("スポーツ","アウトドア","レディース・シューズ","comment.txt"),
path.join("スポーツ","アウトドア","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","ウィンタースポーツその他","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","スキー板","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","スノーボード","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","レディース・スノーウェア","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","サーフィン","サーフィンその他","comment.txt"),
path.join("スポーツ","サーフィン","サーフボード","comment.txt"),
path.join("スポーツ","サーフィン","サーフィン","comment.txt"),
path.join("スポーツ","サーフィン","レディース・ラッシュガード","comment.txt"),
path.join("スポーツ","サーフィン","レディース・ウェットスーツ","comment.txt"),
path.join("スポーツ","サーフィン","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","自転車","自転車その他","comment.txt"),
path.join("スポーツ","自転車","自転車本体","comment.txt"),
path.join("スポーツ","自転車","パーツ・アクセサリー","comment.txt"),
path.join("スポーツ","自転車","レディース・トップス","comment.txt"),
path.join("スポーツ","自転車","レディース・ボトムス","comment.txt"),
path.join("スポーツ","自転車","レディース・アウター","comment.txt"),
path.join("スポーツ","自転車","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","ストリートスポーツ","ストリートスポーツその他","comment.txt"),
path.join("スポーツ","ストリートスポーツ","レディース・トップス","comment.txt"),
path.join("スポーツ","ストリートスポーツ","レディース・ボトムス","comment.txt"),
path.join("スポーツ","ストリートスポーツ","レディース・アウター","comment.txt"),
path.join("スポーツ","ストリートスポーツ","レディース・アクセサリー","comment.txt"),
path.join("スポーツ","ストリートスポーツ","レディース・シューズ","comment.txt"),
path.join("スポーツ","ストリートスポーツ","Skateboard","comment.txt"),
path.join("スポーツ","ストリートスポーツ","BMX","comment.txt"),
path.join("スポーツ","スポーツその他","スポーツアイテムその他","comment.txt"),
path.join("スポーツ","スポーツその他","Football","comment.txt"),
path.join("スポーツ","スポーツその他","Tennis","comment.txt"),
path.join("スポーツ","スポーツその他","DVD・CD","comment.txt"),
path.join("ビューティー","ビューティーその他","レディース","comment.txt"),
path.join("ビューティー","メイク小物","メイク小物その他","comment.txt"),
path.join("ビューティー","メイク小物","アイブロウ","comment.txt"),
path.join("ビューティー","メイク小物","ブラシ","comment.txt"),
path.join("ビューティー","メイク小物","鏡","comment.txt"),
path.join("ビューティー","メイク小物","メイクポーチ","comment.txt"),
path.join("ビューティー","メイク小物","レディース","comment.txt"),
path.join("ビューティー","メイクアップ","メイクアップその他","comment.txt"),
path.join("ビューティー","メイクアップ","アイメイク","comment.txt"),
path.join("ビューティー","メイクアップ","アイメイク・アイブロウ","comment.txt"),
path.join("ビューティー","メイクアップ","リップグロス・口紅類","comment.txt"),
path.join("ビューティー","メイクアップ","ファンデーション・コンシーラー","comment.txt"),
path.join("ビューティー","メイクアップ","チーク・フェイスパウダー","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","スキンケア・基礎化粧品その他","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","リップグロス・口紅","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","洗顔・クレンジング","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","化粧水","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","乳液","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","美容液・クリーム","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","パック・フェイスマスク","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","アイケア","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","リップケア","comment.txt"),
path.join("ビューティー","スキンケア・基礎化粧品","スペシャルケア","comment.txt"),
path.join("ビューティー","ヘアケア","ヘアケアその他","comment.txt"),
path.join("ビューティー","ヘアケア","シャンプー・トリートメント","comment.txt"),
path.join("ビューティー","ヘアケア","プライマー・コンシーラー","comment.txt"),
path.join("ビューティー","ヘアケア","ヘアブラシ・アイロン・ドライヤー","comment.txt"),
path.join("ビューティー","ヘアケア","シャンプー・コンディショナー","comment.txt"),
path.join("ビューティー","ヘアケア","ヘアパック・トリートメント","comment.txt"),
path.join("ビューティー","ヘアケア","ヘアオイル・エッセンス","comment.txt"),
path.join("ビューティー","ヘアケア","ヘアブラシ","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","ファンデーション","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","ハンドケア","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","ボディケア","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","日焼け止め・サンケア","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","フットケア","comment.txt"),
path.join("ビューティー","ボディ・ハンド・フットケア","ボディケアその他","comment.txt"),
path.join("ビューティー","ボディ・ハンドケア","レディース","comment.txt"),
path.join("ビューティー","オーラル・デンタルケア","チーク","comment.txt"),
path.join("ビューティー","オーラル・デンタルケア","歯磨き粉","comment.txt"),
path.join("ビューティー","オーラル・デンタルケア","ホワイトニング","comment.txt"),
path.join("ビューティー","オーラル・デンタルケア","オーラル・デンタルケアその他","comment.txt"),
path.join("ビューティー","ネイルグッズ","マニキュア","comment.txt"),
path.join("ビューティー","ネイルグッズ","ジェルネイル","comment.txt"),
path.join("ビューティー","ネイルグッズ","ネイルアート・チップ","comment.txt"),
path.join("ビューティー","ネイルグッズ","ネイルケア","comment.txt"),
path.join("ビューティー","ネイルグッズ","ネイルグッズその他","comment.txt"),
path.join("ビューティー","ネイルグッズ","フェイスパウダー","comment.txt"),
path.join("ビューティー","ネイルケア","レディース","comment.txt"),
path.join("ビューティー","バスグッズ","日焼け止め・サンケア","comment.txt"),
path.join("ビューティー","バスグッズ","レディース","comment.txt"),
path.join("ビューティー","美容家電・グッズ","ヘアアイロン・ドライヤー","comment.txt"),
path.join("ビューティー","美容家電・グッズ","美容家電・グッズその他","comment.txt"),
path.join("ビューティー","香水・フレグランス","メイクアップその他","comment.txt"),
path.join("ビューティー","香水・フレグランス","レディース","comment.txt"),
path.join("ビューティー","アロマ・バスグッズ","アロマグッズ","comment.txt"),
path.join("ビューティー","アロマ・バスグッズ","バスグッズ","comment.txt"),
path.join("ビューティー","アロマ・バスグッズ","アロマ・バスグッズその他","comment.txt"),
path.join("ライフスタイル","ライフスタイルその他","レディース","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","調理器具","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","食器（皿）","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","コップ・グラス・マグカップ","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","タンブラー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","カトラリー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","容器・ストッカー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン雑貨","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","テーブルリネン","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","エプロン","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン収納","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","料理本","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン・ダイニングその他","comment.txt"),
path.join("ライフスタイル","家具・日用品","家具・日用品その他","comment.txt"),
path.join("ライフスタイル","家具・日用品","棚・ラック・収納","comment.txt"),
path.join("ライフスタイル","家具・日用品","照明","comment.txt"),
path.join("ライフスタイル","家具・日用品","バス・ランドリー","comment.txt"),
path.join("ライフスタイル","家具・日用品","洗剤・清掃グッズ","comment.txt"),
path.join("ライフスタイル","家具・日用品","ダストボックス(ゴミ箱)・傘立て","comment.txt"),
path.join("ライフスタイル","家具・日用品","椅子・チェア","comment.txt"),
path.join("ライフスタイル","家具・日用品","机・テーブル","comment.txt"),
path.join("ライフスタイル","家具・日用品","鏡台・ドレッサー","comment.txt"),
path.join("ライフスタイル","家具・日用品","ソファ","comment.txt"),
path.join("ライフスタイル","家具・日用品","オットマン","comment.txt"),
path.join("ライフスタイル","家具・日用品","ベッド","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ＤＩＹ・工具","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ポスター・ウォールステッカー","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","壁紙","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","タペストリー","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ルームフレグランス","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","キャンドル","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","時計","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","アート・美術品","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","インテリア雑貨・DIYその他","comment.txt"),
path.join("ライフスタイル","ファブリック","ベッドカバー・リネン","comment.txt"),
path.join("ライフスタイル","ファブリック","ブランケット","comment.txt"),
path.join("ライフスタイル","ファブリック","クッション・クッションカバー","comment.txt"),
path.join("ライフスタイル","ファブリック","ラグ・マット・カーペット","comment.txt"),
path.join("ライフスタイル","ファブリック","カーテン","comment.txt"),
path.join("ライフスタイル","ファブリック","タオル","comment.txt"),
path.join("ライフスタイル","ファブリック","ファブリックその他","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベルその他","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","スーツケース","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","バッグ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","ラゲッジタグ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","パスポートケース・ウォレット","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベルポーチ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベル小物","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","レジャー・アウトドアその他","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","バーベキュー・クッキング用品","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","レジャー・ピクニック用品","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","テーブル・チェア","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","寝袋・シュラフ","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","テント・タープ","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","オートバイ・自転車","comment.txt"),
path.join("ライフスタイル","ペット用品","ペット用品その他","comment.txt"),
path.join("ライフスタイル","ペット用品","首輪・ハーネス・リード","comment.txt"),
path.join("ライフスタイル","ペット用品","ペットキャリー","comment.txt"),
path.join("ライフスタイル","ペット用品","洋服","comment.txt"),
path.join("ライフスタイル","ペット用品","ペットベッド・ケージ","comment.txt"),
path.join("ライフスタイル","ペット用品","おもちゃ・キャットタワー","comment.txt"),
path.join("ライフスタイル","ペット用品","フードボウル・えさ関連","comment.txt"),
path.join("ライフスタイル","ペット用品","衛生用品","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ホビー・カルチャーその他","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ゲーム","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","キャラクターグッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","模型・プラモデル・ラジコン","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","カメラ・カメラグッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","AV機器(オーディオ・映像)","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","楽器・音楽機材","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","手芸・工芸道具","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","花・ガーデニング","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ミュージシャン・タレント・映画グッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","絵本・書籍","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","CD・DVD","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","衣装・コスチューム","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","パーティーグッズ","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ステーショナリ・文房具その他","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","手帳","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","鉛筆・ペン・万年筆","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","レターセット・ポストカード","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ノート","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ペンケース","comment.txt"),
path.join("ライフスタイル","電子タバコ","スターターキット","comment.txt"),
path.join("ライフスタイル","電子タバコ","リキッド","comment.txt"),
path.join("ライフスタイル","電子タバコ","アクセサリー","comment.txt"),
path.join("メンズファッション","トップス","トップスその他","comment.txt"),
path.join("メンズファッション","トップス","Tシャツ・カットソー","comment.txt"),
path.join("メンズファッション","トップス","ポロシャツ","comment.txt"),
path.join("メンズファッション","トップス","シャツ","comment.txt"),
path.join("メンズファッション","トップス","パーカー・フーディ","comment.txt"),
path.join("メンズファッション","トップス","スウェット・トレーナー","comment.txt"),
path.join("メンズファッション","トップス","ニット・セーター","comment.txt"),
path.join("メンズファッション","トップス","カーディガン","comment.txt"),
path.join("メンズファッション","トップス","タンクトップ","comment.txt"),
path.join("メンズファッション","トップス","ベスト・ジレ","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","アウターその他","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","コートその他","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ジャケットその他","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ダウンジャケット","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ブルゾン","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","レザージャケット","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ピーコート","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ダッフルコート","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","トレンチコート","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ジャージ","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","ダウンベスト","comment.txt"),
path.join("メンズファッション","アウター・ジャケット","テーラードジャケット","comment.txt"),
path.join("メンズファッション","ボトムス","ボトムスその他","comment.txt"),
path.join("メンズファッション","ボトムス","パンツ","comment.txt"),
path.join("メンズファッション","ボトムス","デニム・ジーパン","comment.txt"),
path.join("メンズファッション","ボトムス","ハーフ・ショートパンツ","comment.txt"),
path.join("メンズファッション","その他ファッション","メンズ","comment.txt"),
path.join("メンズファッション","スーツ","メンズ","comment.txt"),
path.join("メンズファッション","水着・ビーチグッズ","水着・ビーチグッズその他","comment.txt"),
path.join("メンズファッション","水着・ビーチグッズ","水着","comment.txt"),
path.join("メンズファッション","水着・ビーチグッズ","ラッシュガード","comment.txt"),
path.join("メンズファッション","水着・ビーチグッズ","うきわ","comment.txt"),
path.join("メンズファッション","水着・ビーチグッズ","ビーチタオル","comment.txt"),
path.join("メンズファッション","セットアップ","メンズ","comment.txt"),
path.join("メンズファッション","セットアプ","メンズ","comment.txt"),
path.join("メンズファッション","帽子","帽子・その他","comment.txt"),
path.join("メンズファッション","帽子","ハット","comment.txt"),
path.join("メンズファッション","帽子","キャップ","comment.txt"),
path.join("メンズファッション","帽子","ストローハット","comment.txt"),
path.join("メンズファッション","帽子","ニットキャップ・ビーニー","comment.txt"),
path.join("メンズファッション","帽子","ベレー帽","comment.txt"),
path.join("メンズファッション","帽子","ハンチング・キャスケット","comment.txt"),
path.join("メンズファッション","帽子","サンバイザー","comment.txt"),
path.join("メンズファッション","アクセサリー","アクセサリーその他","comment.txt"),
path.join("メンズファッション","アクセサリー","ピアス","comment.txt"),
path.join("メンズファッション","アクセサリー","イヤリング","comment.txt"),
path.join("メンズファッション","アクセサリー","アンクレット","comment.txt"),
path.join("メンズファッション","アクセサリー","ネックレス・チョーカー","comment.txt"),
path.join("メンズファッション","アクセサリー","ブレスレット","comment.txt"),
path.join("メンズファッション","アクセサリー","指輪・リング","comment.txt"),
path.join("メンズファッション","腕時計","腕時計その他","comment.txt"),
path.join("メンズファッション","腕時計","アナログ時計","comment.txt"),
path.join("メンズファッション","腕時計","デジタル時計","comment.txt"),
path.join("メンズファッション","アイウェア","アイウェアその他","comment.txt"),
path.join("メンズファッション","アイウェア","サングラス","comment.txt"),
path.join("メンズファッション","アイウェア","メガネ","comment.txt"),
path.join("メンズファッション","財布・雑貨","雑貨・その他","comment.txt"),
path.join("メンズファッション","財布・雑貨","長財布","comment.txt"),
path.join("メンズファッション","財布・雑貨","折りたたみ財布","comment.txt"),
path.join("メンズファッション","財布・雑貨","キーケース・キーリング","comment.txt"),
path.join("メンズファッション","財布・雑貨","カードケース・名刺入れ","comment.txt"),
path.join("メンズファッション","財布・雑貨","コインケース・小銭入れ","comment.txt"),
path.join("メンズファッション","財布・雑貨","ステーショナリー","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","ファッション雑貨・小物その他","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","マフラー","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","ストール","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","手袋","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","ベルト","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","ネクタイ","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","傘・レイングッズ","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","ハンカチ","comment.txt"),
path.join("メンズファッション","ファッション雑貨・小物","靴下・ソックス","comment.txt"),
path.join("メンズファッション","スマホケース・テックアクセサリー","メンズ","comment.txt"),
path.join("メンズファッション","靴・ブーツ・サンダル","靴・ブーツ・サンダルその他","comment.txt"),
path.join("メンズファッション","靴・ブーツ・サンダル","スニーカー","comment.txt"),
path.join("メンズファッション","靴・ブーツ・サンダル","サンダル","comment.txt"),
path.join("メンズファッション","靴・ブーツ・サンダル","ドレスシューズ・革靴・ビジネスシューズ","comment.txt"),
path.join("メンズファッション","靴・ブーツ・サンダル","ブーツ","comment.txt"),
path.join("メンズファッション","バッグ・カバン","バッグ・カバンその他","comment.txt"),
path.join("メンズファッション","バッグ・カバン","ショルダーバッグ","comment.txt"),
path.join("メンズファッション","バッグ・カバン","トートバッグ","comment.txt"),
path.join("メンズファッション","バッグ・カバン","ボストンバッグ","comment.txt"),
path.join("メンズファッション","バッグ・カバン","バックパック・リュック","comment.txt"),
path.join("メンズファッション","バッグ・カバン","ビジネスバッグ・アタッシュケース","comment.txt"),
path.join("メンズファッション","バッグ・カバン","クラッチバッグ","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","インナー・ルームウェアその他","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","アンダーシャツ・インナー","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","トランクス","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","ブリーフ","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","ボクサーパンツ","comment.txt"),
path.join("メンズファッション","インナー・ルームウェア","ルームウェア・パジャマ","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネスその他","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネストップス","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネスボトムス","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネスバッグ","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネスシューズ","comment.txt"),
path.join("メンズファッション","フィットネス","フィットネスアクセサリー","comment.txt"),
path.join("ビューティー","メンズビューティー","メンズビューティーその他","comment.txt"),
path.join("ビューティー","メンズビューティー","ボディケア","comment.txt"),
path.join("ビューティー","メンズビューティー","スキンケア","comment.txt"),
path.join("ビューティー","メンズビューティー","ヘアケア","comment.txt"),
path.join("ビューティー","メンズビューティー","シェービング・グルーミング","comment.txt"),
path.join("ビューティー","メンズビューティー","フレグランス","comment.txt"),
path.join("スポーツ","ゴルフ","ゴルフその他","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・トップス","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・ボトムス","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・アウター","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・シューズ","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","ゴルフ","メンズ・クラブ","comment.txt"),
path.join("スポーツ","ランニング","ランニングその他","comment.txt"),
path.join("スポーツ","ランニング","メンズ・トップス","comment.txt"),
path.join("スポーツ","ランニング","メンズ・ボトムス","comment.txt"),
path.join("スポーツ","ランニング","メンズ・アウター","comment.txt"),
path.join("スポーツ","ランニング","メンズ・インナー","comment.txt"),
path.join("スポーツ","ランニング","メンズ・シューズ","comment.txt"),
path.join("スポーツ","ランニング","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","アウトドア","バッグ","comment.txt"),
path.join("スポーツ","アウトドア","フィッシング用品","comment.txt"),
path.join("スポーツ","アウトドア","キャンプ用品","comment.txt"),
path.join("スポーツ","アウトドア","アウトドアその他","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・トップス","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・ボトムス","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・アウター","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・インナー","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・シューズ","comment.txt"),
path.join("スポーツ","アウトドア","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","メンズ・スノーウェア","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","スキー板","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","スノーボード","comment.txt"),
path.join("スポーツ","ウィンタースポーツ","ウィンタースポーツその他","comment.txt"),
path.join("スポーツ","サーフィン","サーフィンその他","comment.txt"),
path.join("スポーツ","サーフィン","メンズ・ラッシュガード","comment.txt"),
path.join("スポーツ","サーフィン","メンズ・ウェットスーツ","comment.txt"),
path.join("スポーツ","サーフィン","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","サーフィン","サーフボード","comment.txt"),
path.join("スポーツ","サーフィン","サーフィン","comment.txt"),
path.join("スポーツ","自転車","自転車その他","comment.txt"),
path.join("スポーツ","自転車","メンズ・トップス","comment.txt"),
path.join("スポーツ","自転車","メンズ・ボトムス","comment.txt"),
path.join("スポーツ","自転車","メンズ・アウター","comment.txt"),
path.join("スポーツ","自転車","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","自転車","自転車本体","comment.txt"),
path.join("スポーツ","自転車","パーツ・アクセサリー","comment.txt"),
path.join("スポーツ","ストリートスポーツ","ストリートスポーツその他","comment.txt"),
path.join("スポーツ","ストリートスポーツ","メンズ・トップス","comment.txt"),
path.join("スポーツ","ストリートスポーツ","メンズ・ボトムス","comment.txt"),
path.join("スポーツ","ストリートスポーツ","メンズ・アウター","comment.txt"),
path.join("スポーツ","ストリートスポーツ","メンズ・アクセサリー","comment.txt"),
path.join("スポーツ","ストリートスポーツ","Skateboard","comment.txt"),
path.join("スポーツ","ストリートスポーツ","BMX","comment.txt"),
path.join("スポーツ","スポーツその他","Football","comment.txt"),
path.join("スポーツ","スポーツその他","Tennis","comment.txt"),
path.join("スポーツ","スポーツその他","DVD・CD","comment.txt"),
path.join("スポーツ","スポーツその他","スポーツアイテムその他","comment.txt"),
path.join("スポーツ","ストリートスポーツ","メンズ・シューズ","comment.txt"),
path.join("ライフスタイル","家具・日用品","家具・日用品その他","comment.txt"),
path.join("ライフスタイル","家具・日用品","家具・収納","comment.txt"),
path.join("ライフスタイル","家具・日用品","照明","comment.txt"),
path.join("ライフスタイル","家具・日用品","バス・ランドリー","comment.txt"),
path.join("ライフスタイル","家具・日用品","洗剤・清掃グッズ","comment.txt"),
path.join("ライフスタイル","家具・日用品","ダストボックス(ゴミ箱)・傘立て","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン・ダイニングその他","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","調理器具","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","食器（皿）","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","コップ・グラス・マグカップ","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","タンブラー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","カトラリー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","容器・ストッカー","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン雑貨","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","テーブルリネン","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","エプロン","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","キッチン収納","comment.txt"),
path.join("ライフスタイル","キッチン・ダイニング","料理本","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","インテリア雑貨・DIYその他","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ＤＩＹ・工具","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ポスター・ウォールステッカー","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","壁紙","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","タペストリー","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","ルームフレグランス","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","キャンドル","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","時計","comment.txt"),
path.join("ライフスタイル","インテリア雑貨・DIY","アート・美術品","comment.txt"),
path.join("ライフスタイル","ファブリック","ファブリックその他","comment.txt"),
path.join("ライフスタイル","ファブリック","ベッドカバー・リネン","comment.txt"),
path.join("ライフスタイル","ファブリック","ブランケット","comment.txt"),
path.join("ライフスタイル","ファブリック","クッション・クッションカバー","comment.txt"),
path.join("ライフスタイル","ファブリック","ラグ・マット・カーペット","comment.txt"),
path.join("ライフスタイル","ファブリック","カーテン","comment.txt"),
path.join("ライフスタイル","ファブリック","タオル","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベルその他","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","スーツケース","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","バッグ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","ラゲッジタグ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","パスポートケース・ウォレット","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベルポーチ","comment.txt"),
path.join("ライフスタイル","トラベルグッズ","トラベル小物","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","レジャー・アウトドアその他","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","バーベキュー・クッキング用品","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","レジャー・ピクニック用品","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","テーブル・チェア","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","寝袋・シュラフ","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","テント・タープ","comment.txt"),
path.join("ライフスタイル","レジャー・アウトドア","オートバイ・自転車","comment.txt"),
path.join("ライフスタイル","ペット用品","首輪・ハーネス・リード","comment.txt"),
path.join("ライフスタイル","ペット用品","ペットキャリー","comment.txt"),
path.join("ライフスタイル","ペット用品","洋服","comment.txt"),
path.join("ライフスタイル","ペット用品","ペットベッド・ケージ","comment.txt"),
path.join("ライフスタイル","ペット用品","おもちゃ・キャットタワー","comment.txt"),
path.join("ライフスタイル","ペット用品","フードボウル・えさ関連","comment.txt"),
path.join("ライフスタイル","ペット用品","衛生用品","comment.txt"),
path.join("ライフスタイル","ペット用品","ペット用品その他","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ゲーム","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","キャラクターグッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","模型・プラモデル・ラジコン","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","カメラ・カメラグッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","AV機器(オーディオ・映像)","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","楽器・音楽機材","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","手芸・工芸道具","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","花・ガーデニング","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ミュージシャン・タレント・映画グッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","絵本・書籍","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","CD・DVD","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","衣装・コスチューム","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","パーティーグッズ","comment.txt"),
path.join("ライフスタイル","ホビー・カルチャー","ホビー・カルチャーその他","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","手帳","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","鉛筆・ペン・万年筆","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","レターセット・ポストカード","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ノート","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ペンケース","comment.txt"),
path.join("ライフスタイル","ステーショナリ・文房具","ステーショナリ・文房具その他","comment.txt"),
path.join("ライフスタイル","電子タバコ","スターターキット","comment.txt"),
path.join("ライフスタイル","電子タバコ","リキッド","comment.txt"),
path.join("ライフスタイル","電子タバコ","アクセサリー","comment.txt"),
path.join("ライフスタイル","ライフスタイルその他","メンズ","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビーロンパース・カバーオール","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビーワンピース","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー用トップス","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー用ボトムス","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","べビーアウター","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー用靴下、タイツ、ブルマ、スパッツ類","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","よだれかけ・スタイ・ビブ","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー肌着・下着","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビーパジャマ・ルームウェア・スリーパー","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","おくるみ・ブランケット","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビーレインコート・レイングッズ","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー水着・ビーチグッズ","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー用コスチューム・着ぐるみ","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー用フォーマル・セレモニーウェア","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビー帽子・手袋・ファッション小物","comment.txt"),
path.join("ベビー・キッズ","ベビー服・ファッション用品(～90cm)","ベビーその他","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズ用トップス","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズ用ボトムス","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズワンピース・オールインワン","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズアウター","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用靴下、タイツ、ブルマ、スパッツ類","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用肌着・下着","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用パジャマ・ルームウェア・スリーパー","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズスポーツウェア","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用レインコート・レイングッズ","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用水着・ビーチグッズ","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用コスチューム・着ぐるみ","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用フォーマル・セレモニーウェア","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","子供用帽子・手袋・ファッション小物","comment.txt"),
path.join("ベビー・キッズ","子供服・ファッション用品(85cm～)","キッズその他","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビースニーカー","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーバレエシューズ・フラットシューズ","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーサンダル","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーブーツ","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーレインブーツ・長靴","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーフォーマルシューズ","comment.txt"),
path.join("ベビー・キッズ","ベビーシューズ・靴(～14cm)","ベビーシューズ・靴その他","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズスニーカー","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズバレエシューズ・フラットシューズ","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズサンダル","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズブーツ","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズレインブーツ・長靴","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズルームシューズ","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズフォーマルシューズ","comment.txt"),
path.join("ベビー・キッズ","キッズシューズ・子供靴(14.5cm～)","キッズシューズ・靴その他","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティトップス","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティパンツ・スカート","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティレギンス・タイツ","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティワンピース","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティコート・アウター","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティ下着・肌着","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティパジャマ・ルームウェア","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティ水着・フィットネス・スポーツウェア","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティドレス・フォーマル","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","母子手帳ケース","comment.txt"),
path.join("ベビー・キッズ","マタニティウェア・授乳服・グッズ","マタニティウェア・授乳服・グッズその他","comment.txt"),
path.join("ベビー・キッズ","マザーズバッグ","子供用リュック・バックパック","comment.txt"),
path.join("ベビー・キッズ","マザーズバッグ","子供用トート・レッスンバッグ","comment.txt"),
path.join("ベビー・キッズ","マザーズバッグ","子供用ショルダー・ポシェット・ボディバッグ","comment.txt"),
path.join("ベビー・キッズ","マザーズバッグ","キッズバッグ・財布その他","comment.txt"),
path.join("ベビー・キッズ","キッズバッグ・財布","子供用リュック・バックパック","comment.txt"),
path.join("ベビー・キッズ","キッズバッグ・財布","子供用トート・レッスンバッグ","comment.txt"),
path.join("ベビー・キッズ","キッズバッグ・財布","子供用ショルダー・ポシェット・ボディバッグ","comment.txt"),
path.join("ベビー・キッズ","キッズバッグ・財布","キッズバッグ・財布その他","comment.txt"),
path.join("ベビー・キッズ","ベビーカー","ベビー","comment.txt"),
path.join("ベビー・キッズ","チャイルドシート(ベビー","ジュニア)","ベビー","comment.txt"),
path.join("ベビー・キッズ","抱っこ紐・スリング・ベビーキャリア","ベビー","comment.txt"),
path.join("ベビー・キッズ","おしゃぶり・授乳・離乳食グッズ","ベビー","comment.txt"),
path.join("ベビー・キッズ","赤ちゃん用スキンケア","ベビー","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","プレイマット・ベビーマット","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","ガラガラ・ラトル","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","ぬいぐるみ・フィギュア・ドールハウス","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","おままごとセット","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","ブロック・パズル・ゲーム","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","絵本・ぬり絵・シール","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","ミニカー・電車・乗り物おもちゃ","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","バストイ・水遊びグッズ","comment.txt"),
path.join("ベビー・キッズ","おもちゃ・知育玩具","おもちゃ・知育玩具その他","comment.txt"),
path.join("ベビー・キッズ","キッズ・ベビー・マタニティその他","ベビー","comment.txt"),
]