---
title: "さらばWordPress！NCCのHugo静的ブログ移行録"
date: 2025-11-27T22:38:21+08:00
draft: false
toc: false
images:
tags:
  - tech
description: "WordPressからHugoへ。阿里云からHostdareへのサーバー移転と、Docker+Nginxによる爆速静的サイト構築の完全ガイドです。Hello Friend NGテーマの設定、GitHub Actionsを用いたCI/CD自動デプロイの構築手順を解説。さらに、初心者がハマりやすいGo言語の日付フォーマットの罠や、多言語化（i18n）におけるルーティングエラーの解決策など、実用的な技術Tipsを共有します。"
---

さらば、NCCの重いサーバーよ～　NCC、サーバー引っ越しました！
事の発端は、阿里云から届いた「おい、公的機関への登録（ICP）忘れてるぞ」というメール。再申請を試みるも連敗続き（後で管轄エリアの間違いだと判明…トホホ）。

加えて、既存の200Mサーバーが **「ジャガイモサーバー」** 並みに重いことに不満が爆発（最低限度額のバンド幅じゃない）。そこで、HostdareのCN2 GIA回線（米国）を発見。月額12ドルで、他の海外サーバーのようなラグもなく、中国国内からのアクセスも爆速です。

バックアップ中に気づいたのが、旧ブログのWordPressの重さ。アクセスのたびにローディングの　**「グルグル」**　を見せられ、バックグラウンドではPHPが必死に動いている…。管理画面に入るだけで一苦労です。  
そこで頭をよぎったのが、HexoやHugoなどの静的サイトジェネレーター。「これならCDNも使えるし、WordPressの不要な機能ともオサラバして **断捨離** できる！」と思い立ちました。

**NCCは「Hugo」を装備した！**

WordPressが「客の注文を受けてから料理を作るシェフ」なら、Hugoは「食品加工工場」です。全記事を一気にコンパイルして、静的HTMLという **「作り置き」** にする。客が来たら、Nginxはそれを皿に出すだけ。  
このアーキテクチャなら、現代のクラウドサーバーどころか、20年前の化石PCでも爆速で動きます。CDNと組み合わせれば、コストゼロで大量アクセスを捌ける。まさに **「神」** 。

## Hugoの初期化 (Hugo Initialization)

HugoはWordPressのような複雑な環境構築は不要。コマンドライン一つで終わります。  
以下のコマンドで、必要なディレクトリ構造が**召喚**されます：

```bash
hugo new site . --force
```

後の管理のために、Gitでバージョン管理することを**強く推奨（というより義務）**　します：

```bash
git init
git checkout main
git add .
git commit -m "initialize"
git remote add origin https://{Change_This_to_Your_Git_Repository_URL}
git push -u origin main
```

## テーマ選び：それは「沼」

Hugoのテーマ選びは、ある意味「ガチャ」です。  
公式テーマサイトには沢山のテーマがありますが、ここには**巨大な落とし穴**があります。多くのテーマは個人開発で、品質がピンキリです。見た目だけで選ぶと、後でバグだらけのコードを見て **「虚無顔」**になる羽目になります。  
選ぶときは **GitHubのStar数**、**Issuesの活発さ**、**ドキュメント** を必ずチェックしましょう。

