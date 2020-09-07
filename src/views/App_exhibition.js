// rendererとipc通信を行う
const { ipcRenderer } = require("electron");
const path = require("path");
global.checker = false;

// 動的に作成したボタンから呼び出してCSV読みこみ
global.csv_name = "";
function load_csv(obj) {
  csv_file_name = obj.options[obj.selectedIndex].value;
  ipcRenderer.send("load-csv", path.join(global.directory_name, csv_file_name));
  global.csv_name = csv_file_name;
}

// 全てリセット
function reset_all() {
  document.getElementById("selected-folder").innerHTML =
    "フォルダが選択されていません";
  document.getElementById("text-data").innerHTML = "";
  document.getElementById("csv-list").innerHTML = "";
}

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

// ストップ
// function stop() {
//   console.log('stop')
//   ipcRenderer.removeAllListeners('start')
// }

// アカウントディレクトリ新規作成
const makeDirBtn = document.getElementById("make-account-dir");
makeDirBtn.addEventListener("click", (event) => {
  var user_dir = document.getElementById("user-dir").value;
  if (!/^[A-Za-z0-9]+$/.test(user_dir)) {
    ipcRenderer.send(
      "cause-error",
      "入力エラー",
      "アカウント名は半角英数字のみで入力してください"
    );
    return;
  }
  ipcRenderer.send("make-account-dir", user_dir);
});

// フォルダ選択画面を呼び出し
const selectDirBtn = document.getElementById("select-dir");
selectDirBtn.addEventListener("click", (event) => {
  ipcRenderer.send("open-file-exhibition");
});

// ログ画面
ipcRenderer.on("log-create", (event, log_text) => {
  document.getElementById("logs").innerHTML += "<p>[log]: " + log_text + "</p>";
  document.getElementById("footer").scrollTop = document.getElementById(
    "footer"
  ).scrollHeight;
});

// 自動出品開始
const StartBtn = document.getElementById("start-exhibition");
StartBtn.addEventListener("click", (event) => {
  if (!checker) {
    ipcRenderer.send("cause-error", "未設定項目", "CSVを選択してください");
    return;
  }

  let access_code = document.getElementById("access-code").value;
  if (
    access_code.indexOf("kaiin_id%22%3A") === -1 ||
    access_code.indexOf("%2C%22nickname") === -1 ||
    access_code.indexOf("_GEWZxdbe2H2bte4N") === -1
  ) {
    ipcRenderer.send(
      "cause-error",
      "設定エラー",
      "アクセスコードが正しくありません\n以下を参考にしてください。\nhttps://docs.google.com/document/d/1wT88HLOaG2011eJn0V5u6gnzYjqLiTcRv6f7xHvvngY/edit#heading=h.6gmd5ogn4qo7"
    );
    return;
  }
  // var mail = document.getElementById('mail').value
  var args_list = {
    day_score: document.getElementById("day-score").value,
    hour_score: document.getElementById("hour-score").value,
    cookie: document.getElementById("access-code").value,
    draft: document.getElementById("draft").value,
    dir_path: global.directory_name,
    csv_name: global.csv_name,
    url_memo: document.getElementById("url_memo").value,
    duplicate: document.getElementById("duplicate").value,
  };
  ipcRenderer.send("start-exhibition", JSON.stringify(args_list));
});

// 選択したディレクトリを表示
ipcRenderer.on("selected-directory", (event, path) => {
  global.directory_name = path;
  document.getElementById(
    "selected-folder"
  ).innerHTML = `You selected: ${path}`;
});

// 選択したディレクトリに保存されたアクセスコードを表示
ipcRenderer.on("update-accesscode", (event, code) => {
  document.getElementById("access-code").value = code;
});

// 選択したcsvをボタンで表示
ipcRenderer.on("selected-csv", (event, fileList) => {
  // console.log(fileList)
  // 選択したディレクトリからcsvだけピックアップしてボタンの作成
  var button_text =
    "<select onchange=load_csv(this)><option value=-1>フォルダを選択してください</option>";
  // var text_data = ""
  for (let index = 0; index < fileList.length; index++) {
    button_text +=
      "<option value=" + fileList[index] + ">" + fileList[index] + "</option>";
    // text_data += "<button onclick=load_csv('" + fileList[index] + "')>" + fileList[index] + "</button>"
  }
  button_text += "</select>";
  document.getElementById("csv-list").innerHTML = button_text;
});

// csvファイルの内容を表示
ipcRenderer.on("selected-filedata", (event, text_data) => {
  // ボタン分高さが変わるので自動調整
  AutoAdjust();
  document.getElementById("text-data").innerHTML = `${text_data}`;
  checker = true;
});

// パッディング自動調整
function AutoAdjust() {
  var padding = document.getElementsByClassName("csv-table")[0];
  padding.style.paddingTop = document.getElementsByTagName(
    "header"
  )[0].offsetHeight;
  padding.style.paddingBottom = document.getElementsByTagName(
    "footer"
  )[0].offsetHeight;
}

// ヘルプ項目
var txt1 = {
  new_dir: "アカウントフォルダ新規作成",
  choice_dir: "アカウントフォルダを開く",
  reset: "リセット",
  days: "重複検査",
  memo: "買い付け先メモ",
  duplicate: "重複チェック",
  access_code: "アクセスコード",
  draft: "下書き",
};

var txt2 = {
  new_dir:
    "新しいアカウントディレクトリを作成する場合、アカウント名を入力して、ボタンを押してください。\nデスクトップにBUYMAディレクトリが作成され、その中のaccountディレクトリ内に新しく作成されます。",
  choice_dir:
    "出品するアカウントのディレクトリを選択します。\n事前にdataディレクトリからcsvと画像データを移動しておいてください。",
  reset: "開いたディレクトリや表示したCSVをリセットできます。",
  days:
    "過去の出品との重複を検知します。\n指定した日付以降に出品されていた場合スキップされます。",
  memo:
    "BUYMAの出品時に買い付け先メモを記入するかどうか選択できます。「on」か「off」かで記入してください。",
  duplicate:
    "BUYMAの出品時に重複チェックをするかどうか選択できます。「on」か「off」かで記入してください。",
  access_code:
    "Chromeから取得したアクセスコードを入力してください。\n詳しい取得方法は動画を参照してください。",
  draft:
    "BUYMAに下書き保存をするかどうか選択できます。「on」か「off」かで記入してください。",
};
// ヘルプボタン
function gethelp(key) {
  console.log(key);
  ipcRenderer.send("show-info", "ヘルプ", txt1[key], txt2[key]);
}

AutoAdjust();
