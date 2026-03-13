---
title: "Pokapoka搞破坏————对Polytopia游戏的外挂开发"
date: 2026-03-12T23:23:30+08:00
draft: false
toc: false
images:
tags:
  - tech
  - pokapoka
  - android
  - google_play
  - games
description: "Midjiwan公司快点放弃抵抗直接开源Polytopia罢"
---

## Pokapoka栏目统一警告

本栏目所有文章仅供安全研究与技术交流，漏洞已反馈或测试仅限于本人授权范围内的设备。

## 前情提要

NCC很早玩过一款游戏，名叫Polytopia，中文译名叫“低模之战”。是一款回合制战棋游戏，玩法与 文明VI 一致，但是全都使用多边形抽象几何人物，反而有一种抽象的简洁美。

最近又玩到了这个，但是在玩了几次单机版之后发现官方没有修改器，没有地图编辑器，没有局域网联机！我没法自己玩一玩虐人机爽图，满分通关人机关卡难度极高，想和别人一起玩还得让别人买游戏。想到这里就觉得自己这个钱花的不值当，Steam上全民族捆绑包需要200元人民币，Play上一个民族几十块钱。当时心里就觉得这游戏没文明VI好，还比它圈更多钱，看不惯了（据说这是ElonMusk最喜欢的游戏，毕竟人家不差钱）。也正好从逆向Android游戏中获取一点经验。

## Android逆向前置知识

过去Android权限管理松懈的时代，涌现出很多“八门神器”，“葫芦侠修改器”，“多玩我的世界盒子”这样的修改器。这些软件当时都不需要手机的root或者adb权限，直接就能启动游戏而且在游戏之上产生一个悬浮窗，点开悬浮窗就能修改游戏内容。这种原理是用了虚拟空间技术，让游戏在自己程序的空间里面跑起来，又因为以前很多游戏是Java编写，转入虚拟空间运行性能损失并不大，进而能使用这种方法修改自己产生进程内的游戏数据。

但是后续很多游戏使用Unity等高级引擎开发，底层直接变成了Cpp源码；而且Android10, Android12等更新大幅缩减了SELinux策略和将进程隔离机制严格化，传统的虚拟引擎很容易因为后台问题直接被系统杀死。因此现在这么做的很少了，基本都是自己完全实现一个完整虚拟机，里面再跑游戏；或者是直接需要root权限来获得全局视野。

不过NCC正好root了手机，root权限在手，调试和开了天眼一样超方便的。

既然使用了root权限，那放在面前的是三条道路：

- 使用frida动态调试，直接对游戏内部函数进行hook。这样还能开发一个方便的frida引擎的app，直接能离开电脑修改游戏。
- 使用root权限调用ptrace，直接访问 `/proc/[GameID]/maps` 进行最直接的内存读写。运行效率会很高，但是不好离开电脑或者已经root的手机进行修改。
- 使用LSPosed框架动态加载，只需要写一个模块，代码就能直接加载进游戏文件中，开发UI等等都会很方便，但是也一样没法离开root手机环境。

不过无论使用哪一种，首先都得进行静态分析，确认架构后细化注入方向。在电脑进行frida动态调试修改证明可行后，接下来才能动手制作离开电脑或者root环境的修改app。

本来使用GG修改器可以比较方便和直观地看到游戏内数据，和大名鼎鼎的Cheate Engine一样傻瓜式搜索和一键列出对于找函数非常方便，但是目前手机普遍放弃了对32位应用的支持，导致多年前官方开发的GG修改器已经没法运行了，而社区版本的64位版本没有信誉而且使用比较麻烦。因此NCC准备还原古法工艺，直接拿上凿子开始硬凿：使用解包解密进行静态分析，如果打包的IL2CPP类型，就可以使用开源工具直接dump出游戏内部的数据结构。毕竟对于这种底层已经变成机器码的程序，frida进入之后只能看到各种没有注释的符号和汇编指令，而不像JVM中可以直接找到函数的类名，变量名。所以必须要静态分析找出哪个偏移量对应哪个函数。

### Frida介绍

