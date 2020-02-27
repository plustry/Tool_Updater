// rendererとipc通信を行う
const {ipcRenderer} = require('electron')
const path = require('path');

// 動的に作成したボタンから呼び出してCSV読みこみ
global.csv_name = ""
function load_csv(csv_file_name) {
  ipcRenderer.send('load-csv', global.directory_name + csv_file_name)
  global.csv_name = csv_file_name
}

// 全てリセット
function reset_all() {
  document.getElementById('selected-folder').innerHTML = 'フォルダが選択されていません'
  document.getElementById('text-data').innerHTML = ''
  document.getElementById('csv-list').innerHTML = ''
}

// ページ遷移
const ChangeToExhibitionBtn = document.getElementById('exhibition')
ChangeToExhibitionBtn.addEventListener('click', (event) => {
  ipcRenderer.send('change-to-exhibition')
})
const ChangeToManagerBtn = document.getElementById('buymanager')
ChangeToManagerBtn.addEventListener('click', (event) => {
  ipcRenderer.send('change-to-manager')
})
const ChangeToScraperBtn = document.getElementById('scraper')
ChangeToScraperBtn.addEventListener('click', (event) => {
  ipcRenderer.send('change-to-scraper')
})
const ChangeToImagerBtn = document.getElementById('imager')
ChangeToImagerBtn.addEventListener('click', (event) => {
  ipcRenderer.send('change-to-imager')
})

// ストップ
// function stop() {
//   console.log('stop')
//   ipcRenderer.removeAllListeners('start')
// }

// アカウントディレクトリ新規作成
const makeDirBtn = document.getElementById('make-account-dir')
makeDirBtn.addEventListener('click', (event) => {
  var user_dir = document.getElementById('user-dir').value
  ipcRenderer.send('make-account-dir', user_dir)
})

// フォルダ選択画面を呼び出し
const selectDirBtn = document.getElementById('select-dir')
selectDirBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-exhibition')
})

// ログ画面
ipcRenderer.on('log-create', (event, log_text) => {
  document.getElementById('logs').innerHTML += "<p>[log]: " + log_text + "</p>"
  document.getElementById('footer').scrollTop = document.getElementById('footer').scrollHeight;
})

// 自動出品開始
const StartBtn = document.getElementById('start-exhibition')
StartBtn.addEventListener('click', (event) => {
  // var mail = document.getElementById('mail').value
  var args_list = {
    "day_score": document.getElementById('day-score').value,
    "hour_score": document.getElementById('hour-score').value,
    "cookie": document.getElementById('access-code').value,
    "dir_path": global.directory_name,
    "csv_name": global.csv_name,
    "url_memo": document.getElementById('url_memo').value
  }
  ipcRenderer.send('start-exhibition',JSON.stringify(args_list))
})

// 選択したディレクトリを表示
ipcRenderer.on('selected-directory', (event, pathe) => {
  global.directory_name = path.join(pathe, "/")
  document.getElementById('selected-folder').innerHTML = `You selected: ${pathe}`
})

// 選択したディレクトリに保存されたアクセスコードを表示
ipcRenderer.on('update-accesscode', (event, code) => {
  document.getElementById('access-code').value = code
})

// 選択したcsvをボタンで表示
ipcRenderer.on('selected-csv', (event, text_data) => {
  document.getElementById('csv-list').innerHTML = `${text_data}`
})

// csvファイルの内容を表示
ipcRenderer.on('selected-filedata', (event, text_data) => {
  // ボタン分高さが変わるので自動調整
  AutoAdjust()
  document.getElementById('text-data').innerHTML = `${text_data}`
})

// パッディング自動調整
function AutoAdjust() {
  var padding = document.getElementsByClassName('csv-table')[0]
  padding.style.paddingTop = document.getElementsByTagName('header')[0].offsetHeight
  padding.style.paddingBottom = document.getElementsByTagName('footer')[0].offsetHeight
}

AutoAdjust()