## 前言
NCC换服务器啦！

NCC最近被阿里云发邮件让补多年前忘记申请的公网安备，但是多次申请总是没通过（后来才知道填错管辖区了）。正好又对阿里云200M锐驰服务器的经常卡顿有点不满（因为只是满速为200Mbps，完全没有保底速度，而且晚高峰延迟不行），于是找到了Hostdare的美国服务器CN2 GIA线路，一个月要12刀，但是不像其它海外服务器一样卡顿，国内直连带宽也不错。

备份旧服务器时看到原先的博客是Wordpress，每次加载都得转圈，背后的PHP一直在动态加载界面放在前端，特别是进入管理页面很卡。于是想起了Hexo，Hugo等静态博客，不仅方便CDN托管，速度应该也会快上不少。而且同时舍弃掉WordPress里面一堆用不到的奇怪功能也更清爽。

NCC 想起了 **Hugo**

如果说 WordPress 是个现炒现卖的厨师，那 Hugo 就是个食品加工厂。它把所有文章一次性编译成静态 HTML 预制菜，客人来了，Nginx 直接端盘子就行。  
这种架构，别说现在的云服务器，就算是二十年前的电脑也能跑得飞快，而且配合 CDN 简直是0成本并行接待，速度起飞。

## hugo初始化

Hugo 不像 WordPress 需要复杂的环境，它只是一个命令行工具。运行这个指令可以直接得到它需要的文件结构：
```bash
hugo new site . --force
```

为了方便后续管理，强烈建议使用 Git 或者你喜欢的版本跟踪器来跟踪整个项目：
```bash
git init
git checkout main
git add .
git commit -m "initialize"
git remote add origin https://{Change_This_to_Your_Git_Repository_URL}
git push -u origin main
```
## 选择主题

Hugo选择主题也是一门学问，严格来说这个主题是一个非常重要的生成模板，而且这个Hugo没有所谓开机自带默认主题。可以自己去 `Hugo Theme` 网站选一个看起来喜欢的。
但是这里有个**巨大**的坑：很多主题是开源社区维护的，质量参差不齐。选主题不能光看颜值，一定要看 **GitHub Star 数**、**Issues 活跃度** 以及 **文档** 是否齐全。否则你可能会遇到各种玄学 Bug，最后只能对着源码发呆。