超超超牛逼的调试器！它分为运行在手机上的服务端和电脑上的客户端，手机上使用root权限执行，电脑上遥控它注入哪一个进程，在哪里执行什么脚本，完全一键搞定，而且使用语言还是JavaScript或者Python，非常好上手。不用安装任何app，只需要二进制执行就好了（注意，由于环境隔离和耗电管理，不推荐使用Termux或者其它终端模拟器，直接使用adb shell效果是最稳定的）。

## pokapoka

通过在官网查看开发日志，开发组人员名单和技能，还有进行解包，确定这个游戏使用Unity进行开发，IL2CPP进行封装。
NCC直接选择双管齐下，一方面使用IL2CPPDUMP静态分析和frida动态调试，一方面找找地图文件看看能不能直接修改存档。

### 找存档尝试

找存档一般就那几个路径：
`/data/data/air.com.midjiwan.polytopia/`
`/sdcard/Android/data/polytopia`（这个被证实没有）
`/sdcard/polytopia` （这个被证实也没有）

只有第一个找到了东西：

```text

NCCMOBILE:/data/data/air.com.midjiwan.polytopia # tree .
.
├── cache
│   ├── app_resources_lib.jar
│   ├── google_api_resources_lib.jar
│   ├── oat
│   │   └── arm64
│   │       ├── app_resources_lib.vdex
│   │       └── google_api_resources_lib.vdex
│   └── oat_primary
│       └── arm64
│           └── base.art
├── code_cache
├── databases
│   ├── com.google.android.datatransport.events
│   ├── com.google.android.datatransport.events-journal
│   ├── google_app_measurement_local.db
│   └── google_app_measurement_local.db-journal
├── files
│   ├── FIREBASE_CLOUD_MESSAGING_LOCAL_STORAGE
│   ├── PersistedInstallation.W0RFRkFVTFRd+MTo1MjgwMTc0NzY2Njk6YW5kcm9pZDpkYWZhMjA2OTFmOGFmNTFhM2MyZTU0.json
│   ├── generatefid.lock
│   ├── phenotype
│   │   └── shared
│   │       └── com.google.android.gms.measurement#air.com.midjiwan.polytopia.pb
│   └── phenotype_storage_info
│       └── shared
│           └── storage-info.pb
├── no_backup
│   └── com.google.android.gms.appid-no-backup
└── shared_prefs
    ├── FirebaseHeartBeatW0RFRkFVTFRd+MTo1MjgwMTc0NzY2Njk6YW5kcm9pZDpkYWZhMjA2OTFmOGFmNTFhM2MyZTU0.xml
    ├── air.com.midjiwan.polytopia.v2.playerprefs.xml
    ├── com.google.android.gms.appid.xml
    ├── com.google.android.gms.measurement.prefs.xml
    └── com.google.firebase.messaging.xml

14 directories, 20 files
```

`shared_prefs` 是共享首选项，下面的一堆XML文件使用简单键值对存储信息，有些简单的游戏会直接把存档放在这，那样直接就能看到和修改存档信息。
`files` 是自定义放文件的地方，也经常被用于放配置和存档。

很遗憾，几乎每个文件都翻了一遍，没有看到明文存档，其实很怀疑.pb结尾的文件就是存档，但是应该和数据库格式有关，直接打开是乱码。而且对于这种很可能直接存储了地图地形和单位的存档，使用二维数组压缩序列化应该是最好的选择，或者使用地图种子和偏差量现场计算（这个有点增加复杂性，我写代码的话应该会选择直白的前者）

### 静态分析

接下来更换方向，不去做文件修改了，直接静态分析！不过这个安装包是从Google Play下载的，这个不是完全适配任何型号的胖安装包，而是aab格式的分离安装包。应用往往分为`split_config.arm64_v8a.apk` 和 `base.apk` ，前者包含游戏主要CPP核心库文件，后者一般是资源文件和DEX代码。

如果没有快速导出apk包的工具的话，使用命令也是很方便的：

