// rendererとipc通信を行う
const {ipcRenderer} = require('electron')

// 設定項目をすべて満たしているかどうか
global.checker1 = false
global.keys_list = ["image_conf","edit_mode","master_dir","choiced_dir","scriptPath","img_category","img_new_category","email","password","logo_size","item_size","item_move_x","item_move_y","back_move_x","back_move_y","logo_move_x","logo_move_y","bg_num","bg_image","img_effect","img_frame","img_logo","image_diff","addimg_1_name","addimg_1_size","addimg_1_x","addimg_1_y","addimg_2_name","addimg_2_size","addimg_2_x","addimg_2_y","addimg_3_name","addimg_3_size","addimg_3_x","addimg_3_y","electron_dir"]
global.args_list = ""
// デフォルトフォルダを読み込む
ipcRenderer.send('init-imager')

// 設定データがあれば読み込み
ipcRenderer.on('load-image-conf', (event, dic_list) => {
  if(dic_list){
    global.image_conf = JSON.parse(dic_list)
    document.getElementById('email').value = image_conf["login"]["email"]
    document.getElementById('password').value = image_conf["login"]["password"]
  }else{
    event.sender.send('log-create', "BUYMA/conf フォルダにimage.confファイルが無いまたは空です")
    global.image_conf = {}
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
  ipcRenderer.send('open-file-imager')
})

// ファイル選択呼び出し
const selectLogoBtn = document.getElementById('select-logo')
selectLogoBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-logo')
})
const selectFrameBtn = document.getElementById('select-frame')
selectFrameBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-frame')
})
const selectEffectBtn = document.getElementById('select-effect')
selectEffectBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-effect')
})

// 選択されたファイルを適用
ipcRenderer.on('selected-logo', (event, path) => {
  document.getElementById('img_logo').value = path
})
ipcRenderer.on('selected-frame', (event, path) => {
  document.getElementById('img_frame').value = path
})
ipcRenderer.on('selected-effect', (event, path) => {
  document.getElementById('img_effect').value = path
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
  global.args_list = JSON.parse(args_list)
  choiceDir(global.args_list["choiced_dir"])
})

// ディレクトリを選択した時にパラメータを反映
function choiceDir(obj) {
  var dir_name = obj.options[obj.selectedIndex].value
  console.log(dir_name)
  global.choiced_dir = dir_name
  checker1 = true
  document.getElementById('dir-status').innerHTML = '<font color="green">' + choiced_dir + 'が選択されました</font>'
  // spider名を取得
  if(choiced_dir.indexOf("_") !== -1){
    spider_name = choiced_dir.substring(0,choiced_dir.indexOf("_"))
  }else{
    spider_name = ""
  }

  // args_listがあれば、新規の値を反映させる
  if(global.args_list){
    img_parameter = global.args_list
  }else{
    img_parameter = image_conf[spider_name][""]
  }

  // spiderのカテゴリーリストを反映
  var img_category_list = ""
  try{
  spider_keys_list = Object.keys(image_conf[spider_name])
  // console.log(spider_keys_list)
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

  for (let i = 0; i < keys_list.length; i++) {
    try{
      // undefinedの場合はスキップする
      if(img_parameter[keys_list[i]]){
        document.getElementById(keys_list[i]).value = img_parameter[keys_list[i]]
      }
    }catch{
      console.log("error")
    }
  }
}

// カテゴリをクリックして、適用した時にパラメータを反映させる
function choiceCat(){
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
  document.getElementById('img_category').value = img_category
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
    return
  }

  must_list = [
    "email",
    "password"
  ]

  for(var i = 0; i < must_list.length; i++){
    if (document.getElementById(must_list[i]).value == ""){
      ipcRenderer.send('cause-error', "未設定項目", must_list[i] + "を入力してください")
      return
    }
  }

  integer_list = [
    "image_diff",
    "item_size",
    "item_move_y",
    "item_move_x",
    "logo_size",
    "logo_move_y",
    "logo_move_x",
    "bg_num",
    "back_move_y",
    "back_move_x",
    "addimg_1_name",
    "addimg_1_size",
    "addimg_1_y",
    "addimg_1_x",
    "addimg_2_name",
    "addimg_2_size",
    "addimg_2_y",
    "addimg_2_x",
    "addimg_3_name",
    "addimg_3_size",
    "addimg_3_y",
    "addimg_3_x",
  ]
  for(var i = 0; i < integer_list.length; i++){
    if (!/^[-]?([1-9]\d*|0)(\.\d+)?$/.test(document.getElementById(integer_list[i]).value) && document.getElementById(integer_list[i]).value !== ""){
      ipcRenderer.send('cause-error', "入力エラー", integer_list[i] + "の入力に数値以外の文字が有ります")
      return
    }
  }

  global.args_list = {
    "image_conf": image_conf,
    "edit_mode": document.getElementById('edit_mode').value,
    "master_dir": directory_name,
    "choiced_dir": choiced_dir,
    "scriptPath": __dirname,
    "img_category": document.getElementById('img_category').value,
    "img_new_category": document.getElementById('img_new_category').value,
    "email": document.getElementById('email').value,
    "password": document.getElementById('password').value,
    "logo_size": document.getElementById('logo_size').value,
    "item_size": document.getElementById('item_size').value,
    "item_move_x": document.getElementById('item_move_x').value,
    "item_move_y": document.getElementById('item_move_y').value,
    "back_move_x": document.getElementById('back_move_x').value,
    "back_move_y": document.getElementById('back_move_y').value,
    "logo_move_x": document.getElementById('logo_move_x').value,
    "logo_move_y": document.getElementById('logo_move_y').value,
    "bg_num": document.getElementById('bg_num').value,
    "bg_image": document.getElementById('bg_image').value,
    "img_effect": document.getElementById('img_effect').value,
    "img_frame": document.getElementById('img_frame').value,
    "img_logo": document.getElementById('img_logo').value,
    "image_diff": document.getElementById('image_diff').value,
    "addimg_1_name": document.getElementById('addimg_1_name').value, 
    "addimg_1_size": document.getElementById('addimg_1_size').value,
    "addimg_1_x": document.getElementById('addimg_1_x').value, 
    "addimg_1_y": document.getElementById('addimg_1_y').value,
    "addimg_2_name": document.getElementById('addimg_2_name').value, 
    "addimg_2_size": document.getElementById('addimg_2_size').value,
    "addimg_2_x": document.getElementById('addimg_2_x').value, 
    "addimg_2_y": document.getElementById('addimg_2_y').value,
    "addimg_3_name": document.getElementById('addimg_3_name').value, 
    "addimg_3_size": document.getElementById('addimg_3_size').value,
    "addimg_3_x": document.getElementById('addimg_3_x').value, 
    "addimg_3_y": document.getElementById('addimg_3_y').value
  }
  ipcRenderer.send('start-imager', JSON.stringify(args_list))
  
})