NCC 最终看中了 [Hello Friend NG](https://github.com/rhazdon/hugo-theme-hello-friend-ng) 这个主题，文档齐全且看起来很清爽。  
安装主题推荐使用 Git Submodule（子模块）的方式，这样方便后续更新：

看中喜欢的主题之后记下它的源码URL，NCC看中了 `hello-friend-ng` 这个主题，安装主题推荐使用 **Git Submodule** 的方式，而不是直接下载解压，这样方便后续跟随作者更新：
```bash
git submodule add https://github.com/rhazdon/hugo-theme-hello-friend-ng themes/hugo-theme-hello-friend-ng
```

## 配置文件
配置文件居然在选择主题之后！是的，因为hugo的配置文件依赖于你选择的主题（感觉有点不太聪明的组织方式）。
你所需要配置的文件只有`hugo.toml`这一个，这回指导hugo进行所有任务。

**注意**：配置文件里有一个 `dateFrom` 相关的日期格式，这是一个 Go 语言特有的“魔法数字”。NCC 起初以为要改成当前日期，还在思考怎么这个项目从 2006 年就开始了，结果一改就导致博客前端日期全崩了。后来查阅官方文档才知道，**2006 年 1 月 2 日 15 点 04 分** 是 Go 语言的时间格式化标准，不能乱动。

随后就可以在`hugo.toml`里面指定 `theme = 'hugo-theme-hello-friend-ng'` 了。以下是 NCC 踩坑后总结出的 **生产环境可用配置**（解决了后面提到的多语言路由问题）：
```
baseURL = 'https://blog.nancunchild.cn/'
languageCode = 'zh-CN'
title = 'NanCunChild的碎碎念'
theme = 'hugo-theme-hello-friend-ng'
pagination.pagerSize = 10
defaultContentLanguage = 'zh-cn' # 加入这个可以让访问中文博客时路径中没有zh-cn，而是将中文作为默认
defaultContentLanguageInSubdir = false

[params]
	# 不要手欠改日期
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
	# 这里需要是zh-cn，而不是zh短码
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



而且还可以注意一下，如果不准备使用多语言，可以不管`[language]`标签，直接使用`[menu]` 标签即可，同时设置 `enableGlobalLanguageMenu = false` ：
```toml
[menu]
    [[menu.main]]
        identifier = "posts"
        name = "文章"
        url = "/posts/"
        weight = 10
    [[menu.main]]
        identifier = "archives"
        name = "归档"
        url = "/archives/"
        weight = 20
```

## 自动化上传博客
上传博客有多种方式，平时写博客就只需要一个符合hugo标准的markdown文件，通过hugo编译好之后放在服务器上，你配置的nginx会很听话地照顾这些静态文件。而我们的目标是让这个过程变优雅。

首先，写博客当然在本地，NCC推荐VS Code安装MD扩展、以及Obsidian两款软件来写。使用VSCode可以在任意地方写，然后自己使用喜欢的版本控制软件管理。使用Obsidian的话它会有一个Vault位置用于存放，而且登录账户了似乎可以云存储。两个在管理上都非常不错，在操作习惯和界面上各有千秋。不过NCC总是觉得Obsidian的界面很不错，简单从而不会分心，自带无需配置的快速预览，面对这样的界面更能专注写文章。

第二步，将Markdown格式的博客原文使用hugo编译为网站代码。这一步说法就超多啦！本地下载一个hugo，写完就编译，还能本地查看，满意之后就使用自己喜欢的方式传入服务器，应该是大多数人的选择。不过NCC喜欢更符合工作流的方式，就是希望版本管理和远程同步能一键完成而不是胶水粘合，此时看来使用git是一个非常不错的选择，于是在开始提出两种方案：
- 本地编写，使用git push到服务器上，服务器检测到仓库变动就马上唤起hugo编译部署，一气呵成。
- 本地编写，使用git push到GitHub，GitHub帮忙编译之后使用某些方法传到服务器上。

NCC第一次接触Hugo，误以为编译时间会比较长，可能比较消耗性能，于是选择了把任务交给Github（但是实际上几篇博客编译出来，只有单核的Linux机器编译时间不超过5秒钟），所以NCC做了这个不算非常安全的决定，将一个用户的登录权限交给GitHub，让它自己登录服务器去更新网页。这比让服务器不断轮询GitHub，GitHub还得永久保存编译后文件给它留着的主动方式方便很多，算是使用些微的安全性更换了巨大的便利。
所以目前的情况是这样的：NCC在终端写好博客，使用git上传到GitHub，GitHub上的CI/CD发力编译出成品，然后使用ssh链接到NCC的服务器，使用rsync同步编译文件。

这里是NCC的workflow文件，大家可以抄抄作业：
```yml
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

接下来记得给GitHub创建一个非特权账户，然后指定SSH密钥之后，将私钥导入进这个项目的SecretVariable里面，它会替换这里面的变量值，同时也防止别人看到。永远记住权限最小原则，只允许GitHub上传用的用户使用这个网站目录，必要时可以使用SELinux安全上下文约束它。

## 遇到i18n
NCC以为一切已经落定，只剩下i18n这朵乌云也是优化配置很快可以解决的时候。i18n和历史遗留问题给NCC迎面一拳。NCC使用了中文，英文，日语三国语言，准备之后给每篇博客都配三语内容，但是发现英文可以索引到正确文章，日语也可以，就只有中文不行，只要访问中文博客和路径，就会变成404，或者回退到英文显示。接下来就是为期2小时的翻源码，找引用，拆开i18n，逐行核对Nginx配置，问Gemini的时间。最终找到一个可疑点，询问Gemini后发现就是问题所在。

i18n中定义的简体中文文件名是 `zh-CN.toml`，所以不能简单在配置文件中指定 `[languageCode = 'zh']`，而必须是 `[languageCode = 'zh-cn']`。因为此外还有 `zh-tw`, `zh-hk` 等。在其它国家语言代码都只有两位的时候，这玩意有4位。而且之后写中文博客还需要添加 `.zh-cn.md` 后缀才行。

## 目前情况
现在，NCC 的博客完全运行在 Docker 容器中的 Nginx 上。
- **性能**：10 个并发访问时 CPU 占用不足 5%，秒开。
- **安全**：静态文件天然免疫 SQL 注入和 PHP 漏洞。
- **体验**：本地 Obsidian 写作 -> Git Push -> 全自动上线。

超优雅的哇，而且GitHub Action失败了还会给你发邮件，既能防止配置错误造成博客宕机，还可以第一时间看到部署情况。