// rendererとipc通信を行う
const {ipcRenderer} = require('electron')

// 設定項目をすべて満たしているかどうか
global.checker1 = false

// デフォルトフォルダを読み込む
ipcRenderer.send('init-imager')

// 設定データがあれば読み込み
ipcRenderer.on('load-image-conf', (event, dic_list) => {
  console.log(dic_list)
  global.image_conf = JSON.parse(dic_list)
  document.getElementById('email').value = image_conf["login"]["email"]
  document.getElementById('password').value = image_conf["login"]["password"]
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
  ipcRenderer.send('open-file-imager')
})

// 選択したディレクトリを表示
ipcRenderer.on('selected-directory', (event, path) => {
  global.directory_name = path
  document.getElementById('selected-folder').innerHTML = `You selected: ${path}`
})

// 選択されたディレクトリ内のフォルダをボタンにして表示
ipcRenderer.on('make-dir-button', (event, button_text) => {
  document.getElementById('dir-button').innerHTML = button_text
  document.getElementById('dir-status').innerHTML = '<font color="red">ディレクトリを選択してください</font>'
  // 高さが変わるので自動パッディング
  AutoAdjust()
})

// ウィンドウをリロードした時に画面を書き直す
ipcRenderer.on('after_reload', (event, args_list) => {
  args_dict = JSON.parse(args_list)
  choiceDir(args_dict["select_folder"])
  keys_list = ["img_category","image_size","item_size","item_move_x","item_move_y","back_move_x","back_move_y","logo_move_x","logo_move_y","bg_num","img_effect","img_frame","img_logo","image_diff"]
  for (let i = 0; i < keys_list.length; i++) {
    try{
      document.getElementById(keys_list[i]).value = args_dict[keys_list[i]]
    }catch{
      console.log("error")
    }
  }
  // console.log(args_list)
  // document.getElementById('selected-folder').innerHTML = `You selected: ${path}`
})

// ディレクトリボタンの選択
function choiceDir(dir_name) {
  global.choiced_dir = dir_name
  checker1 = true
  document.getElementById('dir-status').innerHTML = '<font color="green">' + choiced_dir + 'が選択されました</font>'
  keys_list = ["image_size","item_size","item_move_x","item_move_y","back_move_x","back_move_y","logo_move_x","logo_move_y","bg_num","img_effect","img_frame","img_logo","image_diff"]
  if(choiced_dir.indexOf("_") !== -1){
    spider_name = choiced_dir.substring(0,choiced_dir.indexOf("_"))
  }else{
    spider_name = ""
  }
    for (let i = 0; i < keys_list.length; i++) {
      try{
        document.getElementById(keys_list[i]).value = image_conf[spider_name][""][keys_list[i]]
      }catch{
        console.log("error")
      }
    }
  
    var img_category_list = ""
    try{
    spider_keys_list = Object.keys(image_conf[spider_name])
    console.log(spider_keys_list)
    }catch{
      console.log("データが存在しません")
    }
    for (var i = 0; i < spider_keys_list.length; i++) {
      try{
        img_category_list += '<option value="' + spider_keys_list[i] + '">' + spider_keys_list[i] + "</option>"
      }catch{
        console.log("error")
      }
    }
    document.getElementById('img_category').innerHTML = img_category_list
}

function choiceCat(){
  keys_list = ["image_size","item_size","item_move_x","item_move_y","back_move_x","back_move_y","logo_move_x","logo_move_y","bg_num","img_effect","img_frame","img_logo","image_diff"]
  if(choiced_dir.indexOf("_") !== -1){
    spider_name = choiced_dir.substring(0,choiced_dir.indexOf("_"))
  }else{
    spider_name = ""
  }
    img_category = document.getElementById('img_category').value
  for (let i = 0; i < keys_list.length; i++) {
    try{
      document.getElementById(keys_list[i]).value = image_conf[spider_name][img_category][keys_list[i]]
    }catch{
      console.log("error")
    }
  }
}

// 生成された画像を表示してみる
ipcRenderer.on('disp-image', (event, image_path) => {
  var height = document.body.clientHeight - document.getElementsByTagName('header')[0].offsetHeight - document.getElementsByTagName('footer')[0].offsetHeight
  // document.getElementById('logs').innerHTML += height
  document.getElementById('images').innerHTML += '<img src ="file://' + image_path + '" height=' + height +'>'
  AutoAdjust()
})

