/**********************************
* アップデータスクリプト
* 
* アップデート処理
* StartUpdate(current_version, new_version) -> null
*
* バージョン確認->アップデート
* AutoUpdater(event) -> null
**********************************/

// constants
const {dialog} = require("electron");
const fs = require("fs");
const path = require("path");
const request = require("request");
const unzip = require("node-unzip-2");
const ProgressBar = require("electron-progressbar");
const src_dir = path.dirname(__dirname)

function StartUpdate(current_version, new_version) {
  var progressBar = new ProgressBar({
    closeOnComplete: false,
    text:
      "アップデートを実行" +
      current_version.toString() +
      "=>" +
      new_version.toString(),
    detail: "新しいファイルをダウンロードしています...",
    browserWindow: {
      closable: true,
      webPreferences: {
        nodeIntegration: true,
      },
      height: 250,
    },
  });
  progressBar.on("completed", function () {
    console.info(`completed...`);
    progressBar.title = "Finished";
    progressBar.detail =
      "重要※アプリを再起動してください！\nアップデートは正常に終了しました " +
      current_version.toString() +
      "=>" +
      new_version.toString();
  });
  console.log(progressBar.detail);
  // ZIPファイルをGithubからダウンロード
  new Promise((resolve, reject) => {
    console.log(path.join(src_dir, "..", "updater.zip"));
    try {
      request(
        {
          method: "GET",
          url: "https://github.com/plustry/Tool_Updater/archive/master.zip",
          encoding: null,
        },
        function (error, response, body) {
          console.log(response);
          if (!error && response.statusCode === 200) {
            fs.writeFileSync(
              path.join(src_dir, "..", "updater.zip"),
              body,
              "binary"
            );
            resolve("pass");
          }
        }
      );
    } catch (error) {
      progressBar.detail = "ツールは必ずデスクトップに置いてください。";
      reject("ツールは必ずデスクトップに置いてください。");
    }
  }).then((response) => {
    new Promise((resolve, reject) => {
      // ZIPファイルを解凍
      progressBar.detail = "新しいファイルを展開しています...";
      var stream = fs
        .createReadStream(path.join(src_dir, "..", "updater.zip"))
        .pipe(unzip.Extract({ path: path.join(src_dir, "..") }));
      stream.on("close", function () {
        resolve("pass");
      });
    }).then((response) => {
      // ディレクトリを移動
      try {
        progressBar.detail =
          "古いファイルを削除しています...\n5分以上経過しても終了しない場合はPCを再起動してもう一度お確かめください。";
        var update_list = fs.readdirSync(
          path.join(src_dir, "..", "Tool_Updater-master")
        );
        console.log(update_list);

        for (let i = 0; i < update_list.length; i++) {
          var update_path = path.join(src_dir, "..", update_list[i]);
          // console.log(update_path, fs.statSync(update_path).isDirectory())
          if (fs.statSync(update_path).isDirectory()) {
            deleteFolderRecursive(update_path);
          } else {
            fs.unlinkSync(update_path);
          }
          fs.renameSync(
            path.join(
              path.join(src_dir, "..", "Tool_Updater-master"),
              update_list[i]
            ),
            update_path
          );
        }
        progressBar.detail = "新しいファイルを適用しています...";
        if (os_info == "darwin") {
          fs.chmodSync(
            path.join(src_dir, "chromedriver", "chromedriver"),
            0o777
          );
        }
        // ZIPファイルを削除
        fs.unlinkSync(path.join(src_dir, "..", "updater.zip"));
        // 展開ディレクトリを削除
        deleteFolderRecursive(
          path.join(src_dir, "..", "Tool_Updater-master")
        );
        progressBar.detail =
          "アップデートに成功しました。\nアプリを再起動してください！";
        progressBar.setCompleted();
      } catch (error) {
        var message = error.message;
        if (error.message.indexOf("EPERM") != -1) {
          message =
            "アップデートに失敗しました。ファイルが別の場所で開かれているか、chromedriverがバックグラウンドで動いている可能性があります。https://drive.google.com/file/d/1kfrWoGcz4mhmBkOdb77HixiMHjdm6b08/view";
        } else if (error.massage.indexOf("ENOENT") != -1) {
          message =
            "アップデートに失敗しました。前回のアップデートが途中で終わった可能性があります。再度「強制アップデート」をお試しください。";
        }
        progressBar.detail = massage;
        progressBar.setCompleted();
      }
    });
  });
}

function AutoUpdater(event) {
  // 最新バージョンをGithubから確認
  process.on("unhandledRejection", console.dir);
  const url_req = new Promise((resolve, reject) => {
    request("https://plustry.github.io/Tool_Updater/versions", function (
      error,
      response,
      body
    ) {
      resolve(body);
    });
  }).then((new_version) => {
    console.log(new_version);
    // 保存されたファイルから現在のバージョンを確認
    let current_version = fs
      .readFileSync(path.join(src_dir, "..", "..", "versions.html"), "utf-8")
      .toString();
    console.log(current_version);
    var detail_txt = "";
    if (new_version == current_version) {
      detail_txt =
        "アップデートはありませんでした Ver: " + new_version.toString();
      var options_ = {
        type: "info",
        title: "アップデート終了",
        message: "アップデートは終了しました",
        detail: detail_txt,
      };
      dialog.showMessageBox(mainWindow, options_);
    } else {
      StartUpdate(current_version, new_version);
    }
  });
}

// ディレクトリ削除
var deleteFolderRecursive = function (pathe) {
  if (fs.existsSync(pathe)) {
    fs.readdirSync(pathe).forEach(function (file) {
      var curPath = path.join(pathe, file);
      if (fs.statSync(curPath).isDirectory()) {
        //recurse
        deleteFolderRecursive(curPath);
      } else {
        //delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathe);
  }
};


module.exports = {StartUpdate, AutoUpdater}