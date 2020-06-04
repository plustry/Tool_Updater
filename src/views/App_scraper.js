// rendererとipc通信を行う
const {ipcRenderer} = require('electron')

// 設定項目をすべて満たしているかどうか
global.checker1 = false
global.checker2 = false
global.scraping_conf = ""

// デフォルトフォルダを読み込む
ipcRenderer.send('init-scraper')

// 設定データがあれば読み込み
ipcRenderer.on('load-scraping-conf', (event, dic_list) => {
  // console.log(dic_list)
  scraping_conf = JSON.parse(dic_list)
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
  global.user_shop_dict = arg_json["user_shop_dict"]
  global.crawl_limit = arg_json["crawl_limit"]
  global.user_id = arg_json["user_id"]
  // console.log(user_shop_dict)

  // ユーザーの登録しているショップ情報を取得して、ドロップダウンをページに反映
  button_list = "<select onchange=load_shop(this)><option value=-1>ショップを選択してください</option>"
  keys_list = Object.keys(user_shop_dict)
  for (let i = 0; i < keys_list.length; i++) {
    spider_name = keys_list[i]
    shop_name = user_shop_dict[spider_name]["shop"]
    console.log(spider_name, shop_name)
    button_list += "<option value=" + spider_name + ">" + shop_name + "</option>"
  }
  button_list += "</select>"

  // ショップごとのボタン作成 配列の取得
  document.getElementById('shop-list').innerHTML = button_list
  document.getElementById('sql-login-status').innerHTML = '<font color="green">認証しました</font>'
  document.getElementById('start-status').innerHTML = '<a id="start-status"><font color="red">ショップが選択されていません</font></a>'
  // ボタンができるのでその分調整
  AutoAdjust()
})

// ショップボタンを押した際にデフォルト値をロード
function load_shop(obj) {
  global.crawler_or_spidercls = obj.options[obj.selectedIndex].value
  console.log(crawler_or_spidercls);
  // ショップが選択されていない場合はreturn
  if (crawler_or_spidercls == -1) {
    return
  }
  // GUIにconfデータを反映
  var spider_data = ""
  if(scraping_conf){
    var spider_data = scraping_conf[crawler_or_spidercls]
  }
  if(spider_data){
    keys_list = Object.keys(spider_data)
    for (let i = 0; i < keys_list.length; i++) {
      let key = keys_list[i]
      try{
        document.getElementById(key).value = spider_data[key]
      }catch (error) {
        console.log(error);
      }
    }
  }
  
  document.getElementById('start-status').innerHTML = '<a id="start-status"><font color="green">設定が完了しました。(' + crawler_or_spidercls + ')</font></a>'
  checker2 = true
}