```text
PS C:\Users\NanCunChild> adb shell pm path air.com.midjiwan.polytopia
package:/data/app/~~drHxjTKjg4HjqcXyv69Qlg==/air.com.midjiwan.polytopia-rXY9YmTk7Gkg29MrXqxNew==/base.apk
package:/data/app/~~drHxjTKjg4HjqcXyv69Qlg==/air.com.midjiwan.polytopia-rXY9YmTk7Gkg29MrXqxNew==/split_config.arm64_v8a.apk

adb pull /data/app/~~drHxjTKjg4HjqcXyv69Qlg==/air.com.midjiwan.polytopia-rXY9YmTk7Gkg29MrXqxNew==/split_config.arm64_v8a.apk E:\reverse\polytopia\
```

然后查找 `lib2lcpp.so` 这个动态库，还有 `global-metadata.dat` 。一般情况下路径分别为： `lib/arm64-v8a/libil2cpp.so` 还有 `\base\assets\bin\Data\Managed\Metadata\global-metadata.dat`。直接使用开源工具 `Il2CppDumper` 选择这两个文件，过一会就能解析完毕：

```text
Initializing metadata... 
Metadata Version: 31 
Initializing il2cpp file... 
Applying relocations... 
WARNING: find JNI_OnLoad ERROR: This file may be protected. 
Il2Cpp Version: 31 
Searching... 
CodeRegistration : 5199220
MetadataRegistration : 539b780 
Dumping... Done! 
Generate struct... Done! 
Generate dummy dll... Done! 
Press any key to exit...
```

然后可以在工具文件夹下看到一个叫lID的文件夹，里面就全都是已经解析过的DLL文件啦：

