#### Intro: Breaking Up with My Server

Big news: NCC has moved house!

It started when Alibaba Cloud slid into my DMs like a bureaucratic ex, demanding I fix some ICP filing I forgot years ago. I tried to re-apply multiple times, but got rejected every time (turns out I checked the wrong jurisdiction box... **massive facepalm**).  
On top of that, my old 200M server was running like a **potato**. It was lagging so hard I thought I was on dial-up. So, I found Hostdare's CN2 GIA route in the US. $12 a month, no lag, and bandwidth that actually works? **Stonks**. 📈

While backing up, I realized my old WordPress blog was a dinosaur. Every page load was a spinning wheel of death. The PHP backend was working overtime just to render a header. It felt bloated.  
Then I remembered the static site gang: Hexo, Hugo, etc. Perfect for CDN caching and speed. Plus, I get to **Marie Kondo** (delete) all those weird WordPress features I never use. It sparks joy.

**NCC chose **Hugo**.**

If WordPress is a slow-motion chef cooking every meal to order, Hugo is a gigafactory. It pre-compiles all your articles into static HTML "Meal Prep." When a guest arrives, Nginx just serves the plate.  
This architecture is so efficient that even a PC from the Windows 95 era could run it. Pair it with a CDN, and you’re looking at **zero-cost scaling**. Blazingly fast. 🔥

#### Hugo Initialization (hugo初始化)

Hugo isn't high-maintenance like WordPress. It's just a CLI tool. Run this, and boom, you have a file structure:

```bash
hugo new site . --force
```

For the love of code, please use Git. If you aren't using version control in 2024, are you even a developer?

```bash
git init
git checkout main
git add .
git commit -m "initialize"
git remote add origin https://{Change_This_to_Your_Git_Repository_URL}
git push -u origin main
```


#### Picking a Theme: The Tinder of Tech

Choosing a Hugo theme is a whole discipline. Strictly speaking, it's a template, but Hugo comes naked (no default theme). You have to go shopping on the `Hugo Themes` site.  
But here's the **red flag**: A lot of themes are maintained by random people in the open-source community. Quality varies wildy. Don't just swipe right because it looks pretty. Check the **GitHub Stars**, **Issue activity**, and **Docs**. Otherwise, you'll end up debugging someone else's spaghetti code at 3 AM.

NCC swiped right on [Hello Friend NG](https://github.com/rhazdon/hugo-theme-hello-friend-ng) . Clean docs, minimalist vibe.  
Pro tip: Install it via **Git Submodule**. Don't just download the zip file like a caveman. This way, you can pull updates easily.

```bash
git submodule add https://github.com/rhazdon/hugo-theme-hello-friend-ng themes/hugo-theme-hello-friend-ng
```


#### The Config File: Go's "Magic Number" (配置文件)

The config comes _after_ the theme? Yeah, Hugo is quirky like that. You only need to touch `hugo.toml`.

**MAJOR WARNING**: There is a date format setting involving `Jan 02, 2006`.  
I thought, "Why is this stuck in 2006? Let me update it to today." **Big mistake.**  
I broke the entire frontend.  
Turns out, **Jan 2 2006 at 15:04** is Go language's specific reference time for formatting. It's a magic number. DO NOT TOUCH IT.

Here is the **production-ready** config NCC scraped together after stepping on multiple landmines (includes the fix for the i18n routing nightmare mentioned later):

```toml
baseURL = 'https://blog.nancunchild.cn/'
languageCode = 'zh-CN'
title = 'NanCunChild的碎碎念'
theme = 'hugo-theme-hello-friend-ng'
pagination.pagerSize = 10
defaultContentLanguage = 'zh-cn' # just change this into your first language, then it can be the default one
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
            [languages.zh.params.homeInfoParams]
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

#### Automating the Deploy: Work Smarter, Not Harder

The goal is an elegant workflow.  
Writing happens locally. NCC recommends VS Code (with Markdown extensions) or **Obsidian**. Obsidian is basically a second brain; the UI is distraction-free, letting you enter a "flow state."

Now for deployment. We aren't going to manually upload files via FTP like it's 1999. We want **CI/CD**.  
The dream: Write locally -> `git push` -> Server updates automatically.

NCC initially thought building on GitHub would be slow, but it takes literally 5 seconds on a free Linux runner. So I decided to hand the keys to **GitHub Actions**. It's way cleaner than having the server poll GitHub constantly.  
Here is the workflow file (feel free to steal it):

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

**Security Check**: Create a dedicated, low-privilege user on your server for this. Least Privilege Principle, folks. Don't let GitHub have root access, or you're gonna have a bad time.

#### The Final Boss: i18n

I thought I was done. I thought I could touch grass. But then **i18n** (internationalization) punched me in the face.  
I set up English, Japanese, and Chinese. English worked. Japanese worked. Chinese? **404 Not Found**.  
I spent 2 hours doom-scrolling through source code and Nginx logs. I eventually asked **Gemini** (because AI is smarter than me... always).

The culprit?  
The Simplified Chinese file is named `zh-CN.toml`. In the config, I had `languageCode = 'zh'`. It _needed_ to be `zh-cn`.  
While other languages have 2-letter codes, Chinese needs 4. And I have to append `.zh-cn.md` to my filenames. **Case sensitivity** is the real villain here. So, just check if your first language has the same situation like this.

#### Current Status

Now, NCC's blog is running inside a Dockerized Nginx container.

- **Performance**: 5% CPU usage under load. Instant load times.
- **Security**: Static files mean **SQL Injection is impossible**. Hackers can cry about it.
- **Experience**: Write in Obsidian -> Git Push -> Auto-deploy.

It works like a charm. And if GitHub Actions fails, it emails me immediately. It's the ultimate peace of mind.