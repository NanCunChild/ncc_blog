---
title: "Pokapoka搞破坏 Xiaomi———溃于蚁穴（一）：小米fastboot溢出分析"
date: 2026-05-15T19:08:00+08:00
draft: false
toc: false
images:
tags:
  - tech
  - pokapoka
  - android
  - xiaomi
  - vulnerable
description: "Xiaomi变印度厂了，熬的小米粥变成恒河汤了"
---

## 前言
小米存在一个OEM指令`set-gpu-preemption`，而这个指令存在命令参数注入`kernel cmdline`的漏洞，实际使用如下：
```
# the second argument could cause argument injection. This is what we are talking about today
fastboot oem set-gpu-preemption 0 androidboot.selinux=permissive
fastboot continue 

# This is exploiting IMQS(a MI service) to get root, this calling has root permission, dd command means to exploit the GBL boot vulnerable to persist the root shell. 3 vulnerables in a row, causing all secureboot chain collapsed.
adb shell 'service call miui.mqsas.IMQSNative 21 i32 1 s16 "dd" i32 1 s16 "if=/data/local/tmp/linuxloader_unlock.efi of=/dev/block/by-name/efisp" s16 "/data/mqsas/log.txt" i32 60'
```

## 分析

实测在HyperOS3.0.305时，该漏洞被修复。

如下是相关部分逆向代码，展示了出现参数非法拼接的形成原因，使用 Ghidra 12.0.4 BuildDev 分析，存在少许空格错误。部分关键变量为方便辨别已重新命名。

