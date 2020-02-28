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

// ヘルプ項目
var txt1 = {
  "open_dir":"BUYMAディレクトリ",
  "page_choice":"ページ選択",
  "set_mode":"モード設定",
  "buyma_account":"BUYMA アカウント名",
  "days":"出品期限延長日数",
  "access":"アクセス数",
  "want":"お気に入り登録数",
  "cart":"カートに入れてる数",
  "price":"価格を割る数",
  "maxprice":"MAX価格スコア",
  "date":"経過日数を割る数"
}

var txt2 = {
  "open_dir":"BUYMAアカウントディレクトリを選択してください。(BUYMA/account)",
  "page_choice":"Managerを適用するページを選択してください。",
  "set_mode":"商品情報をどのように変更するかを選択してください。",
  "buyma_account":"適用したいアカウント名のディレクトリを指定できます。空の場合はすべてのアカウントに対して実行します。",
  "days":"出品の期限を延長する場合、日数を記入してください。",
  "access":"Managerのパラメーターに、設定した数×アクセス数を加えます。",
  "want":"Managerのパラメーターに、設定した数×お気に入り登録数を加えます。",
  "cart":"Managerのパラメーターに、設定した数×カートに入れてる数を加えます。",
  "price":"Managerのパラメーターに、価格÷設定した数を加えます。",
  "maxprice":"価格÷価格を割る数が大きくなる場合に、上限の閾値を設けます",
  "date":"Managerのパラメーターに、経過日数÷設定した数を引きます。"
}
// ヘルプボタン
function gethelp(key) {
  console.log(key)
  ipcRenderer.send('show-info', "ヘルプ", txt1[key], txt2[key])
}

AutoAdjust()

