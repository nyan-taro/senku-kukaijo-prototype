# 🎋 千空句会所 - Prototype

シンプルなメモ管理アプリ（静的サイト版）

## 特徴

✨ **シンプル**: HTML/CSS/JavaScript のみで動作
💾 **オフライン対応**: ローカルストレージでデータを保存
📱 **レスポンシブ**: スマートフォンからPCまで対応
🚀 **サーバー不要**: GitHub Pages で即座に公開可能
⚡ **軽量**: npm install 不要、ブラウザだけで完結

## 機能

- ✅ アイテムの追加・編集・削除
- ✅ ローカルストレージでのデータ永続化
- ✅ タイムスタンプ自動記録
- ✅ レスポンシブデザイン
- ✅ アニメーション付きUI

## 使い方

### ローカルで試す

1. リポジトリをクローン
```bash
git clone https://github.com/nyan-taro/senku-kukaijo-prototype.git
cd senku-kukaijo-prototype
```

2. ブラウザで `index.html` を開く
```bash
# Macの場合
open index.html

# Linuxの場合
xdg-open index.html

# Windowsの場合
start index.html
```

または、簡易サーバーを起動:
```bash
# Python 3
python -m http.server 8000

# Node.js (http-serverがインストール済みの場合)
npx http-server
```

### GitHub Pages で公開

1. GitHub リポジトリの Settings > Pages へ移動
2. Source で `Deploy from a branch` を選択
3. Branch で `main` (または `master`) を選択
4. Save をクリック

数分後、`https://[ユーザー名].github.io/senku-kukaijo-prototype/` でアクセス可能になります。

## ファイル構成

```
senku-kukaijo-prototype/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css       # スタイルシート
├── js/
│   └── app.js          # アプリケーションロジック
└── README.md           # このファイル
```

## 技術スタック

- **HTML5**: セマンティックなマークアップ
- **CSS3**: モダンなスタイリング、Flexbox、Grid、アニメーション
- **Vanilla JavaScript**: ピュアJavaScript（ライブラリ不要）
- **LocalStorage API**: データの永続化

## キーボードショートカット

- `Enter`: タイトル入力後に送信
- `Ctrl/Cmd + Enter`: 内容入力中に送信

## ブラウザサポート

モダンブラウザに対応:
- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)

## ライセンス

MIT License

## 作者

nyan-taro 🐱