```c
// HyperOS 3.0.305 ABL, RVA 0x5d600
void fb_oem_set_gpu_preemption(void)

{
  bool bVar1;
  undefined1 uVar2;
  undefined1 uVar3;
  long len;
  undefined *puVar5;
  undefined8 uVar6;
  long extraout_x8;
  byte *userinput;
  code *pcVar7;
  char buf_msg [256];
  char buf_log [64];
  undefined8 local_28;
  
  FUN_00060db0();
  local_28 = *(undefined8 *)(extraout_x8 + 0x20);
  AsciiStrCpyS(buf_log,"Set GPU HW Preemption: ",0x40);
  AsciiStrCpyS(buf_msg," msm_kgsl.preempt_enable=",0x100);

  for (; (len = AsciiStrLen((long)userinput), len  != 0 && (*userinput == 0x20));
      userinput = userinput + 1) {
  }
  
  len = AsciiStrLen((long)userinput);
  if (len == 1) {
    uVar2 = 0x2f < (*userinput & 0xfe);
    uVar3 = (*userinput & 0xfe) == 0x30;
    if ((bool)uVar3) {
      puVar5 = (undefined *)AsciiStrLen((long)unaff_x19);
      AsciiStrCatS(buf_msg,0x100,(char *)userinput, puVar5);
      pcVar7 = *(code **)(DAT_00103398 + 0x58);
      uVar6 = AsciiStrLen((long)buf_msg);
      FUN_00061234();
      if (!(bool)uVar2 || (bool)uVar3) {
        FUN_00003900();
      }
      len = (*pcVar7)(L"GpuConfiguration",&DAT_000 c8364,7,uVar6,buf_msg);
      if (len < 0) {
        puVar5 = (undefined *)AsciiStrLen(0x643ef);
        uVar3 = puVar5 + -10 == (undefined *)0xfffffffffffff ff4;
        if (puVar5 + -10 < (undefined *)0xfffffffffffffff5) {
          FUN_00003900();
        }
        AsciiStrCatS(buf_log,IMAGE_DOS_HEADE R_00000000.e_program,": failed!",puVar5);
        FUN_00057738();
      }
      else {
        puVar5 = (undefined *)AsciiStrLen(0x726e2);
        FUN_000616f8();
        if (!(bool)uVar2 || (bool)uVar3) {
          FUN_00003900();
        }
        AsciiStrCatS(buf_log,IMAGE_DOS_HEADE R_00000000.e_program,": done",puVar5);
        FUN_0005784c();
      }
      FUN_00060904();
      if ((bool)uVar3) {
        return;
      }
      goto LAB_0005d7e8;
    }
  }
  bVar1 = false;
  FUN_00060904();
  if (bVar1) {
    FUN_00057738();
    return;
  }
LAB_0005d7e8:
   error_dertection_halting();
}


undefined8 AsciiStrCatS(char *param_1,undefined  *param_2,char *param_3,undefined *param_4)

{
  char *pcVar1;
  undefined1 in_ZR;
  bool bVar2;
  undefined *puVar3;
  char *pcVar4;
  undefined *puVar5;
  undefined8 uVar6;
  undefined8 uVar7;
  undefined *puVar8;
  
  puVar3 = (undefined *)FUN_000024d8();
  if (param_1 == (char *)0x0) {
    pcVar4 = FUN_00060d84();
    uVar6 = 0x828;
  }
  else if (param_3 == (char *)0x0) {
    pcVar4 = FUN_00060d6c();
    uVar6 = 0x829;
  }
  else {
    in_ZR = param_2 == &DAT_000f4240;
    if (param_2 < &DAT_000f4241) {
      in_ZR = param_4 == &DAT_000f4240;
      if (param_4 < &DAT_000f4241) {
        if (param_2 != (undefined *)0x0) {
          in_ZR = param_2 == puVar3;
          if ((bool)in_ZR) {
            pcVar4 = FUN_00061bbc();
            FUN_00001efc(pcVar4,0x83b);
            uVar7 = 0x8000000000000004;
          }
          else {
            puVar8 = param_2 + -(long)puVar3;
            puVar5 = (undefined *)FUN_000024d8();
            in_ZR = puVar8 <= param_4 && puVar8 == puV ar5;
            if (puVar8 <= param_4 && puVar8 <= puVar5) {
              pcVar4 = FUN_00061c04();
              FUN_00001efc(pcVar4,0x842);
              uVar7 = 0x8000000000000005;
            }
            else {
              if (param_4 <= puVar5) {
                puVar5 = param_4;
              }
              bVar2 = param_3 <= param_1;
              pcVar4 = param_3 + (long)puVar5 + 1;
              in_ZR = bVar2 && pcVar4 == param_1;
              if (bVar2 && param_1 < pcVar4) {
                FUN_00001efc("/home/work/mnt/miui_codes1/build_home_rom-odm-merged/kernel_platform/out/bazel/output_user_root/b1970bca595d87272e733a0c3ce8a31e/sandbox/processwrapper-sandbox/142/execroot/_main/bootable/bootloader/edk2/MdePkg/Library/BaseLib/SafeString.c"
                             ,0x84b,
                             "InternalSafeStringNoAsciiStrOverlap (Destination, DestMax, (CHAR8 *)Source, SourceLen + 1)"
                            );
              }
              else {
                pcVar1 = param_1 + (long)param_2;
                in_ZR = param_3 >= param_1 && pcVar1 == param_3;
                if (((param_3 < param_1 || pcVar1 <= param_ 3) ||
                    (FUN_00001efc("/home/work/mnt/miui_codes1/build_home_rom-odm-merged/kernel_platform/out/bazel/output_user_root /b1970bca595d87272e733a0c3ce8a31e/s andbox/processwrapper-sandbox/142/exe croot/_main/bootable/bootloader/edk2/M dePkg/Library/BaseLib/SafeString.c"
                                  ,0x84b,
                                  "InternalSafeStringNoAsciiStrOverlap (Destination, DestMax, (CHAR8 *)Source, SourceLen + 1)"
                                 ), !bVar2 || pcVar4 <= param_1)) &&
                   (in_ZR = param_1 <= param_3 && pcVar1 = = param_3,
                   param_1 > param_3 || pcVar1 <= param_3) ) {
                  pcVar4 = param_1 + (long)puVar3;
                  for (; (puVar5 != (undefined *)0x0 && (*para m_3 != '\0')); param_3 = param_3 + 1)
                  {
                    *pcVar4 = *param_3;
                    puVar5 = puVar5 + -1;
                    pcVar4 = pcVar4 + 1;
                  }
                  uVar7 = 0;
                  *pcVar4 = '\0';
                  goto LAB_00002ac4;
                }
              }
              uVar7 = 0x800000000000000f;
            }
          }
          goto LAB_00002ac4;
        }
        pcVar4 = FUN_00061108();
        uVar6 = 0x836;
      }
      else {
        pcVar4 = 
        "/home/work/mnt/miui_codes1/build_home_rom-odm-merged/kernel_platform/out/bazel/outp ut_user_root/b1970bca595d87272e733a0c3ce8 a31e/sandbox/processwrapper-sandbox/142/execroot/_main/bootable/bootloader/edk2/MdePkg/Library/BaseLib/SafeString.c";
        uVar6 = 0x830;
      }
    }
    else {
      pcVar4 = FUN_000614f0();
      uVar6 = 0x82f;
    }
  }
  uVar7 = 0x8000000000000002;
  FUN_00001efc(pcVar4,uVar6);
LAB_00002ac4:
  FUN_000608d8();
  if (!(bool)in_ZR) {
    error_dertection_halting();
  }
  return uVar7;
}

// RVA FUN_00043a2c
void error_dertection_halting(void)

{
  FUN_00001c1c(0x80000000,"Error: Stack Smashing Detected. Halting...\n");
  do {
  } while( true );
}

```