// スクレイピング開始
const StartBtn = document.getElementById('start-scrapy')
StartBtn.addEventListener('click', (event) => {
  if (!checker1){
    ipcRenderer.send('cause-error', '未設定項目', '認証を行ってください')
    return
  }else if (!checker2){
    ipcRenderer.send('cause-error', '未設定項目', 'ショップを選択してください')
    return
  }

  must_list = [
    "sex",
    "csv_prm",
    "start_urls",
  ]
  for(var i = 0; i < must_list.length; i++){
    if (document.getElementById(must_list[i]).value == ""){
      ipcRenderer.send('cause-error', "未設定項目", must_list[i] + "を入力してください")
      return
    }
  }

  integer_list = [
    "delivery_price",
    "max_price",
    "vatoff_late",
    "vip_late",
    "deadline",
    "stock",
    "max_page",
    "profit_late",
  ]
  for(var i = 0; i < integer_list.length; i++){
    let data_value = document.getElementById(integer_list[i]).value
    if (!/^[-]?([1-9]\d*|0)(\.\d+)?$/.test(data_value) && data_value !== ""){
      ipcRenderer.send('cause-error', "入力エラー", integer_list[i] + "の入力に数値以外の文字が有ります")
      return
    }
  }

  if (!/^[A-Za-z0-9]+$/.test(document.getElementById("csv_prm").value)){
    ipcRenderer.send('cause-error', "入力エラー",  "CSV パラメータは半角英数字のみで入力してください")
    return
  }

  let buyplace = document.getElementById("buyplace").value
  let sendplace = document.getElementById("sendplace").value
  if(!buyplace || !sendplace){
    console.log("buyplaceかsendplaceが未記入です")
  }else if (buyplace.match(new RegExp( ":", "g" )).length !== 3 || sendplace.match(new RegExp( ":", "g" )).length !== 3 && buyplace !== "" && sendplace !== ""){
    ipcRenderer.send('cause-error', "入力エラー",  "買い付け地、発送地にはコロン「:」が3つ必要です")
    return
  }

  // crawler_or_spiderclsはpipelineでなくなってしまう
  var args_list = {
    "crawler_or_spidercls": crawler_or_spidercls, 
    "spider_name": crawler_or_spidercls, 
    "user_id": user_id,
    "limit": crawl_limit,
    "dir_path": directory_name,
  }
  // edit_nameからは既に同じ名前でDBから取得できているので、キーを使い回して取得します   
  keys_list = ["email", "password", "start_urls","sex","nobrand","no_ban_brand","currency","max_page", "csv_prm","edit_name","max_price","vatoff_late","vip_late","delivery_price","profit_late","duty_pattern","size_variation","buyplace","sendplace","buyma_shop","tag","thema","season","delivery","deadline","stock","memo","switch"]
  for (let i = 0; i < keys_list.length; i++) {
    try {
      args_list[keys_list[i]] = document.getElementById(keys_list[i]).value
    } catch (error) {
      console.log(error) 
    }
  }
  ipcRenderer.send('show-info', 'スクレイピング開始', '商品リストの取得を開始しました', 'アプリを閉じると取得を終了します。\n取得可能商品数はこちらです：' + args_list['limit'] + '\n取得ショップ：' + args_list['crawler_or_spidercls'])
  ipcRenderer.send('start-scrapy', JSON.stringify(args_list)) 

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

// ヘルプ項目
var txt1 = {
  "open_dir":"dataフォルダ",
  "max_page":"MAX取得ページ数",
  "start_urls":"開始URL",
  "csv_prm":"CSVパラメータ",
  "sex":"性別",
  "nobrand":"ノーブランドの取得有無",
  "no_ban_brand":"禁止ブランド解除",
  "edit_name":"商品名の装飾",
  "max_price":"最低価格",
  "vatoff_late":"VatOff率",
  "vip_late":"VIP割引率",
  "delivery_price":"送料",
  "profit_late":"利益率",
  "duty_pattern":"関税",
  "size_variation":"サイズバリエーション",
  "buyplace":"買付地",
  "sendplace":"発送地",
  "buyma_shop":"買付ショップ名",
  "tag":"タグ",
  "thema":"テーマ",
  "season":"シーズン",
  "delivery":"配送方法",
  "deadline":"購入期限",
  "stock":"在庫数",
  "memo":"メモ",
  "switch":"処理の変更"
}

var txt2 = {
  "open_dir":"dataフォルダを選択してください。(BUYMA/data)",
  "max_page":"開始URLから何ページ分商品を取得するかをここで制限することができます。\n0にした場合、最後のページまで取得します。",
  "start_urls":"ショップの商品一覧ページで、取得を開始したい最初のページURLです。",
  "csv_prm":"取得した商品がCSVで出力されるので、その際にわかりやすいようにここで名前をつけることができます。\n例えば「farfetch」というショップで「2020/02/28」に取得した場合、こちらの項目に「shoes」と入力すると、「farfetch_shoes_20200228.csv」というCSVファイルが出力されます。",
  "sex":"BUYMAに出品する際の性別",
  "nobrand":"ノーブランド商品を「ON」にすると取得できるようになります。",
  "no_ban_brand":"通常Monclerなどは出品禁止になっていますが、許可をもらうと出品できるようになります。\n標準ではMonclerは取得をスキップするので、解除したい場合はこちらで選択してください。",
  "edit_name":"商品名の先頭に装飾したい文字を入力してください。\n例えば「gucci shoes」という商品の場合、「関税込み◆」と装飾文章を設定すると、「関税込み◆gucci shoes」という商品名になります。",
  "max_price":"価格計算後の価格が設定した価格以下の場合はスキップされます。\n30000円以下の商品は取得したくない場合は「30000」と数字のみで入力してください。",
  "vatoff_late":"VatOffがある場合はこちらでパーセンテージを百分率で記入していただくと、価格計算に反映されます。",
  "vip_late":"VIP割引率がある場合はこちらでパーセンテージを百分率で記入していただくと、価格計算に反映されます。",
  "delivery_price":"送料は「海外送料」「国内送料」「外注手数料」など、足し算で計算する価格をこちらに合計して入力していただくと正確に価格計算されます。",
  "profit_late":"利益率のパーセンテージを百分率で記入していただくと、BUYMA手数料なども正確に計算された状態での利益率に合わせた価格設定ができます。\n全ての経費に対する利益率なので、BUYMA手数料など込みで10000円経費をかける場合で、20%に設定をすると、出品価格は12000円になります。",
  "duty_pattern":"「関税元払い」「購入者申請時、全額負担」の場合は出品する際に、選択した関税パターンが反映されます。\nまた、価格計算で関税20%かかるとして一律で計算されます。\n「お客様負担」の場合も出品する際に、選択した関税パターンが反映されます。\nまた、価格計算で関税はかからない（0%）として一律で計算されます。",
  "size_variation":"サイズバリエーションがある場合はこちらを「サイズバリエーションあり」に選択すると、出品時にサイズ展開も反映されます。\n「サイズバリエーションなし」に選択すると、サイズに関する情報はサイズ補足に記入されます。",
  "buyplace":"BUYMAに出品する際の買付地をBUYMAの表示に合わせて設定してください。\n出品画面を見ると分かる通り、最初「国内」または「海外」を選択します。それぞれの場合で次に続くパターンが違います。\n考え方として、基本「:」で区切るのですが、「:」は3つ用意してください→「:::」\nそこに左から順にBUYMAの出品画面をみながら、自分が買付地に設定したい地域を設定していきます。\n例えば、「海外」「ヨーロッパ」「イタリア」「選択なし」の場合は→「海外:ヨーロッパ:イタリア:選択なし」と記入します。",
  "sendplace":"BUYMAに出品する際の発送地をBUYMAの表示に合わせて設定してください。\n出品画面を見ると分かる通り、最初「国内」または「海外」を選択します。それぞれの場合で次に続くパターンが違います。\n考え方として、基本「:」で区切るのですが、「:」は3つ用意してください→「:::」\nそこに左から順にBUYMAの出品画面をみながら、自分が買付地に設定したい地域を設定していきます。\n例えば、「国内」「福岡」の場合は→「国内:福岡::」と記入します。",
  "buyma_shop":"BUYMAに出品する際の買付先ショップ名に記入する文章を設定します。",
  "tag":"BUYMAにあるタグの名前を正確に記入してください。\n複数ある場合は「,」で区切ります。\nカテゴリーによってタグが変わりますが、存在しないタグを設定しても自動的にスキップするようにしています。\nしかし、ない場合は1つにつき10秒のタイムラグが生まれてしまうので、ご了承ください。",
  "thema":"BUYMAにあるテーマを正確に記入してください。\nテーマは一つしか設定できません。",
  "season":"BUYMAにあるシーズンを選択してください。\nない場合は設定しなくても大丈夫です。",
  "delivery":"配送方法名を正確に記入してください。\n補足情報の部分は記入しなくても大丈夫です。",
  "deadline":"現在の日付から何日後を出品期限にするかを設定します。\n30日間出品したい場合は30と記入します。",
  "stock":"BUYMAに出品する際の在庫数を設定します。",
  "memo":"出品メモに記入したい内容をこちらに記入してください。",
  "switch":"こちらは要望があった方にオプションで機能を追加しています。\n通常は空欄で大丈夫です。"
}
// ヘルプボタン
function gethelp(key) {
  console.log(key)
  ipcRenderer.send('show-info', "ヘルプ", txt1[key], txt2[key])
}

AutoAdjust()