// メイン編集開始
const MainStartBtn = document.getElementById('imager-main')
MainStartBtn.addEventListener('click', (event) => {
  // 画像ディスプレイをクリア
  document.getElementById('images').innerHTML = ""
  if (!checker1) {
    ipcRenderer.send('cause-error', "未設定項目", "フォルダを選択してください")
  }else {
    var args_list = {
      "mode": "Main",
      "parent_Dir": directory_name,
      "select_folder": choiced_dir,
      "scriptPath": __dirname,
      "img_category": document.getElementById('img_category').value,
      "img_new_category": document.getElementById('img_new_category').value,
      "email": document.getElementById('email').value,
      "password": document.getElementById('password').value,
      "image_size": document.getElementById('image_size').value,
      "item_size": document.getElementById('item_size').value,
      "item_move_x": document.getElementById('item_move_x').value,
      "item_move_y": document.getElementById('item_move_y').value,
      "back_move_x": document.getElementById('back_move_x').value,
      "back_move_y": document.getElementById('back_move_y').value,
      "logo_move_x": document.getElementById('logo_move_x').value,
      "logo_move_y": document.getElementById('logo_move_y').value,
      "bg_num": document.getElementById('bg_num').value,
      "img_effect": document.getElementById('img_effect').value,
      "img_frame": document.getElementById('img_frame').value,
      "img_logo": document.getElementById('img_logo').value,
      "image_diff": document.getElementById('image_diff').value
    }
    console.log(JSON.stringify(args_list))
    ipcRenderer.send('start-imager', JSON.stringify(args_list))
  }
})


// テスト編集開始
const TestStartBtn = document.getElementById('imager-test')
TestStartBtn.addEventListener('click', (event) => {
  // 画像ディスプレイをクリア
  document.getElementById('images').innerHTML = ""
  if (!checker1) {
    ipcRenderer.send('cause-error', "未設定項目", "フォルダを選択してください")
  }else {
    var args_list = {
      "mode": "Test",
      "parent_Dir": directory_name,
      "select_folder": choiced_dir,
      "scriptPath": __dirname,
      "img_category": document.getElementById('img_category').value,
      "img_new_category": document.getElementById('img_new_category').value,
      "email": document.getElementById('email').value,
      "password": document.getElementById('password').value,
      "image_size": document.getElementById('image_size').value,
      "item_size": document.getElementById('item_size').value,
      "item_move_x": document.getElementById('item_move_x').value,
      "item_move_y": document.getElementById('item_move_y').value,
      "back_move_x": document.getElementById('back_move_x').value,
      "back_move_y": document.getElementById('back_move_y').value,
      "logo_move_x": document.getElementById('logo_move_x').value,
      "logo_move_y": document.getElementById('logo_move_y').value,
      "bg_num": document.getElementById('bg_num').value,
      "img_effect": document.getElementById('img_effect').value,
      "img_frame": document.getElementById('img_frame').value,
      "img_logo": document.getElementById('img_logo').value,
      "image_diff": document.getElementById('image_diff').value
    }
    console.log(JSON.stringify(args_list))
    ipcRenderer.send('start-imager', JSON.stringify(args_list))
  }
})

// ヘルプ項目
var txt1 = [
  "生成画像サイズ",
  "商品画像サイズ",
  "商品縦",
  "商品横",
  "背景縦",
  "背景横",
  "ロゴ縦",
  "ロゴ横",
  "背景画像番号",
  "エフェクト画像",
  "フレーム画像",
  "ロゴ画像",
  "カテゴリ",
  "新規カテゴリ",
  "全て編集",
  "テスト編集",
  "透明度"
]
var txt2 = [
  "最終的に生成される画像サイズです。\nピクセル値で指定してください。\nBUYMA推奨は750x750です",
  "最前面に表示する商品画像のサイズです。\n生成画像サイズ以下の値にしてください",
  "商品画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、右ならマイナス、左ならプラスのピクセル値で入力してください",
  "商品画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください",
  "背景画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、右ならマイナス、左ならプラスのピクセル値で入力してください",
  "背景画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください",
  "ロゴ画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、右ならマイナス、左ならプラスのピクセル値で入力してください",
  "ロゴ画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください",
  "背景に使用する画像の番号です。\n存在しない場合、１ずつ小さくして再帰的に検索します",
  "エフェクト(背景画像に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>effectを参照します",
  "フレーム(最前面に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>frameを参照します",
  "ロゴ(最前面に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>logoを参照します",
  "以前カテゴリを作成したことがある場合、ここにそのカテゴリが表示されるので選択して「適用」をクリックしてください。\nよくわからない場合は右上の「自動画像加工ツール」をクリックして画面を再読み込みしてください。",
  "画像加工する時にシューズと服でパラメータを分けたい場合があると思います。\nそういった時はこちらにお好きなカテゴリを記入して頂き、実行してください。\n次回画面を再読み込みしましたら「カテゴリ」で選択可能",
  "選択したフォルダにある画像を全て編集します。",
  "選択したフォルダの画像を3つだけ編集して画像の出来具合を確かめることができます。",
  "白背景ならば0.4~0.5, グレー背景なら0.1~0.2くらいがベスト"
]
// ヘルプボタン
function gethelp(num) {
  ipcRenderer.send('show-info', "ヘルプ", txt1[num], txt2[num])
}

// ログ画面
ipcRenderer.on('log-create', (event, log_text) => {
  document.getElementById('logs').innerHTML += "<p>[log]: " + log_text + "</p>"
  document.getElementById('footer').scrollTop = document.getElementById('footer').scrollHeight;
})

// 最後に動的にパッディングする
function AutoAdjust() {
  var padding = document.getElementsByClassName('images')[0]
  padding.style.paddingTop = document.getElementsByTagName('header')[0].offsetHeight
  padding.style.paddingBottom = document.getElementsByTagName('footer')[0].offsetHeight
}

AutoAdjust()