```text

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         2026/2/26     20:03           5632 com.playeveryware.eos.core.dll
-a----         2026/2/26     20:03           6144 DebugLogger.dll
-a----         2026/2/26     20:03          24576 DebugOverlay.dll
-a----         2026/2/26     20:03         206336 DOTween.dll
-a----         2026/2/26     20:03         218624 Enums.NET.dll
-a----         2026/2/26     20:03           7680 Facepunch.Steamworks.Win64.dll
-a----         2026/2/26     20:03          20992 Firebase.Analytics.dll
-a----         2026/2/26     20:03          74240 Firebase.App.dll
-a----         2026/2/26     20:03          39424 Firebase.Messaging.dll
-a----         2026/2/26     20:03          27136 Firebase.Platform.dll
-a----         2026/2/26     20:03           3072 Firebase.TaskExtension.dll
-a----         2026/2/26     20:03         682496 GameLogicAssembly.dll
-a----         2026/2/26     20:03         149504 Google.Play.Games.dll
-a----         2026/2/26     20:03         158720 I2Localization.dll
-a----         2026/2/26     20:03          17408 IchiGamepad.dll
-a----         2026/2/26     20:03           4096 Il2CppDummyDll.dll
-a----         2026/2/26     20:03          69632 K4os.Compression.LZ4.dll
-a----         2026/2/26     20:03          32768 Microsoft.AspNetCore.Connections.Abstractions.dll
-a----         2026/2/26     20:03          85504 Microsoft.AspNetCore.Http.Connections.Client.dll
-a----         2026/2/26     20:03          14848 Microsoft.AspNetCore.Http.Connections.Common.dll
-a----         2026/2/26     20:03          30208 Microsoft.AspNetCore.Http.Features.dll
-a----         2026/2/26     20:03         138752 Microsoft.AspNetCore.SignalR.Client.Core.dll
-a----         2026/2/26     20:03           5632 Microsoft.AspNetCore.SignalR.Client.dll
-a----         2026/2/26     20:03          31744 Microsoft.AspNetCore.SignalR.Common.dll
-a----         2026/2/26     20:03          18432 Microsoft.AspNetCore.SignalR.Protocols.Json.dll
-a----         2026/2/26     20:03          10240 Microsoft.Bcl.AsyncInterfaces.dll
-a----         2026/2/26     20:03           9728 Microsoft.Extensions.Configuration.Abstractions.dll
-a----         2026/2/26     20:03          10752 Microsoft.Extensions.Configuration.Binder.dll
-a----         2026/2/26     20:03          20480 Microsoft.Extensions.Configuration.dll
-a----         2026/2/26     20:03          23552 Microsoft.Extensions.DependencyInjection.Abstractions.dll
-a----         2026/2/26     20:03          76288 Microsoft.Extensions.DependencyInjection.dll
-a----         2026/2/26     20:03          50688 Microsoft.Extensions.Logging.Abstractions.dll
-a----         2026/2/26     20:03           6656 Microsoft.Extensions.Logging.Configuration.dll
-a----         2026/2/26     20:03          17920 Microsoft.Extensions.Logging.Console.dll
-a----         2026/2/26     20:03          29184 Microsoft.Extensions.Logging.dll
-a----         2026/2/26     20:03           5632 Microsoft.Extensions.Options.ConfigurationExtensions.dll
-a----         2026/2/26     20:03          43520 Microsoft.Extensions.Options.dll
-a----         2026/2/26     20:03          39936 Microsoft.Extensions.Primitives.dll
-a----         2026/2/26     20:03         124928 Mono.Security.dll
-a----         2026/2/26     20:03        2632704 mscorlib.dll
-a----         2026/2/26     20:03          11776 NativeShare.Runtime.dll
-a----         2026/2/26     20:03          23552 NaughtyAttributes.Core.dll
-a----         2026/2/26     20:03          31232 NaughtyAttributes.Test.dll
-a----         2026/2/26     20:03         868864 Newtonsoft.Json.dll
-a----         2026/2/26     20:03           3072 NintendoSDK.dll
-a----         2026/2/26     20:03        2800640 PolytopiaAssembly.dll
-a----         2026/2/26     20:03         752128 PolytopiaBackendBase.dll
-a----         2026/2/26     20:03           8704 Purchasing.Common.dll
-a----         2026/2/26     20:03          18944 SignalRNewtonsoftAotProtocol.dll
-a----         2026/2/26     20:03           2048 System.Buffers.dll
-a----         2026/2/26     20:03           2048 System.ComponentModel.Annotations.dll
-a----         2026/2/26     20:03           4608 System.ComponentModel.DataAnnotations.dll
-a----         2026/2/26     20:03           5632 System.Configuration.dll
-a----         2026/2/26     20:03         613376 System.Core.dll
-a----         2026/2/26     20:03         585216 System.Data.dll
-a----         2026/2/26     20:03        1135616 System.dll
-a----         2026/2/26     20:03          24064 System.Drawing.dll
-a----         2026/2/26     20:03          80896 System.IO.Pipelines.dll
-a----         2026/2/26     20:03           2048 System.Memory.dll
-a----         2026/2/26     20:03         102912 System.Net.Http.dll
-a----         2026/2/26     20:03          29184 System.Numerics.dll
-a----         2026/2/26     20:03           9728 System.Numerics.Vectors.dll
-a----         2026/2/26     20:03           7168 System.Runtime.CompilerServices.Unsafe.dll
-a----         2026/2/26     20:03           4096 System.Runtime.Serialization.dll
-a----         2026/2/26     20:03          67072 System.Text.Encodings.Web.dll
-a----         2026/2/26     20:03         308224 System.Text.Json.dll
-a----         2026/2/26     20:03          33792 System.Threading.Channels.dll
-a----         2026/2/26     20:03           2048 System.Threading.Tasks.Extensions.dll
-a----         2026/2/26     20:03           2048 System.ValueTuple.dll
-a----         2026/2/26     20:03        1328640 System.Xml.dll
-a----         2026/2/26     20:03          42496 System.Xml.Linq.dll
-a----         2026/2/26     20:03         137728 Unity.Addressables.dll
-a----         2026/2/26     20:03          29696 Unity.Burst.dll
-a----         2026/2/26     20:03           2560 Unity.Burst.Unsafe.dll
-a----         2026/2/26     20:03         102912 Unity.Collections.dll
-a----         2026/2/26     20:03        1269760 Unity.InputSystem.dll
-a----         2026/2/26     20:03          10752 Unity.InputSystem.ForUI.dll
-a----         2026/2/26     20:03          55296 Unity.Mathematics.dll
-a----         2026/2/26     20:03           4608 Unity.MemoryProfiler.dll
-a----         2026/2/26     20:03           9728 Unity.RenderPipeline.Universal.ShaderLibrary.dll
-a----         2026/2/26     20:03        1055744 Unity.RenderPipelines.Core.Runtime.dll
-a----         2026/2/26     20:03           2560 Unity.RenderPipelines.Core.Runtime.Shared.dll
-a----         2026/2/26     20:03         219136 Unity.RenderPipelines.GPUDriven.Runtime.dll
-a----         2026/2/26     20:03         870400 Unity.RenderPipelines.Universal.Runtime.dll
-a----         2026/2/26     20:03         163840 Unity.ResourceManager.dll
-a----         2026/2/26     20:03          59904 Unity.Services.Analytics.dll
-a----         2026/2/26     20:03           8704 Unity.Services.Core.Configuration.dll
-a----         2026/2/26     20:03           6144 Unity.Services.Core.Device.dll
-a----         2026/2/26     20:03           9728 Unity.Services.Core.dll
-a----         2026/2/26     20:03           2560 Unity.Services.Core.Environments.Internal.dll
-a----         2026/2/26     20:03          38400 Unity.Services.Core.Internal.dll
-a----         2026/2/26     20:03          13824 Unity.Services.Core.Registration.dll
-a----         2026/2/26     20:03           7168 Unity.Services.Core.Scheduler.dll
-a----         2026/2/26     20:03           4096 Unity.Services.Core.Telemetry.dll
-a----         2026/2/26     20:03           2048 Unity.Services.Core.Threading.dll
-a----         2026/2/26     20:03         411136 Unity.TextMeshPro.dll
-a----         2026/2/26     20:03           3072 UnityEngine.AIModule.dll
-a----         2026/2/26     20:03         101888 UnityEngine.AndroidJNIModule.dll
-a----         2026/2/26     20:03          23552 UnityEngine.AnimationModule.dll
-a----         2026/2/26     20:03          10240 UnityEngine.AssetBundleModule.dll
-a----         2026/2/26     20:03          16384 UnityEngine.AudioModule.dll
-a----         2026/2/26     20:03        1285632 UnityEngine.CoreModule.dll
-a----         2026/2/26     20:03           2560 UnityEngine.CrashReportingModule.dll
-a----         2026/2/26     20:03           2048 UnityEngine.dll
-a----         2026/2/26     20:03          18432 UnityEngine.GameCenterModule.dll
-a----         2026/2/26     20:03          57856 UnityEngine.HierarchyCoreModule.dll
-a----         2026/2/26     20:03           4096 UnityEngine.ImageConversionModule.dll
-a----         2026/2/26     20:03         143872 UnityEngine.IMGUIModule.dll
-a----         2026/2/26     20:03          53760 UnityEngine.InputForUIModule.dll
-a----         2026/2/26     20:03          20992 UnityEngine.InputLegacyModule.dll
-a----         2026/2/26     20:03           7680 UnityEngine.InputModule.dll
-a----         2026/2/26     20:03           3584 UnityEngine.JSONSerializeModule.dll
-a----         2026/2/26     20:03          14848 UnityEngine.ParticleSystemModule.dll
-a----         2026/2/26     20:03           2560 UnityEngine.PerformanceReportingModule.dll
-a----         2026/2/26     20:03          17920 UnityEngine.Physics2DModule.dll
-a----         2026/2/26     20:03          29184 UnityEngine.PhysicsModule.dll
-a----         2026/2/26     20:03         156672 UnityEngine.PropertiesModule.dll
-a----         2026/2/26     20:03           2560 UnityEngine.Purchasing.AppleCore.dll
-a----         2026/2/26     20:03           3584 UnityEngine.Purchasing.AppleMacosStub.dll
-a----         2026/2/26     20:03           3584 UnityEngine.Purchasing.AppleStub.dll
-a----         2026/2/26     20:03          58368 UnityEngine.Purchasing.dll
-a----         2026/2/26     20:03          37888 UnityEngine.Purchasing.Security.dll
-a----         2026/2/26     20:03           9728 UnityEngine.Purchasing.SecurityCore.dll
-a----         2026/2/26     20:03         189440 UnityEngine.Purchasing.Stores.dll
-a----         2026/2/26     20:03           5632 UnityEngine.Purchasing.WinRTCore.dll
-a----         2026/2/26     20:03           2048 UnityEngine.Purchasing.WinRTStub.dll
-a----         2026/2/26     20:03          16896 UnityEngine.SharedInternalsModule.dll
-a----         2026/2/26     20:03           2560 UnityEngine.SpriteShapeModule.dll
-a----         2026/2/26     20:03          10240 UnityEngine.SubsystemsModule.dll
-a----         2026/2/26     20:03          14336 UnityEngine.TerrainModule.dll
-a----         2026/2/26     20:03          49664 UnityEngine.TextCoreFontEngineModule.dll
-a----         2026/2/26     20:03         210944 UnityEngine.TextCoreTextEngineModule.dll
-a----         2026/2/26     20:03          21504 UnityEngine.TextRenderingModule.dll
-a----         2026/2/26     20:03         366592 UnityEngine.UI.dll
-a----         2026/2/26     20:03        2240512 UnityEngine.UIElementsModule.dll
-a----         2026/2/26     20:03          30720 UnityEngine.UIModule.dll
-a----         2026/2/26     20:03          18944 UnityEngine.UnityAnalyticsCommonModule.dll
-a----         2026/2/26     20:03          14336 UnityEngine.UnityAnalyticsModule.dll
-a----         2026/2/26     20:03           6656 UnityEngine.UnityWebRequestAssetBundleModule.dll
-a----         2026/2/26     20:03          35328 UnityEngine.UnityWebRequestModule.dll
-a----         2026/2/26     20:03           5632 UnityEngine.UnityWebRequestTextureModule.dll
-a----         2026/2/26     20:03           3584 UnityEngine.UnityWebRequestWWWModule.dll
-a----         2026/2/26     20:03          12288 UnityEngine.VFXModule.dll
-a----         2026/2/26     20:03          17408 UnityEngine.VideoModule.dll
-a----         2026/2/26     20:03           5120 UnityEngine.VRModule.dll
-a----         2026/2/26     20:03          34304 UnityEngine.XRModule.dll
-a----         2026/2/26     20:03           2560 __Generated
```