NCCは最終的に [Hello Friend NG](https://github.com/rhazdon/hugo-theme-hello-friend-ng) を選びました。ドキュメントが丁寧でデザインもスッキリしています。  
インストールは `git clone` ではなく、**Git Submodule** を使うのがベストプラクティスです。作者の更新に追従しやすくなります。
```bash
git submodule add https://github.com/rhazdon/hugo-theme-hello-friend-ng themes/hugo-theme-hello-friend-ng
```

## 設定ファイル：Go言語の洗礼

設定ファイルは `hugo.toml` 一つだけ。これがHugoのすべてを司ります。

**注意点（ハマりポイント）**：  
日付フォーマットの設定に `Jan 02, 2006` という謎の日付が出てきます。NCCは最初、「なんで2006年？このプロジェクトそんなに古いの？」と思い、現在の日付に変えてしまいました。  
結果、ブログの日付が全壊。  
実はこれ、Go言語特有の **「仕様」**なんです。 **2006年1月2日 15時04分**という数字の並びがフォーマットの基準になっています。これは **「初見殺し」**すぎる…。

以下は、NCCが数々の**地雷**を踏み抜いた末に辿り着いた、**本番環境用コンフィグ**です（多言語対応のルーティング問題も解決済み）：

```toml
baseURL = 'https://blog.nancunchild.cn/'
languageCode = 'zh-CN'
title = 'NanCunChild的碎碎念'
theme = 'hugo-theme-hello-friend-ng'
pagination.pagerSize = 10
defaultContentLanguage = 'zh-cn'
defaultContentLanguageInSubdir = false

[params]
    dateform        = "Jan 02, 2006"
    dateformShort   = "Jan 02"
    dateformNum     = "2006-01-02"
    dateformNumTime = "2006-01-02 15:04"

    subtitle = "NCC的碎碎念"
    description = "NanCunChild的个人博客，包含生活，技术和幻想"
    keywords = "homepage, blog, nancunchild, tech"
    images = ["assets/web_icon.ico"]
    disableReadOtherPosts = false

    enableSharingButtons = false
    enableGlobalLanguageMenu = true

    defaultTheme = "auto"

    [params.author]
        name = "NanCunChild"

    [params.contact]
        email = 'nancunchild@gmail.com'
    

[languages]
    [languages.zh-cn]
        languageCode = 'zh-CN'
        languageName = '中文'
        weight = 1
        title = 'NanCunChild的碎碎念'
        [languages.zh-cn.params]
            subtitle = '生活、技术与幻想'
            [languages.zh-cn.params.homeInfoParams]
                Title = "你好 👋"
                Content = "欢迎来到NCC的碎碎念"

        [[languages.zh-cn.menu.main]]
            identifier = "about"
            name = "关于我"
            url = "/about/"
            weight = 5
        [[languages.zh-cn.menu.main]]
            identifier = "posts"
            name = "文章"
            url = "/posts/"
            weight = 10
        [[languages.zh-cn.menu.main]]
            identifier = "archives"
            name = "归档"
            url = "/archives/"
            weight = 20

    [languages.en]
        languageCode = 'en-US'
        languageName = 'English'
        weight = 2
        title = "NanCunChild's Blog"
        [languages.en.params]
            subtitle = 'Tech, Life and Fantasy'
            [languages.en.params.homeInfoParams]
                Title = "Hi there 👋"
                Content = "Welcome to NCC's Blog"

        [[languages.en.menu.main]]
            identifier = "about"
            name = "About"
            url = "/en/about/"
            weight = 5
        [[languages.en.menu.main]]
            identifier = "posts"
            name = "Posts"
            url = "/en/posts/"
            weight = 10
        [[languages.en.menu.main]]
            identifier = "archives"
            name = "Archives"
            url = "/en/archives/"
            weight = 20

    [languages.ja]
        languageCode = 'ja-JP'
        languageName = '日本語'
        weight = 3
        title = 'NanCunChildのブログ'
        [languages.ja.params]
            subtitle = '生活、技術とファンタジー'
            [languages.ja.params.homeInfoParams]
                Title = "こんにちは 👋"
                Content = "NCCのブログへようこそ"

        [[languages.ja.menu.main]]
            identifier = "about"
            name = "プロフィール"
            url = "/ja/about/"
            weight = 5
        [[languages.ja.menu.main]]
            identifier = "posts"
            name = "記事一覧"
            url = "/ja/posts/"
            weight = 10
        [[languages.ja.menu.main]]
            identifier = "archives"
            name = "アーカイブ"
            url = "/ja/archives/"
            weight = 20
```

## ブログ更新の自動化：ロマンを求めて

ブログを書く流れを**エレガント**にしたい。  
執筆はローカルの VS Code (MD拡張機能) か Obsidian で行います。特に Obsidian は余計なものがなく、**「Zenモード」**で執筆に集中できるのでお気に入りです。

デプロイ（アップロード）の手法ですが、NCCは「手動でアップロード」なんて泥臭いことはしたくありません。  
**「Git Push したら勝手に更新される」**。これこそがエンジニアの**ロマン**です。

NCCのワークフローはこうです：

1. 端末で記事を書く
2. GitHubへPush
3. GitHub Actions (CI/CD) がビルド
4. rsync でサーバーへデプロイ

NCCは最初、「ビルドなんてGitHubに任せたら遅いのでは？」と思っていましたが、実際は数秒で終わります。サーバーに負荷をかけず、GitHubに働いてもらう。セキュリティ的にも、サーバーがGitHubへポーリングするより、鍵認証でPushさせる方がスマートです。

以下がNCCの**秘伝のタレ**です：

```toml
name: Deploy Hugo to NCC Server

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: true
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Setup SSH Key
        uses: shimataro/ssh-key-action@v2
        with:
          key: ${{ secrets.SSH_KEY }}
          known_hosts: 'just-a-placeholder-so-we-dont-get-errors'
          if_key_exists: replace

      - name: Add Known Hosts
        run: ssh-keyscan -H ${{ secrets.HOST }} >> ~/.ssh/known_hosts

      - name: Deploy with rsync
        run: |
          # attention, path problem
          rsync -avz --delete public/ ${{ secrets.USER }}@${{ secrets.HOST }}:/var/www/ncc_sites/ncc_blog/html
```

**セキュリティの基本**：GitHub用のユーザーは権限を絞りましょう。「最小権限の原則」です。

## ラスボス：i18n

すべて順調かと思いきや、最後の最後に**i18n（国際化）**というラスボスが立ちはだかりました。  
日・英・中の3ヶ国語対応を目指したのですが、なぜか中国語（簡体字）だけ 404 エラーになるか、英語に戻される…。  
ここから2時間、ソースコードを読み漁り、Nginxの設定を睨みつけ、Gemini先生に泣きつく**デバッグ地獄**が始まりました。

犯人は **「言語コード」** でした。  

簡体字のファイル名は `zh-CN.toml` なので、設定ファイルでも `[languageCode = 'zh']` ではなく `zh-cn` と明記する必要があったのです。他の言語は2文字なのに、中国語だけ4文字…。  

まさに**罠**でした。幸いなことに日本語は必要ありません。

## 現在の状況

現在、NCCブログは Docker コンテナ内の Nginx で稼働中。

- **性能**：爆速。CPU使用率は誤差レベル。
- **安全**：静的ファイルなので SQLインジェクション？何それおいしいの？状態。
- **体験**：Obsidianで書く -> Push -> 自動デプロイ。

**「圧倒的成長」**を感じる快適さです。GitHub Actionsが失敗したらメールで教えてくれるので、枕を高くして眠れます。