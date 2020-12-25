/**********************************
*   自動出品スクリプト
*   XXXX IPC CONNECTION XXXX
*
* アカウントディレクトリ作成
* make-account-dir -> MakeAccountDir(event, user_name)
*
* ディレクトリ選択
* open-file-exhibition -> OpenFileExhibition(event)
*
* CSV読み込み
* load-csv -> LoadCsv(event, csv_file_name)
*
* 自動出品開始
* start-exhibition -> StartExhibition(event, args_list)
**********************************/

// requires
const {ipcMain, dialog} = require("electron");
const fs = require("fs");
const path = require("path");
const getDirName = require("path").dirname;
const makeDir = require("make-dir");
const src_dir = path.dirname(__dirname)

//requires components
const common = require("./common.js");

function IPCInitialize() {
  ipcMain.on("make-account-dir", (event, user_name) => {
    MakeAccountDir(event, user_name)
  })

  ipcMain.on("open-file-exhibition", (event) => {
    OpenFileExhibition(event)
  })

  ipcMain.on("load-csv", (event, csv_file_name) => {
    LoadCsv(event, csv_file_name)
  })

  ipcMain.on("start-exhibition", (event, args_list) => {
    StartExhibition(event, args_list)
  })
}

function MakeAccountDir(event, user_name) {
  console.log(user_name);
  if (user_name == "") {
    dialog.showErrorBox(
      "空白ディレクトリ",
      "新規アカウントディレクトリを作成する場合はアカウント名を入力してください"
    );
  } else {
    dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((folder) => {
        if (folder.filePaths[0]) {
          makeDir(path.join(folder.filePaths[0], "BUYMA")).then((buyma_dir) => {
            //logsディレクトリ作成
            makeDir(path.join(buyma_dir, "logs"));
            //dataディレクトリ作成
            makeDir(path.join(buyma_dir, "data"));
            //confディレクトリ作成
            makeDir(path.join(buyma_dir, "conf")).then((dir) => {
              var txt_list = [
                "image.conf",
                "scraping.conf",
                "manager.conf",
                "base.conf",
              ];
              for (let i = 0; i < txt_list.length; i++) {
                var conf_path = path.join(dir, txt_list[i]);
                if (!common.isExistFile(conf_path)) {
                  fs.writeFile(conf_path, "", (err) => {
                    if (err) throw err;
                  });
                }
              }
            });

            //tmp_brandディレクトリ作成
            makeDir(path.join(buyma_dir, "tmp_brand")).then((dir) => {
              makeDir(path.join(dir, "Saint Laurent")).then((dir) => {
                mkCategoryFile(dir);
                var text_data =
                  "「カテゴリーコメント」\n【SAINT LAURENT】\nサンローランとしても知られるイブサンローランSASは\nイブサンローランと彼のパートナーである\nピエールベルジェによって設立された\nフランスの高級ファッションハウスです。";
                var text_path = path.join(dir, "Saint Laurent.txt");
                if (!common.isExistFile(text_path)) {
                  fs.writeFile(text_path, text_data, (err) => {
                    if (err) throw err;
                  });
                }
              });
            });

            // tmp_categoryディレクトリ作成
            makeDir(path.join(buyma_dir, "tmp_category")).then((dir) => {
              mkCategoryFile(dir);
            });

            //img_contentディレクトリ作成
            makeDir(path.join(buyma_dir, "img_content")).then((dir) => {
              console.log(dir);
              makeDir(path.join(dir, "background"));
              makeDir(path.join(dir, "effect")).then((dir) => {
                var image = path.join(src_dir, "img", "effect.png")
                fs.copyFile(image, path.join(dir, "effect.png"), (err) => {
                  if (err) {
                    throw err;
                  } else {
                    console.log('ファイルをコピーしました。');
                  }
                });
              })
              makeDir(path.join(dir, "frame")).then((dir) => {
                var image = path.join(src_dir, "img", "frame.png")
                fs.copyFile(image, path.join(dir, "frame.png"), (err) => {
                  if (err) {
                    throw err;
                  } else {
                    console.log('ファイルをコピーしました。');
                  }
                });
              })
              makeDir(path.join(dir, "logo"));
            });

            //accountディレクトリ作成
            makeDir(path.join(buyma_dir, "account")).then((dir) => {
              console.log(dir);
              makeDir(path.join(dir, user_name)).then((dir) => {
                console.log(dir);
                makeDir(path.join(dir, "template")).then((dir) => {
                  console.log(dir);
                  var txt_list = [
                    "ColorFooter.txt",
                    "ColorHeader.txt",
                    "CommentFooter.txt",
                    "CommentHeader.txt",
                  ];
                  for (let i = 0; i < txt_list.length; i++) {
                    var temp_path = path.join(dir, txt_list[i]);
                    if (!common.isExistFile(temp_path)) {
                      fs.writeFile(temp_path, " ", (err) => {
                        if (err) throw err;
                      });
                    }
                  }
                });
              });
            });
          });
        }
      });
  }
}