这些DLL包含了所有方法的名称，类型，传入参数量和偏移地址，我们通过名字和大小定位到我们需要的内容，重点在这几个：

- PolytopiaAssembly.dll (重中之重，可能包含了大部分核心玩法)
- GameLogicAssembly.dll (游戏逻辑引擎)
- PolytopiaBackendBase.dll (后端或基础数据结构)

这些叫DummyDll，也就意味着接下来的事情没啥难度，目前任务就是找到一个 C# 反编译工具打开它们。

dnSpy是业内老工具了，不过很久没人维护，所以NCC用的IlSpy，这个缺少标记和搜索正则表达式的功能，用起来会比dnSpy难受一点。

导入这几个DLL（dnSpy默认会把Win的几个DLL放进来，可以把它们从列表删掉防止干扰），然后直接开全局搜索，这时候就得猜测开发者是怎么给内部变量和函数命名的了。这个游戏中货币是星星，所以一开始NCC找了 "Stars", "money", "AddStar" 等关键词，但是最终在尝试"wallet"的时候有了新发现：

```csharp
// PolytopiaAssembly, Version=0.0.0.0, Culture=neutral,
PublicKeyToken=null // ResourceManager.LocalWallet using Il2CppDummyDll;
[Token(Token = "0x2000251")] private class LocalWallet
{
  [Token(Token = "0x40008BE")]
  [FieldOffset(Offset = "0x10")]
  public byte playerId;

  [Token(Token = "0x40008BF")]
  [FieldOffset(Offset = "0x14")]
  public int score;

  [Token(Token = "0x40008C0")]
  [FieldOffset(Offset = "0x18")]
  public int currency;

  [Token(Token = "0x6000B41")]
  [Address(RVA = "0x454E804", Offset = "0x454A804", VA = "0x454E804")]
  public LocalWallet()
  {}
  [Token(Token = "0x6000B42")]
  [Address(RVA = "0x454E3D8", Offset = "0x454A3D8", VA = "0x454E3D8")]
  public LocalWallet(byte playerId)
  {}
  [Token(Token = "0x6000B43")]
  [Address(RVA = "0x454E4EC", Offset = "0x454A4EC", VA = "0x454E4EC")]
  public void SyncWithState()
  {}
} 
```