```c
// HyperOS 3.0.45 ABL, RVA 0x5f3d4
void fb_oem_set_gpu_preemption(void)
{
	undefined1 in_ZR;
	undefined1 in_CY;
	long lVar1;
	undefined *n;
	long extraout_x8;
	byte *user_input;
	code *pcVar3;
	char buf_msg [256];
	char buf_log [64];
	undefined8 uStack_28;
	FUN_00062a68();
	uStack_28 = *(undefined8 *)(extraout_x8 + 0x80);
	AsciiStrCpyS(buf_log,"Set GPU HW Preempti on: ",0x40);
	AsciiStrCpyS(buf_msg," msm_kgsl.preempt_ enable=",0x100);
	while (lVar1 = AsciiStrLen((long)user_input), lVar 1 != 0) {
		in_CY = 0x1f < *user_input;
		in_ZR = *user_input == 0x20;
		if (!(bool)in_ZR) break;
		user_input = user_input + 1;
	}
	n = (undefined *)AsciiStrLen((long)user_input);
	AsciiStrCatS(buf_msg,IMAGE_DOS_HEADER_00000000.e_program + 0xc0,(char *)user_input,n);
	pcVar3 = *(code **)(DAT_001063f0 + 0x58);
	AsciiStrLen((long)buf_msg);
	FUN_00062d84();
	if (!(bool)in_CY || (bool)in_ZR) {
		FUN_00003900();
	}
	lVar1 = (*pcVar3)(L"GpuConfiguration",&DAT_000cb 3b4,7,user_input,buf_msg);
	if (lVar1 < 0) {
		n = (undefined *)AsciiStrLen(0x65d1c);
		in_ZR = n + -10 == (undefined *)0xfffffffffffffff 4;
		if (n + -10 < (undefined *)0xfffffffffffffff5) {
		FUN_00003900();
	}
	AsciiStrCatS(buf_log,IMAGE_DOS_HEADER_00000000.e_program,": failed!",n);
	FUN_00059084();
	}
	else {
		n = (undefined *)AsciiStrLen(0x7493d);
		FUN_000631c4();
		if (!(bool)in_CY || (bool)in_ZR) {
			FUN_00003900();
		}
		AsciiStrCatS(buf_log,IMAGE_DOS_HEADER_00000000.e_program,": done",n);
		FUN_00059198();
	}
	FUN_000626f8();
	if ((bool)in_ZR) {
		return;
	}
	error_dertection_halting();
}

// RVA 0004a00c
void error_dertection_halting(void)
{
	FUN_00001c1c(0x80000000,"Error: Stack Smashing Detected. Halting...\n");
	do {
	} while( true );
}

```


### 对比结论

- 3.0.305 的 `fb_oem_set_gpu_preemption` 含有严格输入校验:`AsciiStrLen(input) == 1 && (*input & 0xFE) == 0x30`,即只接受单字符 `'0'` 或 `'1'`,其他情况直接走 `FUN_00043a2c`(error_dertection_halting 路径)。
- 3.0.45 的同名函数无此校验,把用户输入(`unaff_x19`,fastboot 命令行参数)直接传给 `AsciiStrCatS(buf_msg, 0xC0, input, AsciiStrLen(input))`。
- 拼接后的字符串通过 `SetVariable(L"GpuConfiguration", ...)` 写入 UEFI 变量,最终被拼到 kernel cmdline 的 `msm_kgsl.preempt_enable=` 后面。



### 3.0.45版本注入漏洞核心

也就是说，对于核心fastboot注入指令：

```
fastboot oem set-gpu-preemption-value 0 androidboot.selinux=permissive
```

fastboot 协议传过来的命令字符串，handler 拿到的 `user_input` 是 `oem set-gpu-preemption-value` 后面的全部内容，即:

```
0 androidboot.selinux=permissive
```

回看 3.0.45 的代码,关键就在这两行:

```c
while (... *user_input == 0x20) user_input++;   // 只跳过前导空格，此处NCC将for改为了while方便看明白，反编译初始代码放进Github仓库
n = AsciiStrLen(unaff_x19);                      // n = 整个剩余串的长度
AsciiStrCatS(buf_msg, 0x100, user_input, n);     // 把整个剩余串拼进 buf_msg
```

`buf_msg` 初始内容是 `" msm_kgsl.preempt_enable="`。拼接之后变成:

```
 msm_kgsl.preempt_enable=0 androidboot.selinux=permissive
```

然后这个 `buf_msg` 被交给 `GpuConfiguration` 那个 protocol/变量写进去，最终被 append 到内核 command line。`continue` 启动时,内核解析 cmdline 是按空格分词的,于是 `androidboot.selinux=permissive` 就成了一个独立的、生效的内核参数。