function OpenFileExhibition(event) {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((folder) => {
      if (folder.filePaths[0]) {
        // 選択したディレクトリを表示
        event.sender.send("selected-directory", folder.filePaths[0]);
        var files = fs.readdirSync(folder.filePaths[0]);
        var fileList = [];
        for (let index = 0; index < files.length; index++) {
          if (files[index].indexOf(".csv") !== -1) {
            fileList.push(files[index]);
          }
          // 選択したディレクトリにバックアップがあれば読み込み
          if (files[index].indexOf("access_code.backup") !== -1) {
            event.sender.send(
              "update-accesscode",
              common.readTXT(path.join(folder.filePaths[0], files[index]))
            );
          }
        }
      }
      event.sender.send("selected-csv", fileList);
    });
}

//CSV読み込み-ipc受信
function LoadCsv(event, csv_file_name) {
  const res_data = common.readCSV(csv_file_name);
  const table_data = ARRAYtoTABLE(res_data);
  event.sender.send("selected-filedata", table_data);
}

//自動出品開始
function StartExhibition(event, args_list) {
  args_list = JSON.parse(args_list);
  args_list["electron_dir"] = src_dir;
  cookie = args_list["cookie"];
  buyma_account_dir = args_list["buyma_account_dir"];

  // アクセスコードのバックアップ
  fs.writeFile(
    path.join(buyma_account_dir, "access_code.backup"),
    cookie,
    (err, data) => {
      if (err) event.sender.send("log-create", err);
      else event.sender.send("log-create", "maked backup: access code");
    }
  );

  // pyarmorを使用した場合distディレクトリにexhibition.pyが存在するのでoptionsで指定
  let pyshell = common.PyShell("exhibition.py", args_list);

  pyshell.on("message", function (message) {
    message = common.toString(message);
    // received a message sent from the Python script (a simple "print" statement)
    event.sender.send("log-create", message);
  });

  // DEBUG情報などを取得したい場合
  pyshell.on("stderr", function (message) {
    common.ErrorLog(event, message);
  });

  pyshell.end(function (err, code, signal) {
    if (err) throw err;
    event.sender.send("log-create", "出品処理は全て終了しました");
  });
}

async function mkCategoryFile(dir) {
  // カテゴリテンプレートのリスト作成
  file_list = [];
  for (let i = 0; i < category_list.length; i++) {
    var category = category_list[i].split(" ");
    var category_tmp_path = "";
    for (let j = 0; j < category.length; j++) {
      category_tmp_path = path.join(category_tmp_path, category[j]);
    }
    category_tmp_path = path.join(category_tmp_path, "comment.txt");
    file_list.push(category_tmp_path);
  }
  console.log(file_list);

  for (var i = 0; i < file_list.length; i++) {
    await fcmkfile(path.join(dir, file_list[i]));
  }
  return "ループ終わった。";
}

function fcmkfile(file_path) {
  return new Promise((resolve) => {
    fs.mkdir(getDirName(file_path), { recursive: true }, (err) => {
      if (err) console.log(err);
      if (!common.isExistFile(file_path)) {
        fs.writeFile(file_path, "", (err) => {
          if (err) console.log(err);
          resolve();
        });
      }
    });
  });
}