解释一下这些参数，变量的 `FieldOffset(Offset = "0x18")` 表示从 `LocalWallet` 这个对象开始往后走 `0x18`（十进制24） 字节就是 `Currency` 变量的存储地址。

这里有一个小技巧，我们虽然不知道这个 `LocalWallet` 对象本身的地址作为基座，但是可以通过成员函数进行定位，在IL2CPP中普通成员函数的第一个参数 `arg[0]` 是 `this` 指针，我们为了方便，直接拿 `SyncWithState` 这个函数开刀。找到内存中它的位置 `0x454E4EC` ，然后提取 `arg[0]` 存储下来，再将这个地址进行 `0x18` 偏移就能修改 `currency` 变量。

不过我们在这里先做完静态分析，拿到所有重要地址，NCC把一部分贴在下面：

```text
// 目前状态
[Token(Token = "0x20000D0")]
public class GameState : IBinarySerializable
{
...
[Token(Token = "0x170000F3")]
  public State CurrentState
  {
    [Token(Token = "0x6000772")]
    [Address(RVA = "0x2602A38", Offset = "0x25FEA38", VA = "0x2602A38")]
    [CompilerGenerated]
    get
    {
      return default(State);
    }
    [Token(Token = "0x6000773")]
    [Address(RVA = "0x2602A40", Offset = "0x25FEA40", VA = "0x2602A40")]
    [CompilerGenerated]
    set
    {
    }
  }
}
```