**核心 bug:handler 假设 `user_input` 是"一个值"，但实际上它是"命令行剩余的一切"，中间的空格没有被当作分隔符截断。** 把空格之后的东西也一起带进去了。同时函数开头并没有校验此命令调用前是否需要解锁，因此直接执行，NCC前往圣地的路上一路畅通无阻，一路上没有遇到任何阻碍。

### 3.0.305修复漏洞核心
 305 的闸门：

```c
len = AsciiStrLen(user_input);
if (len == 1) {                          //  整个剩余串长度必须正好是 1
    uVar3 = (*userinput & 0xfe) == 0x30; //  且必须是 '0' 或 '1'
```

`0 androidboot.selinux=permissive` 的长度远不止 1，直接被 `if (len == 1)` 否决。即使只传 `fastboot oem set-gpu-preemption 0 androidboot...`，只要后面跟了空格和别的东西,`len` 就不是 1 一样进不去。

**核心修复： 0/1 强约束， 同时限制长度为1堵死其它类型的注入。**（这个限制长度在真正源代码中可能只是某个安全函数的副作用）


###  链

针对3.0.45代码中的这一段比较令人在意：

```c
pcVar3 = *(code **)(DAT_001063f0 + 0x58);
//...
lVar1 = (*pcVar3)(L"GpuConfiguration",&DAT_000cb 3b4,7,user_input,buf_msg);
```

这里明显 `pcVar3` 作为一个方法被调用了，而且用户输入 `buf_msg` 在此处被存储。我们跟踪结构体 `DAT_001063f0` 之后找到如下偏移量（白找了，是 `EFI_RUNTIME_SERVICES` 标准布局），而 `0x58` 的基础偏移对上 `SetVariable` 方法。

| Offset | Field                     | Note |
| ------ | ------------------------- | ---- |
| 0x00   | EFI_TABLE_HEADER (Hdr)    | +24  |
| 0x18   | GetTime                   | +8   |
| 0x20   | SetTime                   | +8   |
| 0x28   | GetWakeupTime             | +8   |
| 0x30   | SetWakeupTime             | +8   |
| 0x38   | SetVirtualAddressMap      | +8   |
| 0x40   | ConvertPointer            | +8   |
| 0x48   | GetVariable               | +8   |
| 0x50   | GetNextVariableName       | +8   |
| 0x58   | SetVariable               | +8   |
| 0x60   | GetNextHighMonotonicCount | +8   |
| 0x68   | ResetSystem               | +8   |
| 0x70   | UpdateCapsule             | +8   |

而根据 UEFI Spec 2.10 中关于 `SetVariable` 方法定义如下：
```
EFI_STATUS SetVariable (
  IN     CHAR16     *VariableName,   // 变量名（UTF-16 字符串）
  IN     EFI_GUID   *VendorGuid,     // 变量所属的 GUID
  IN     UINT32     Attributes,      // 属性位掩码，例如 7 = NV+BS+RT
  IN     UINTN      DataSize,        // 数据长度（字节）
  IN     VOID       *Data            // 数据缓冲区指针
);
```


对于代码：

```c
FUN_000029f0(acStack_168,IMAGE_DOS_HEADER_00000000.e_program + 0xc0,(char *)unaff_x19,puVa r2);
```

反编译显示 handler 调用 `AsciiStrnCatS(buf_msg, DestMax, user_input, AsciiStrLen(user_input))` 。 该函数即 EDK2 SafeString 库中的标准实现，4 参数，语义是: 实际拷贝字节数 = `min(Length, DestMax - AsciiStrLen(Destination) - 1)`

第 2 个参数 DestMax 在反编译中显示为 IMAGE_DOS_HEADER_00000000.e_program + 0xc0, 这是 Ghidra 在 PE 头零页上误应用 IMAGE_DOS_HEADER 结构体类型造成的反编译伪影, 真实值
## PS
还未完成，但是先发出来了。
//TODO 
- 重新追 `GpuConfiguration` 读取侧去看cmdline具体拼接进行佐证。
- 目前卡在Ghidra自动分析的 IMAGE_DOS_HEADER 这里，还原了字符串又查表，还上网查这个东西怎么会有`e.program` 属性。最终猜测它写的这个应该是纯数值`0x40` ，检查调用的 `000029f0` 经过比对应该是 `AsciiStrnCatS` 函数
- 对AI的吐槽：Claude全身敏感肌，没思路问问方向都不行。DeepSeekV4满口胡言乱语，在制表上帮了忙。Gemini不干活成天夸NCC观察力非常敏锐。GPT能力不行还保守。总的来说还是NCC好，就是太费NCC脑子了。