function ARRAYtoTABLE(res_data) {
  var table_text = '<table rules="all">';
  var data_list = res_data;
  var need_list = [0, 1, 2, 4, 8, 17];

  // 項目処理
  for (let i = 0; i < data_list.length; i++) {
    // 見出し処理
    if (i == 0) {
      var start_tag = "<th nowrap>";
      var end_tag = "</th>";
    } else {
      var start_tag = "<td nowrap>";
      var end_tag = "</td>";
    }

    if (i == 0) {
      table_text += "<thead> <tr>";
    } else {
      table_text += "<tr>";
    }
    for (let j = 0; j < data_list[i].length; j++) {
      for (let need = 0; need < need_list.length; need++) {
        if (need_list[need] == j) {
          table_text += start_tag + data_list[i][j] + end_tag;
        }
      }
    }
    if (i == 0) {
      table_text += "</tr> </thead> <tbody>";
    } else {
      table_text += "</tr>";
    }
  }
  table_text += "</tbody> </table>";

  return table_text;
}

category_list = [
  "レディースファッション トップス トップスその他",
  "レディースファッション トップス Tシャツ・カットソー",
  "レディースファッション トップス ブラウス・シャツ",
  "レディースファッション トップス ニット・セーター",
  "レディースファッション トップス スウェット・トレーナー",
  "レディースファッション トップス パーカー・フーディ",
  "レディースファッション トップス カーディガン",
  "レディースファッション トップス アンサンブル",
  "レディースファッション トップス ベスト・ジレ",
  "レディースファッション トップス ポロシャツ",
  "レディースファッション トップス キャミソール",
  "レディースファッション トップス タンクトップ",
  "レディースファッション トップス チュニック",
  "レディースファッション ボトムス ボトムスその他",
  "レディースファッション ボトムス スカート",
  "レディースファッション ボトムス ミニスカート",
  "レディースファッション ボトムス パンツ",
  "レディースファッション ボトムス ショートパンツ",
  "レディースファッション ボトムス デニム・ジーパン",
  "レディースファッション ワンピース・オールインワン ワンピースその他",
  "レディースファッション ワンピース・オールインワン ワンピース",
  "レディースファッション ワンピース・オールインワン オールインワン・サロペット",
  "レディースファッション ワンピース・オールインワン セットアップ",
  "レディースファッション アウター アウターその他",
  "レディースファッション アウター コート",
  "レディースファッション アウター ジャケット",
  "レディースファッション アウター ダウンジャケット・コート",
  "レディースファッション アウター レザージャケット・コート",
  "レディースファッション アウター ムートン・ファーコート",
  "レディースファッション アウター ダウンベスト",
  "レディースファッション アウター ブルゾン",
  "レディースファッション アウター トレンチコート",
  "レディースファッション アウター ベスト・ジレ",
  "レディースファッション アウター ポンチョ・ケープ",
  "レディースファッション ブライダル・パーティー パーティー小物その他",
  "レディースファッション ブライダル・パーティー ブライダルその他",
  "レディースファッション ブライダル・パーティー パーティードレス",
  "レディースファッション ブライダル・パーティー ボレロ・ショール",
  "レディースファッション ブライダル・パーティー ウェディングドレス",
  "レディースファッション ブライダル・パーティー ウェディングアクセサリー",
  "レディースファッション ブライダル・パーティー ウェディングシューズ",
  "レディースファッション ブライダル・パーティー ブライダル小物",
  "レディースファッション ブライダル・パーティー 引き出物",
  "レディースファッション 水着・ビーチグッズ 水着・ビーチグッズその他",
  "レディースファッション 水着・ビーチグッズ ビキニ",
  "レディースファッション 水着・ビーチグッズ ワンピース水着",
  "レディースファッション 水着・ビーチグッズ タンキニ",
  "レディースファッション 水着・ビーチグッズ ラッシュガード",
  "レディースファッション 水着・ビーチグッズ ボードショーツ・レギンス",
  "レディースファッション 水着・ビーチグッズ うきわ",
  "レディースファッション 水着・ビーチグッズ ビーチタオル",
  "レディースファッション その他ファッション その他",
  "レディースファッション その他ファッション スーツ",
  "レディースファッション その他ファッション コスプレ・衣装",
  "レディースファッション その他ファッション 浴衣・着物・和装",
  "レディースファッション 帽子 帽子その他",
  "レディースファッション 帽子 ハット",
  "レディースファッション 帽子 キャップ",
  "レディースファッション 帽子 ストローハット",
  "レディースファッション 帽子 ニットキャップ・ビーニー",
  "レディースファッション 帽子 ベレー帽",
  "レディースファッション 帽子 ハンチング・キャスケット",
  "レディースファッション ファッション雑貨・小物 ファッション雑貨・小物その他",
  "レディースファッション ファッション雑貨・小物 スカーフ",
  "レディースファッション ファッション雑貨・小物 マフラー・ストール",
  "レディースファッション ファッション雑貨・小物 マスク",
  "レディースファッション ファッション雑貨・小物 手袋",
  "レディースファッション ファッション雑貨・小物 イヤーマフ",
  "レディースファッション ファッション雑貨・小物 ベルト",
  "レディースファッション ファッション雑貨・小物 傘・レイングッズ",
  "レディースファッション ファッション雑貨・小物 ハンカチ",
  "レディースファッション 財布・小物 財布・小物その他",
  "レディースファッション 財布・小物 長財布",
  "レディースファッション 財布・小物 折りたたみ財布",
  "レディースファッション 財布・小物 コインケース・小銭入れ",
  "レディースファッション 財布・小物 カードケース・名刺入れ",
  "レディースファッション 財布・小物 パスケース",
  "レディースファッション 財布・小物 キーケース",
  "レディースファッション 財布・小物 キーホルダー・キーリング",
  "レディースファッション 財布・小物 ポーチ",
  "レディースファッション 財布・小物 バッグチャーム",
  "レディースファッション アクセサリー アクセサリーその他",
  "レディースファッション アクセサリー ネックレス・ペンダント",
  "レディースファッション アクセサリー ピアス",
  "レディースファッション アクセサリー イヤリング",
  "レディースファッション アクセサリー 指輪・リング",
  "レディースファッション アクセサリー ブレスレット",
  "レディースファッション アクセサリー アンクレット",
  "レディースファッション アクセサリー ヘアアクセサリー",
  "レディースファッション アクセサリー パーティーアクセサリー",
  "レディースファッション アクセサリー 天然石・パワーストーン",
  "レディースファッション 腕時計 アナログ腕時計",
  "レディースファッション 腕時計 デジタル腕時計",
  "レディースファッション 腕時計 腕時計用ベルト・バンド",
  "レディースファッション 腕時計 腕時計その他",
  "レディースファッション アイウェア アイウェアその他",
  "レディースファッション アイウェア サングラス",
  "レディースファッション アイウェア メガネ",
  "レディースファッション スマホケース・テックアクセサリー",
  "レディースファッション 靴・シューズ シューズ・サンダルその他",
  "レディースファッション 靴・シューズ スニーカー",
  "レディースファッション 靴・シューズ サンダル・ミュール",
  "レディースファッション 靴・シューズ スリッポン",
  "レディースファッション 靴・シューズ パンプス",
  "レディースファッション 靴・シューズ フラットシューズ",
  "レディースファッション 靴・シューズ ローファー・オックスフォード",
  "レディースファッション 靴・シューズ バレエシューズ",
  "レディースファッション 靴・シューズ パーティーシューズ",
  "レディースファッション 靴・シューズ レインシューズ",
  "レディースファッション ブーツ ブーツその他",
  "レディースファッション ブーツ ショートブーツ・ブーティ",
  "レディースファッション ブーツ ロングブーツ",
  "レディースファッション ブーツ ミドルブーツ",
  "レディースファッション ブーツ レインブーツ",
  "レディースファッション バッグ・カバン バッグ・カバンその他",
  "レディースファッション バッグ・カバン トートバッグ",
  "レディースファッション バッグ・カバン ハンドバッグ",
  "レディースファッション バッグ・カバン ショルダーバッグ・ポシェット",
  "レディースファッション バッグ・カバン バックパック・リュック",
  "レディースファッション バッグ・カバン クラッチバッグ",
  "レディースファッション バッグ・カバン かごバッグ",
  "レディースファッション バッグ・カバン ボストンバッグ",
  "レディースファッション バッグ・カバン パーティーバッグ",
  "レディースファッション バッグ・カバン エコバッグ",
  "レディースファッション インナー・ルームウェア インナー・ルームウェアその他",
  "レディースファッション インナー・ルームウェア ルームウェア・パジャマ",
  "レディースファッション インナー・ルームウェア ブラジャー",
  "レディースファッション インナー・ルームウェア ショーツ",
  "レディースファッション インナー・ルームウェア ブラジャー＆ショーツ",
  "レディースファッション インナー・ルームウェア スリップ・インナー・キャミ",
  "レディースファッション インナー・ルームウェア スパッツ・レギンス",
  "レディースファッション インナー・ルームウェア タイツ・ソックス",
  "レディースファッション ヨガ・フィットネス ヨガ・フィットネスその他",
  "レディースファッション ヨガ・フィットネス フィットネストップス",
  "レディースファッション ヨガ・フィットネス フィットネスボトムス",
  "レディースファッション ヨガ・フィットネス ヨガマット",
  "レディースファッション ヨガ・フィットネス フィットネスバッグ",
  "レディースファッション ヨガ・フィットネス フィットネスシューズ",
  "レディースファッション ヨガ・フィットネス フィットネスアクセサリー",
  "メンズファッション トップス トップスその他",
  "メンズファッション トップス Tシャツ・カットソー",
  "メンズファッション トップス ポロシャツ",
  "メンズファッション トップス シャツ",
  "メンズファッション トップス パーカー・フーディ",
  "メンズファッション トップス スウェット・トレーナー",
  "メンズファッション トップス ニット・セーター",
  "メンズファッション トップス カーディガン",
  "メンズファッション トップス タンクトップ",
  "メンズファッション トップス ベスト・ジレ",
  "メンズファッション アウター・ジャケット アウターその他",
  "メンズファッション アウター・ジャケット コートその他",
  "メンズファッション アウター・ジャケット ジャケットその他",
  "メンズファッション アウター・ジャケット ダウンジャケット",
  "メンズファッション アウター・ジャケット ブルゾン",
  "メンズファッション アウター・ジャケット レザージャケット",
  "メンズファッション アウター・ジャケット ピーコート",
  "メンズファッション アウター・ジャケット ダッフルコート",
  "メンズファッション アウター・ジャケット トレンチコート",
  "メンズファッション アウター・ジャケット ジャージ",
  "メンズファッション アウター・ジャケット ダウンベスト",
  "メンズファッション アウター・ジャケット テーラードジャケット",
  "メンズファッション ボトムス ボトムスその他",
  "メンズファッション ボトムス パンツ",
  "メンズファッション ボトムス デニム・ジーパン",
  "メンズファッション ボトムス ハーフ・ショートパンツ",
  "メンズファッション その他ファッション",
  "メンズファッション スーツ",
  "メンズファッション 水着・ビーチグッズ 水着・ビーチグッズその他",
  "メンズファッション 水着・ビーチグッズ 水着",
  "メンズファッション 水着・ビーチグッズ ラッシュガード",
  "メンズファッション 水着・ビーチグッズ うきわ",
  "メンズファッション 水着・ビーチグッズ ビーチタオル",
  "メンズファッション セットアップ",
  "メンズファッション 帽子 帽子その他",
  "メンズファッション 帽子 ハット",
  "メンズファッション 帽子 キャップ",
  "メンズファッション 帽子 ストローハット",
  "メンズファッション 帽子 ニットキャップ・ビーニー",
  "メンズファッション 帽子 ベレー帽",
  "メンズファッション 帽子 ハンチング・キャスケット",
  "メンズファッション 帽子 サンバイザー",
  "メンズファッション アクセサリー アクセサリーその他",
  "メンズファッション アクセサリー ピアス",
  "メンズファッション アクセサリー イヤリング",
  "メンズファッション アクセサリー アンクレット",
  "メンズファッション アクセサリー ネックレス・チョーカー",
  "メンズファッション アクセサリー ブレスレット",
  "メンズファッション アクセサリー 指輪・リング",
  "メンズファッション 腕時計 腕時計その他",
  "メンズファッション 腕時計 アナログ時計",
  "メンズファッション 腕時計 デジタル時計",
  "メンズファッション アイウェア アイウェアその他",
  "メンズファッション アイウェア サングラス",
  "メンズファッション アイウェア メガネ",
  "メンズファッション 財布・雑貨 雑貨・その他",
  "メンズファッション 財布・雑貨 長財布",
  "メンズファッション 財布・雑貨 折りたたみ財布",
  "メンズファッション 財布・雑貨 キーケース・キーリング",
  "メンズファッション 財布・雑貨 カードケース・名刺入れ",
  "メンズファッション 財布・雑貨 コインケース・小銭入れ",
  "メンズファッション 財布・雑貨 ステーショナリー",
  "メンズファッション ファッション雑貨・小物 ファッション雑貨・小物その他",
  "メンズファッション ファッション雑貨・小物 マフラー",
  "メンズファッション ファッション雑貨・小物 ストール",
  "メンズファッション ファッション雑貨・小物 手袋",
  "メンズファッション ファッション雑貨・小物 ベルト",
  "メンズファッション ファッション雑貨・小物 ネクタイ",
  "メンズファッション ファッション雑貨・小物 傘・レイングッズ",
  "メンズファッション ファッション雑貨・小物 ハンカチ",
  "メンズファッション ファッション雑貨・小物 靴下・ソックス",
  "メンズファッション スマホケース・テックアクセサリー",
  "メンズファッション 靴・ブーツ・サンダル 靴・ブーツ・サンダルその他",
  "メンズファッション 靴・ブーツ・サンダル スニーカー",
  "メンズファッション 靴・ブーツ・サンダル サンダル",
  "メンズファッション 靴・ブーツ・サンダル ドレスシューズ・革靴・ビジネスシューズ",
  "メンズファッション 靴・ブーツ・サンダル ブーツ",
  "メンズファッション バッグ・カバン バッグ・カバンその他",
  "メンズファッション バッグ・カバン ショルダーバッグ",
  "メンズファッション バッグ・カバン トートバッグ",
  "メンズファッション バッグ・カバン ボストンバッグ",
  "メンズファッション バッグ・カバン バックパック・リュック",
  "メンズファッション バッグ・カバン ビジネスバッグ・アタッシュケース",
  "メンズファッション バッグ・カバン クラッチバッグ",
  "メンズファッション インナー・ルームウェア インナー・ルームウェアその他",
  "メンズファッション インナー・ルームウェア アンダーシャツ・インナー",
  "メンズファッション インナー・ルームウェア トランクス",
  "メンズファッション インナー・ルームウェア ブリーフ",
  "メンズファッション インナー・ルームウェア ボクサーパンツ",
  "メンズファッション インナー・ルームウェア ルームウェア・パジャマ",
  "メンズファッション フィットネス フィットネスその他",
  "メンズファッション フィットネス フィットネストップス",
  "メンズファッション フィットネス フィットネスボトムス",
  "メンズファッション フィットネス フィットネスバッグ",
  "メンズファッション フィットネス フィットネスシューズ",
  "メンズファッション フィットネス フィットネスアクセサリー",
  "ライフスタイル 家具・日用品 家具・日用品その他",
  "ライフスタイル 家具・日用品 家具・収納",
  "ライフスタイル 家具・日用品 照明",
  "ライフスタイル 家具・日用品 バス・ランドリー",
  "ライフスタイル 家具・日用品 洗剤・清掃グッズ",
  "ライフスタイル 家具・日用品 ダストボックス(ゴミ箱)・傘立て",
  "ライフスタイル キッチン・ダイニング キッチン・ダイニングその他",
  "ライフスタイル キッチン・ダイニング 調理器具",
  "ライフスタイル キッチン・ダイニング 食器（皿）",
  "ライフスタイル キッチン・ダイニング コップ・グラス・マグカップ",
  "ライフスタイル キッチン・ダイニング タンブラー",
  "ライフスタイル キッチン・ダイニング カトラリー",
  "ライフスタイル キッチン・ダイニング 容器・ストッカー",
  "ライフスタイル キッチン・ダイニング キッチン雑貨",
  "ライフスタイル キッチン・ダイニング テーブルリネン",
  "ライフスタイル キッチン・ダイニング エプロン",
  "ライフスタイル キッチン・ダイニング キッチン収納",
  "ライフスタイル キッチン・ダイニング 料理本",
  "ライフスタイル インテリア雑貨・DIY インテリア雑貨・DIYその他",
  "ライフスタイル インテリア雑貨・DIY ＤＩＹ・工具",
  "ライフスタイル インテリア雑貨・DIY ポスター・ウォールステッカー",
  "ライフスタイル インテリア雑貨・DIY 壁紙",
  "ライフスタイル インテリア雑貨・DIY タペストリー",
  "ライフスタイル インテリア雑貨・DIY ルームフレグランス",
  "ライフスタイル インテリア雑貨・DIY キャンドル",
  "ライフスタイル インテリア雑貨・DIY 時計",
  "ライフスタイル インテリア雑貨・DIY アート・美術品",
  "ライフスタイル ファブリック ファブリックその他",
  "ライフスタイル ファブリック ベッドカバー・リネン",
  "ライフスタイル ファブリック ブランケット",
  "ライフスタイル ファブリック クッション・クッションカバー",
  "ライフスタイル ファブリック ラグ・マット・カーペット",
  "ライフスタイル ファブリック カーテン",
  "ライフスタイル ファブリック タオル",
  "ライフスタイル トラベルグッズ トラベルその他",
  "ライフスタイル トラベルグッズ スーツケース",
  "ライフスタイル トラベルグッズ バッグ",
  "ライフスタイル トラベルグッズ ラゲッジタグ",
  "ライフスタイル トラベルグッズ パスポートケース・ウォレット",
  "ライフスタイル トラベルグッズ トラベルポーチ",
  "ライフスタイル トラベルグッズ トラベル小物",
  "ライフスタイル レジャー・アウトドア レジャー・アウトドアその他",
  "ライフスタイル レジャー・アウトドア バーベキュー・クッキング用品",
  "ライフスタイル レジャー・アウトドア レジャー・ピクニック用品",
  "ライフスタイル レジャー・アウトドア テーブル・チェア",
  "ライフスタイル レジャー・アウトドア 寝袋・シュラフ",
  "ライフスタイル レジャー・アウトドア テント・タープ",
  "ライフスタイル レジャー・アウトドア オートバイ・自転車",
  "ライフスタイル ペット用品 首輪・ハーネス・リード",
  "ライフスタイル ペット用品 ペットキャリー",
  "ライフスタイル ペット用品 洋服",
  "ライフスタイル ペット用品 ペットベッド・ケージ",
  "ライフスタイル ペット用品 おもちゃ・キャットタワー",
  "ライフスタイル ペット用品 フードボウル・えさ関連",
  "ライフスタイル ペット用品 衛生用品",
  "ライフスタイル ペット用品 ペット用品その他",
  "ライフスタイル ホビー・カルチャー ゲーム",
  "ライフスタイル ホビー・カルチャー キャラクターグッズ",
  "ライフスタイル ホビー・カルチャー 模型・プラモデル・ラジコン",
  "ライフスタイル ホビー・カルチャー カメラ・カメラグッズ",
  "ライフスタイル ホビー・カルチャー AV機器(オーディオ・映像)",
  "ライフスタイル ホビー・カルチャー 楽器・音楽機材",
  "ライフスタイル ホビー・カルチャー 手芸・工芸道具",
  "ライフスタイル ホビー・カルチャー 花・ガーデニング",
  "ライフスタイル ホビー・カルチャー ミュージシャン・タレント・映画グッズ",
  "ライフスタイル ホビー・カルチャー 絵本・書籍",
  "ライフスタイル ホビー・カルチャー CD・DVD",
  "ライフスタイル ホビー・カルチャー 衣装・コスチューム",
  "ライフスタイル ホビー・カルチャー パーティーグッズ",
  "ライフスタイル ホビー・カルチャー ホビー・カルチャーその他",
  "ライフスタイル ステーショナリ・文房具 手帳",
  "ライフスタイル ステーショナリ・文房具 鉛筆・ペン・万年筆",
  "ライフスタイル ステーショナリ・文房具 レターセット・ポストカード",
  "ライフスタイル ステーショナリ・文房具 ノート",
  "ライフスタイル ステーショナリ・文房具 ペンケース",
  "ライフスタイル ステーショナリ・文房具 ステーショナリ・文房具その他",
  "ライフスタイル 電子タバコ スターターキット",
  "ライフスタイル 電子タバコ リキッド",
  "ライフスタイル 電子タバコ アクセサリー",
  "ライフスタイル ライフスタイルその他",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーロンパース・カバーオール",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーワンピース",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用トップス",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用ボトムス",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) べビーアウター",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用靴下、タイツ、ブルマ、スパッツ類",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) よだれかけ・スタイ・ビブ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー肌着・下着",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーパジャマ・ルームウェア・スリーパー",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) おくるみ・ブランケット",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーレインコート・レイングッズ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー水着・ビーチグッズ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用コスチューム・着ぐるみ",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー用フォーマル・セレモニーウェア",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビー帽子・手袋・ファッション小物",
  "ベビー・キッズ ベビー服・ファッション用品(～90cm) ベビーその他",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズ用トップス",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズ用ボトムス",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズワンピース・オールインワン",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズアウター",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用靴下、タイツ、ブルマ、スパッツ類",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用肌着・下着",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用パジャマ・ルームウェア・スリーパー",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズスポーツウェア",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用レインコート・レイングッズ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用水着・ビーチグッズ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用コスチューム・着ぐるみ",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用フォーマル・セレモニーウェア",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) 子供用帽子・手袋・ファッション小物",
  "ベビー・キッズ 子供服・ファッション用品(85cm～) キッズその他",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビースニーカー",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーバレエシューズ・フラットシューズ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーサンダル",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーブーツ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーレインブーツ・長靴",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーフォーマルシューズ",
  "ベビー・キッズ ベビーシューズ・靴(～14cm) ベビーシューズ・靴その他",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズスニーカー",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズバレエシューズ・フラットシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズサンダル",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズブーツ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズレインブーツ・長靴",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズルームシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズフォーマルシューズ",
  "ベビー・キッズ キッズシューズ・子供靴(14.5cm～) キッズシューズ・靴その他",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティトップス",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティパンツ・スカート",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティレギンス・タイツ",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティワンピース",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティコート・アウター",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティ下着・肌着",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティパジャマ・ルームウェア",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティ水着・フィットネス・スポーツウェア",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティドレス・フォーマル",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ 母子手帳ケース",
  "ベビー・キッズ マタニティウェア・授乳服・グッズ マタニティウェア・授乳服・グッズその他",
  "ベビー・キッズ マザーズバッグ 子供用リュック・バックパック",
  "ベビー・キッズ マザーズバッグ 子供用トート・レッスンバッグ",
  "ベビー・キッズ マザーズバッグ 子供用ショルダー・ポシェット・ボディバッグ",
  "ベビー・キッズ マザーズバッグ キッズバッグ・財布その他",
  "ベビー・キッズ キッズバッグ・財布 子供用リュック・バックパック",
  "ベビー・キッズ キッズバッグ・財布 子供用トート・レッスンバッグ",
  "ベビー・キッズ キッズバッグ・財布 子供用ショルダー・ポシェット・ボディバッグ",
  "ベビー・キッズ キッズバッグ・財布 キッズバッグ・財布その他",
  "ベビー・キッズ ベビーカー",
  "ベビー・キッズ チャイルドシート(ベビー/ジュニア)",
  "ベビー・キッズ 抱っこ紐・スリング・ベビーキャリア",
  "ベビー・キッズ おしゃぶり・授乳・離乳食グッズ",
  "ベビー・キッズ 赤ちゃん用スキンケア",
  "ベビー・キッズ おもちゃ・知育玩具 プレイマット・ベビーマット",
  "ベビー・キッズ おもちゃ・知育玩具 ガラガラ・ラトル",
  "ベビー・キッズ おもちゃ・知育玩具 ぬいぐるみ・フィギュア・ドールハウス",
  "ベビー・キッズ おもちゃ・知育玩具 おままごとセット",
  "ベビー・キッズ おもちゃ・知育玩具 ブロック・パズル・ゲーム",
  "ベビー・キッズ おもちゃ・知育玩具 絵本・ぬり絵・シール",
  "ベビー・キッズ おもちゃ・知育玩具 ミニカー・電車・乗り物おもちゃ",
  "ベビー・キッズ おもちゃ・知育玩具 バストイ・水遊びグッズ",
  "ベビー・キッズ おもちゃ・知育玩具 おもちゃ・知育玩具その他",
  "ベビー・キッズ キッズ・ベビー・マタニティその他",
]

module.exports = {IPCInitialize}