```text
// 每个单位的数据
[Token(Token = "0x20001A6")]
public class UnitData
{
  [Token(Token = "0x20001A7")]
  public enum WeaponEnum
  {
    [Token(Token = "0x4000778")]
    None,
    [Token(Token = "0x4000779")]
    Club,
    ...
  }

  [Token(Token = "0x20001A8")]
  public enum Type
  {
    [Token(Token = "0x400078B")]
    None,
    [Token(Token = "0x400078C")]
    Scout,
    [Token(Token = "0x400078D")]
    Warrior,
    ...
  }

  [Token(Token = "0x4000769")]
  [FieldOffset(Offset = "0x10")]
  public int idx;

  [Token(Token = "0x400076A")]
  [FieldOffset(Offset = "0x14")]
  public bool hidden;

  [Token(Token = "0x400076B")]
  [FieldOffset(Offset = "0x18")]
  public int cost;

  [Token(Token = "0x400076C")]
  [FieldOffset(Offset = "0x1C")]
  public int health;

  [Token(Token = "0x400076D")]
  [FieldOffset(Offset = "0x20")]
  public int defence;

}
```

```text
// 地块数据
[Token(Token = "0x20000B0")]
public class TileData
{
  [Token(Token = "0x20000B1")]
  public class Shoreline
  {
    [Token(Token = "0x400026B")]
    public const string SPRITE_EXT_DEFAULT = "";

    [Token(Token = "0x400026C")]
    public const string SPRITE_EXT_SWAMP = "_swamp";

    [Token(Token = "0x400026D")]
    [FieldOffset(Offset = "0x10")]
    public bool visible;

    [Token(Token = "0x400026E")]
    [FieldOffset(Offset = "0x18")]
    public string spriteExt;

    [Token(Token = "0x60006A1")]
    [Address(RVA = "0x25FCD10", Offset = "0x25F8D10", VA = "0x25FCD10")]
    public void Reset()
    {
    }

    [Token(Token = "0x60006A2")]
    [Address(RVA = "0x25FCD5C", Offset = "0x25F8D5C", VA = "0x25FCD5C")]
    public Shoreline()
    {
    }
  }

  [Token(Token = "0x20000B2")]
  public class Shorelines
  {
    [Token(Token = "0x400026F")]
    [FieldOffset(Offset = "0x10")]
    public bool any;

    [Token(Token = "0x4000270")]
    [FieldOffset(Offset = "0x18")]
    public Shoreline N;

    [Token(Token = "0x4000271")]
    [FieldOffset(Offset = "0x20")]
    public Shoreline S;

    [Token(Token = "0x4000272")]
    [FieldOffset(Offset = "0x28")]
    public Shoreline E;

    [Token(Token = "0x4000273")]
    [FieldOffset(Offset = "0x30")]
    public Shoreline W;

    [Token(Token = "0x60006A3")]
    [Address(RVA = "0x25FCD64", Offset = "0x25F8D64", VA = "0x25FCD64")]
    public void ResetAll()
    {
    }

    [Token(Token = "0x60006A4")]
    [Address(RVA = "0x25FCC68", Offset = "0x25F8C68", VA = "0x25FCC68")]
    public Shorelines()
    {
    }
  }

  [Token(Token = "0x20000B3")]
  public enum EffectType
  {
    [Token(Token = "0x4000275")]
    None,
    [Token(Token = "0x4000276")]
    Flooded,
    [Token(Token = "0x4000277")]
    Swamped,
    [Token(Token = "0x4000278")]
    Tentacle,
    [Token(Token = "0x4000279")]
    Algae,
    [Token(Token = "0x400027A")]
    Foam
  }
...
}

```

