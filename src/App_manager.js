// rendererとipc通信を行う
const {ipcRenderer} = require('electron')

// デスクトップがあれば選択
ipcRenderer.send('init-manager')

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

// フォルダ選択画面を呼び出し
const selectDirBtn = document.getElementById('select-dir')
selectDirBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-manager')
})
 
// 選択したディレクトリを表示
ipcRenderer.on('selected-directory', (event, path) => {
  global.directory_name = path + "/"
  document.getElementById('selected-folder').innerHTML = `You selected: ${path}`
})

// Manager開始
const StartBtn = document.getElementById('start-manager')
StartBtn.addEventListener('click', (event) => {
  var args_list = {
    "page_setting": document.getElementById("page-choice").set1.value,
    "onoff": document.getElementById('onoff').set2.value,
    "days": document.getElementById('days').value,
    "buyma_account": document.getElementById('buyma-account').value,
    "buyma_dir": global.directory_name,
    "access_prm":document.getElementById('access-prm').value,
    "want_prm":document.getElementById('want-prm').value,
    "cart_prm":document.getElementById('cart-prm').value,
    "price_prm":document.getElementById('price-prm').value,
    "maxprice_prm":document.getElementById('maxprice-prm').value,
    "date_prm":document.getElementById('date-prm').value,
  }

  document.getElementById('logs').innerHTML += "<p>[log]: ページ選択：" + args_list["page_setting"] + "</p>"
  document.getElementById('logs').innerHTML += "<p>[log]: 設定モード：" + args_list["onoff"] + "</p>"
  document.getElementById('logs').innerHTML += "<p>[log]: 出品期間延長日数：" + args_list["days"] + "</p>"
  ipcRenderer.send('start-manager', JSON.stringify(args_list))
})

// ログ画面
ipcRenderer.on('log-create', (event, log_text) => {
  document.getElementById('logs').innerHTML += "<p>[log]: " + log_text + "</p>"
  document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight;
})

// パッディング自動調整
function AutoAdjust() {
  var padding = document.getElementsByClassName('manager-logs')[0]
  padding.style.paddingTop = document.getElementsByTagName('header')[0].offsetHeight
}

AutoAdjust()

