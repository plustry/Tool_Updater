// rendererとipc通信を行う
const {ipcRenderer} = require('electron')

// 設定項目をすべて満たしているかどうか
global.checker1 = false
global.checker2 = false

// デフォルトフォルダを読み込む
ipcRenderer.send('init-scraper')

// 設定データがあれば読み込み
ipcRenderer.on('load-scraping-conf', (event, dic_list) => {
  console.log(dic_list)
  global.scraping_conf = JSON.parse(dic_list)
  var email = scraping_conf["login"]["email"]
  var password = scraping_conf["login"]["password"]
  if(email && password){
    document.getElementById('email').value = email
    document.getElementById('password').value = password
    ipcRenderer.send('sql-login', email, password)
    checker1 = true
  }
})

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
  ipcRenderer.send('open-file-scraper')
})

// 選択したディレクトリを表示
ipcRenderer.on('selected-directory', (event, path) => {
  global.directory_name = path
  document.getElementById('selected-folder').innerHTML = `You selected: ${path}`
})

// SQL認証
const SqlLoginBtn = document.getElementById('sql-login')
SqlLoginBtn.addEventListener('click', (event) => {
  var email = document.getElementById('email').value
  var password = document.getElementById('password').value
  ipcRenderer.send('sql-login', email, password)
  checker1 = true
})

// login情報を元に画面編集
ipcRenderer.on('arg-json', (event, message) => {
  arg_json = JSON.parse(message)  
  // load_shopやstart-scrapyで使用するためグローバル関数にする
  global.user_shops = arg_json["user_shops"]
  global.shops = arg_json["shops"]
  global.crawl_limit = arg_json["crawl_limit"]
  button_list = ""
  for (let i = 0; i < user_shops.length; i++) {
    for (let j = 0; j < shops.length; j++) {
      if(shops[j]["id"] ==  user_shops[i]["shop_id"]){
        shop_name = shops[j]["shop"]
        shop_id = shops[j]["id"]
        button_list += "<button onclick=load_shop(" + shop_id + ")>" + shop_name + "</button>"
      }
    }
  }
  // ショップごとのボタン作成 配列の取得
  document.getElementById('shop-list').innerHTML = button_list
  document.getElementById('sql-login-status').innerHTML = '<font color="green">認証しました</font>'
  document.getElementById('start-status').innerHTML = '<a id="start-status"><font color="red">ショップが選択されていません</font></a>'
  // ボタンができるのでその分調整
  AutoAdjust()
})

// ショップボタンを押した際にデフォルト値をロード
function load_shop(shop_id) {
  // start-scrapyで使用するためグローバル関数にする
  // shop_idで検索をする
  for(var i = 0; i < shops.length; i++){
    if(shops[i]["id"] == shop_id){
      // start-scrapyで使用するためグローバル関数にする
      global.shop_info = shops[i]
    }
  }
  // shop_idで検索をする
  for(var i = 0; i < user_shops.length; i++){
    if(user_shops[i]["shop_id"] == shop_id){
      // start-scrapyで使用するためグローバル関数にする
      global.user_shop_info = user_shops[i]
    }
  }
  keys_list = Object.keys(user_shop_info)
  values_list = Object.values(user_shop_info)
  // 0,1,2はid,user_id,shop_id
  
  for (let i = 3; i < Object.keys(user_shop_info).length; i++) {
    if(values_list[i]){
try{
      document.getElementById(keys_list[i]).value = values_list[i]
    }catch (error) {
      console.log(error);
    }
    }
  }

  document.getElementById('start-status').innerHTML = 
    '<a id="start-status"><font color="green">設定が完了しました。(' + shop_info["shop"] + ')</font></a>'
  checker2 = true
}

// スクレイピング開始
const StartBtn = document.getElementById('start-scrapy')
StartBtn.addEventListener('click', (event) => {
  if (!checker1){
    ipcRenderer.send('cause-error', '未設定項目', '認証を行ってください')
  }else if (!checker2){
    ipcRenderer.send('cause-error', '未設定項目', 'ショップを選択してください')
  }else if (document.getElementById('sex').value == ""){
    ipcRenderer.send('cause-error', '未設定項目', '性別は必須設定項目です')
  }else if (document.getElementById('csv_prm').value == ""){
    ipcRenderer.send('cause-error', '未設定項目', 'CSVパラメータは必須設定項目です。CSVは "ショップ名_パラメータ_日付.csv" という名前で保存されます。フォルダの重複を避けるため入力してください')
  }else{
    var args_list = {
      "src_dir": __dirname,
      "crawler_or_spidercls": shop_info["spider"], 
      "user_id": user_shop_info['user_id'],
      "shop_id": user_shop_info['shop_id'],
      "user_shop_id": user_shop_info['user_shop_id'],
      "limit": crawl_limit["scraping"],
      "dir_path": directory_name,
      "email": document.getElementById('email').value,
      "password": document.getElementById('password').value,
    }
    // edit_nameからは既に同じ名前でDBから取得できているので、キーを使い回して取得します   
    keys_list = ["start_urls","sex","currency","max_page", "csv_prm","edit_name","max_price","vatoff_late","vip_late","delivery_price","profit_late","duty_pattern","size_variation","buyplace","sendplace","buyma_shop","tag","thema","season","delivery","deadline","stock","memo","get_one"]
    for (let i = 0; i < keys_list.length; i++) {
      try {
        args_list[keys_list[i]] = document.getElementById(keys_list[i]).value
      } catch (error) {
       console.log(error) 
      }
    }
    ipcRenderer.send('cause-error', '商品リストの取得を開始しました', 'アプリを閉じると取得を終了します。\n取得可能商品数はこちらです：' + args_list['limit'] + '\n取得ショップ：' + args_list['crawler_or_spidercls'])
    ipcRenderer.send('start-scrapy', JSON.stringify(args_list))
  }
})
// ログ画面
ipcRenderer.on('log-create', (event, log_text) => {
  document.getElementById('logs').innerHTML += "<p>[log]: " + String(log_text) + "</p>"
  document.getElementById('footer').scrollTop = document.getElementById('footer').scrollHeight;
})

// 最後に動的にパッディングする
function AutoAdjust() {
  var padding = document.getElementsByClassName('shop-setting')[0]
  padding.style.paddingTop = document.getElementsByTagName('header')[0].offsetHeight
  padding.style.paddingBottom = document.getElementsByTagName('footer')[0].offsetHeight
}

AutoAdjust()


