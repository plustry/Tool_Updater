// rendererとipc通信を行う
const { ipcRenderer, remote } = require("electron");
const { Menu, MenuItem } = remote

// 右クリックメニュー
const menu = new Menu()
menu.append(new MenuItem({
  label: 'コピー',
  accelerator: 'CmdOrCtrl+C',
  role: 'copy'
}))
menu.append(new MenuItem({
  label: '貼り付け',
  accelerator: 'CmdOrCtrl+V',
  role: 'paste'
}))

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  menu.popup({ window: remote.getCurrentWindow() })
}, false)

// 設定項目をすべて満たしているかどうか
global.checker = false;
global.login = false;
global.scraping_conf = "";

// デフォルトフォルダを読み込む
ipcRenderer.send("init-stockcheck");

// 設定データがあれば読み込み
ipcRenderer.on("load-scraping-conf", (event, dic_list) => {
  // console.log(dic_list)
  scraping_conf = JSON.parse(dic_list);
  var email = scraping_conf["login"]["email"];
  var password = scraping_conf["login"]["password"];
  if (!login && email && password) {
    document.getElementById("email").value = email;
    document.getElementById("password").value = password;
    ipcRenderer.send("sql-login", email, password, "stockcheck");
  }
});

// ページ遷移
const ChangeToExhibitionBtn = document.getElementById("exhibition");
ChangeToExhibitionBtn.addEventListener("click", (event) => {
  ipcRenderer.send("change-to-exhibition");
});
const ChangeToManagerBtn = document.getElementById("buymanager");
ChangeToManagerBtn.addEventListener("click", (event) => {
  ipcRenderer.send("change-to-manager");
});
const ChangeToScraperBtn = document.getElementById("scraper");
ChangeToScraperBtn.addEventListener("click", (event) => {
  ipcRenderer.send("change-to-scraper");
});
const ChangeToImagerBtn = document.getElementById("imager");
ChangeToImagerBtn.addEventListener("click", (event) => {
  ipcRenderer.send("change-to-imager");
});

// フォルダ選択画面を呼び出し
const selectDirBtn = document.getElementById("select-dir");
selectDirBtn.addEventListener("click", (event) => {
  ipcRenderer.send("open-file-scraper");
});

// ファイル選択呼び出し
const selectLogoBtn = document.getElementById("select-url-lists");
selectLogoBtn.addEventListener("click", (event) => {
  ipcRenderer.send("open-file", "selected-url-lists");
});
// 選択されたファイルを適用
ipcRenderer.on("selected-url-lists", (event, path) => {
  document.getElementById("url_lists").value = path;
});

// 選択したディレクトリを表示
ipcRenderer.on("selected-directory", (event, path) => {
  global.directory_name = path;
  document.getElementById(
    "selected-folder"
  ).innerHTML = `You selected: ${path}`;
});

// SQL認証
const SqlLoginBtn = document.getElementById("sql-login");
SqlLoginBtn.addEventListener("click", (event) => {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  ipcRenderer.send("sql-login", email, password, "stockcheck");
});

// login情報を元に画面編集
ipcRenderer.on("load-login-data", (event, arg_json) => {
  // ログイン成功
  login = true;
  arg_json = JSON.parse(arg_json);

  // load_shopやstart-scrapyで使用するためグローバル関数にする
  global.user_shop_dict = arg_json["user_shop_dict"];
  global.crawl_limit = arg_json["crawl_limit"];
  global.user_id = arg_json["user_id"];
  // console.log(user_shop_dict)

  // ユーザーの登録しているショップ情報を取得して、ドロップダウンをページに反映
  button_list =
    "<select onchange=load_shop(this)><option value=-1>ショップを選択してください</option>";
  keys_list = Object.keys(user_shop_dict);
  for (let i = 0; i < keys_list.length; i++) {
    spider_name = keys_list[i];
    shop_name = user_shop_dict[spider_name]["shop"];
    console.log(spider_name, shop_name);
    button_list +=
      "<option value=" + spider_name + ">" + shop_name + "</option>";
  }
  button_list += "</select>";

  // ショップごとのボタン作成 配列の取得
  document.getElementById("stock-shop-list").innerHTML = button_list;
  document.getElementById("sql-login-status").innerHTML =
    '<font color="green">認証しました</font>';
  document.getElementById("start-status").innerHTML =
    '<a id="start-status"><font color="red">ショップが選択されていません</font></a>';
  // ボタンができるのでその分調整
  AutoAdjust();
});

// ショップボタンを押した際にデフォルト値をロード
function load_shop(obj) {
  global.crawler_or_spidercls = obj.options[obj.selectedIndex].value;
  console.log(crawler_or_spidercls);
  document.getElementById("start-status").innerHTML =
    '<a id="start-status"><font color="green">設定が完了しました。(' +
    crawler_or_spidercls +
    ")</font></a>";
  checker = true;
}

function start_check() {
  let doc_data = document.getElementById("url_lists").value;
  if (!checker) {
    ipcRenderer.send("cause-error", "未設定項目", "ショップを選択してください");
    return false;
  } else if (document.getElementById("url_lists").value == "") {
    ipcRenderer.send(
      "cause-error",
      "未設定項目",
      "開始URLまたはURLリストを入力してください"
    );
    return false;
  } else if (doc_data.indexOf("https:") !== -1 && doc_data !== "") {
    ipcRenderer.send(
      "cause-error",
      "入力エラー",
      "商品URLリストCSVが正しくありません。\nファイルを開くで選択してください。"
    );
    return false;
  }
  return true;
}

// スクレイピング開始
const StartBtn = document.getElementById("start-stockcheck");
StartBtn.addEventListener("click", (event) => {
  // 入力チェック
  if (!start_check()) {
    return;
  }

  // crawler_or_spiderclsはpipelineでなくなってしまう
  var args_list = {
    crawler_or_spidercls: crawler_or_spidercls,
    spider_name: crawler_or_spidercls,
    user_id: user_id,
    limit: crawl_limit,
    dir_path: directory_name,
    url_lists: document.getElementById("url_lists").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };
  ipcRenderer.send(
    "show-info",
    "在庫確認開始",
    "商品リストの取得を開始しました",
    "アプリを閉じると取得を終了します。" +
      "\n取得ショップ：" +
      args_list["crawler_or_spidercls"]
  );
  ipcRenderer.send("start-stockcheck", JSON.stringify(args_list));
});

// ログ画面
ipcRenderer.on("log-create", (event, log_text) => {
  document.getElementById("logs").innerHTML +=
    "<p>[log]: " + String(log_text) + "</p>";
  document.getElementById("footer").scrollTop = document.getElementById(
    "footer"
  ).scrollHeight;
});

// 最後に動的にパッディングする
function AutoAdjust() {
  var padding = document.getElementsByClassName("shop-setting")[0];
  padding.style.paddingTop = document.getElementsByTagName(
    "header"
  )[0].offsetHeight;
  padding.style.paddingBottom = document.getElementsByTagName(
    "footer"
  )[0].offsetHeight;
}

// ヘルプ項目
var txt1 = {
  open_dir: "dataフォルダ",
  url_lists: "商品リストCSV",
};

var txt2 = {
  open_dir: "dataフォルダを選択してください。(BUYMA/data)",
  url_lists:
    "取得したい商品URLリストを指定することで、指定のURLのみ取得することが可能です。\n設定した場合は開始URLよりも優先されます。",
};
// ヘルプボタン
function gethelp(key) {
  console.log(key);
  ipcRenderer.send("show-info", "ヘルプ", txt1[key], txt2[key]);
}

AutoAdjust();