// ヘルプ項目
var txt1 = {
  "open_dir":"画像ディレクトリ",
  "logo_size":"ロゴ画像サイズ",
  "item_size":"商品画像サイズ",
  "item_move_y":"商品縦",
  "item_move_x":"商品横",
  "back_move_y":"背景縦",
  "back_move_x":"背景横",
  "logo_move_y":"ロゴ縦",
  "logo_move_x":"ロゴ横",
  "bg_num":"背景画像番号",
  "img_effect":"エフェクト画像",
  "img_frame":"フレーム画像",
  "img_logo":"ロゴ画像",
  "img_category":"カテゴリ",
  "img_new_category":"新規カテゴリ",
  "imager-main":"編集実行",
  "image_diff":"透明度",
  "bg_image":"背景",
  "edit_mode":"モード",
  "add_img_name":"追加商品画像"
}

var txt2 = {
  "open_dir":"画像ディレクトリを指定してください。00002などの個別のディレクトリではなく、自動取得の際に指定したディレクトリを選択すると、csvごとのデータ選択ができるようになります。",
  "logo_size":"ロゴの画像サイズです。\n750x750に対するパーセントで指定してください。\nロゴ画像の縦横の大きいサイズを指定したパーセンテージに縮尺します。",
  "item_size":"最前面に表示する商品画像のサイズです。\n生成画像サイズ以下の値にしてください。",
  "item_move_y":"商品画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください。",
  "item_move_x":"商品画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、左ならマイナス、右ならプラスのピクセル値で入力してください。",
  "back_move_y":"背景画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください。",
  "back_move_x":"背景画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、左ならマイナス、右ならプラスのピクセル値で入力してください。",
  "logo_move_y":"ロゴ画像のたて移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、上ならマイナス、下ならプラスのピクセル値で入力してください。",
  "logo_move_x":"ロゴ画像のよこ移動値です。デフォルト(0)のとき中心に表示されます。\n中心からの移動値を、左ならマイナス、右ならプラスのピクセル値で入力してください。",
  "bg_num":"背景に使用する画像の番号です。\n存在しない場合、１ずつ小さくして再帰的に検索します。\n背景の欄に記入されている場合はそちらが優先されます。",
  "img_effect":"エフェクト(背景画像に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>effectを参照します。\n設定しない場合は空欄で大丈夫です。",
  "img_frame":"フレーム(最前面に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>frameを参照します。\n設定しない場合は空欄で大丈夫です。",
  "img_logo":"ロゴ(最前面に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>logoを参照します。\n設定しない場合は空欄で大丈夫です。",
  "img_category":"以前カテゴリを作成したことがある場合、ここにそのカテゴリが表示されるので選択して「適用」をクリックしてください。\nよくわからない場合は右上の「自動画像加工ツール」をクリックして画面を再読み込みしてください。",
  "img_new_category":"画像加工する時にシューズと服でパラメータを分けたい場合があると思います。\nそういった時はこちらにお好きなカテゴリを記入して頂き、実行してください。\n次回画面を再読み込みしましたら「カテゴリ」で選択可能。",
  "imager-main":"選択したフォルダにある画像を、モードで選択した条件で編集します。",
  "image_diff":"透明化のパラメーターです。白背景ならば0.4~0.5, グレー背景なら0.1~0.2くらいがベストです。-1で透明化をスキップします。",
  "bg_image":"背景(最背面に適用)の画像名を入力してください。\nフォルダは、dataフォルダと同じ階層のimg_content>backgroundを参照します。\n設定しない場合は空欄で大丈夫です。",
  "edit_mode":"■テスト編集の場合：選択したフォルダの画像を3つだけ編集して画像の出来具合を確かめることができます。\n\n■全て編集の場合：選択したフォルダにある画像を全て編集します。\n\n■メイン画像の透過の場合：image000.pngを透過した画像をimage000_edit.pngという名前で保存します。\nimage000_edit.pngがある場合、その画像が一番前面にくる画像として使われるので、背景透過を綺麗にしたい場合は、ご自分の使い慣れている画像編集ソフトで背景を綺麗に透過させてご使用ください。",
  "add_img_name":"さらに追加したい商品画像のファイル名を指定してください。"
}
// ヘルプボタン
function gethelp(key) {
  console.log(key)
  ipcRenderer.send('show-info', "ヘルプ", txt1[key], txt2[key])
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