### 动态注入

接下来就是使用frida进行内存修改了。从官方release下载适配架构的客户端和服务端。

将手机端frida进行重命名（为了规避部分按照进程名称的检测），然后移动到一个可以执行二进制文件的环境里面（ `/sdcard` 似乎就是典型的不可执行环境，移动到 `/tmp` 或者 `/data/data/local/tmp` 是可以的）。值得一提的是，frida还有冷启动和挂载模式， `-f` 参数表示杀掉目标重新启动，在启动时加载脚本进入；普通情况就是直接把脚本“挂载”到目标上，目标不会出现暂停和重启。为了方便和使用so基类，我们用普通的挂载模式即可。

然后我们可以编写Javascript指令尝试注入，写好之后就可以使用指令进行脚本注入：

```shell
# adb 无线调试，注入1.js脚本到air.com.midjiwan.Polytopia包名进程
frida -H 192.168.0.101:8899 air.com.midjiwan.Polytopia -l E:\reverse_polytopia\1.js

# adb USB调试，直接注入当前前台进程
frida -U -F -l E:\reverse_polytopia\1.js

# adb USB调试，注入进程号为11542的进程，找进程号可以去shell里面用“ps -A”找一找
frida -U -p 11542 -l E:\reverse_polytopia\1.js
```

写脚本的话倒是很简单了，标准做法，先写一个 `setImmediate` 包起所有，表示放入事件循环，这里演示一个简单的监听脚本（注意，这里在较老的frida版本上和Android10测试成功，较新的frida版本和Android版本会因为QuickJS解析问题，对Module.findBaseAddress()函数进行报错，此时直接使用Process.findModuleByName()就好）：

```javascript

setImmediate(function () {
    console.log("[*] Wallet Snipper Initializing...");
    // 获取 libil2cpp.so 基址
    var il2cppBase = Module.findBaseAddress("libil2cpp.so");
    if (il2cppBase === null) {
        console.log("[-] libil2cpp.so NOT FOUND");
        return;
    }
    console.log("[+] libil2cpp.so base address: " + il2cppBase);
    // SyncWithState 函数的 RVA 偏移量
    var syncRva = 0x454E4EC;
    var syncAddress = il2cppBase.add(syncRva);
    console.log("[+] Interpreting LocalWallet.SyncWithState: " + syncAddress);

    Interceptor.attach(syncAddress, {
        onEnter: function (args) {
            var walletPtr = args[0];
            // 防止读取空指针
            if (walletPtr.isNull()) return;
            var playerId = walletPtr.add(0x10).readU8();
            var currencyPtr = walletPtr.add(0x18);
            var currentStars = currencyPtr.readS32();
            console.log("[!] Wallet Refreshed -> Tribe ID: " + playerId + ", Stars: " + currentStars);

            /* 
            if (playerId === 1) {
              if (currentStars < 9999) {
              currencyPtr.writeS32(9999);
              console.log("[+] Tribe " + playerId + " stars is 9999 now");
              }
            }
            */
        }
    });
});

```

接下来对于修改游戏内容没什么好玩的了，这个方面再进行捣鼓的结果就是做一个地图编辑器方便玩爽图，另一个方向就是破解联机协议实现局域网联机。
