import { Layout, Terminal, Cpu, Smartphone, Shield, HardDrive } from 'lucide-react';
import type { ComponentType } from 'react';

type NodeDef = { label: string; category: string; data: object };

export interface CodePlugin {
  id: string;
  name: string;
  desc: string;
  icon: ComponentType<{ size?: number }>;
  headers: string[];
  preMain: string;
  postMain: string;
  replacesMain: boolean;
  buildHint: string;
  functions?: Record<string, NodeDef>;
}

export const PLUGINS: CodePlugin[] = [
  {
    id: 'none',
    name: 'None',
    desc: 'Standard C application',
    icon: Layout,
    headers: [],
    preMain: '',
    postMain: '',
    replacesMain: false,
    buildHint: 'gcc main.c -o app',
    functions: {},
  },
  {
    id: 'root',
    name: 'Root',
    desc: 'Android/Linux root with su',
    icon: Shield,
    replacesMain: false,
    headers: [],
    functions: {
      RootExec: {
        label: 'Root Exec', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'cmd', type: 'data', label: 'Command', dataType: 'string' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'result', type: 'data', label: 'Exit Code', dataType: 'int' },
          ],
        },
      },
      CheckRoot: {
        label: 'Check Root', category: 'Plugin',
        data: {
          type: 'function',
          outputs: [{ id: 'result', type: 'data', label: 'Is Root', dataType: 'bool' }],
        },
      },
    },
    preMain: `int check_root() {
    FILE *f = popen("su -c 'whoami' 2>/dev/null || id -u", "r");
    if (!f) return 0;
    char buf[64] = {0};
    fgets(buf, sizeof(buf), f);
    pclose(f);
    return strstr(buf, "root") || buf[0] == '0';
}`,
    postMain: `    if (check_root()) {
        printf("[+] Root access granted\\n");
    } else {
        printf("[-] No root access\\n");
    }`,
    buildHint: 'gcc main.c -o app && ./app',
  },
  {
    id: 'android',
    name: 'Android NDK',
    desc: 'Android JNI with NDK build',
    icon: Smartphone,
    replacesMain: true,
    headers: ['#include <jni.h>'],
    functions: {
      JNIFindClass: {
        label: 'JNI FindClass', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'env', type: 'data', label: 'JNIEnv *', dataType: 'int' },
            { id: 'name', type: 'data', label: 'Class Name', dataType: 'string' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'cls', type: 'data', label: 'jclass', dataType: 'int' },
          ],
        },
      },
      JNIGetMethod: {
        label: 'JNI GetMethodID', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'cls', type: 'data', label: 'jclass', dataType: 'int' },
            { id: 'name', type: 'data', label: 'Method Name', dataType: 'string' },
            { id: 'sig', type: 'data', label: 'Signature', dataType: 'string' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'mid', type: 'data', label: 'jmethodID', dataType: 'int' },
          ],
        },
      },
      JNICallVoid: {
        label: 'JNI CallVoidMethod', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'obj', type: 'data', label: 'jobject', dataType: 'int' },
            { id: 'mid', type: 'data', label: 'jmethodID', dataType: 'int' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
      JNIThrow: {
        label: 'JNI Throw Exception', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'cls', type: 'data', label: 'jclass', dataType: 'int' },
            { id: 'msg', type: 'data', label: 'Message', dataType: 'string' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
    },
    preMain: `JNIEXPORT jint JNICALL
JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env;
    if ((*vm)->GetEnv(vm, (void**)&env, JNI_VERSION_1_6) != JNI_OK)
        return JNI_ERR;
    return JNI_VERSION_1_6;
}

JNIEXPORT void JNICALL
Java_com_cbuilder_Main_nativeInit(JNIEnv *env, jclass cls) {
    OnStart();
}`,
    postMain: '',
    buildHint: 'Use Android.mk / CMake with NDK r28+',
  },
  {
    id: 'windows-efi',
    name: 'Windows EFI',
    desc: 'UEFI bootloader with GNU-EFI',
    icon: HardDrive,
    replacesMain: true,
    headers: ['#include <efi.h>', '#include <efilib.h>'],
    functions: {
      EFIPrint: {
        label: 'EFI Print', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'str', type: 'data', label: 'String', dataType: 'string' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
      EFIOpen: {
        label: 'EFI Open File', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'path', type: 'data', label: 'Path', dataType: 'string' },
            { id: 'mode', type: 'data', label: 'Mode', dataType: 'string' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'handle', type: 'data', label: 'EFI_FILE *', dataType: 'int' },
          ],
        },
      },
      EFIRead: {
        label: 'EFI Read File', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'handle', type: 'data', label: 'EFI_FILE *', dataType: 'int' },
            { id: 'size', type: 'data', label: 'Buffer Size', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'buf', type: 'data', label: 'Buffer', dataType: 'int' },
            { id: 'read', type: 'data', label: 'Bytes Read', dataType: 'int' },
          ],
        },
      },
      EFIWatchdog: {
        label: 'EFI Set Watchdog', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'secs', type: 'data', label: 'Timeout (s)', dataType: 'int' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
    },
    preMain: `EFI_STATUS
EFIAPI efi_main(EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE *SystemTable) {
    InitializeLib(ImageHandle, SystemTable);`,
    postMain: `    return EFI_SUCCESS;
}`,
    buildHint: 'Use GNU-EFI: make && cp *.efi /mnt/EFI/BOOT/BOOTX64.EFI',
  },
  {
    id: 'linux-kmod',
    name: 'Linux Kernel Module',
    desc: 'LKM with module_init/exit',
    icon: Cpu,
    replacesMain: true,
    headers: ['#include <linux/module.h>', '#include <linux/kernel.h>', '#include <linux/init.h>', '#include <linux/slab.h>'],
    functions: {
      KMAlloc: {
        label: 'kmalloc', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'size', type: 'data', label: 'Size', dataType: 'int' },
            { id: 'flags', type: 'data', label: 'GFP Flags', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'ptr', type: 'data', label: 'Pointer', dataType: 'int' },
          ],
        },
      },
      KMFree: {
        label: 'kfree', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'ptr', type: 'data', label: 'Pointer', dataType: 'int' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
      KMPrint: {
        label: 'printk', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'fmt', type: 'data', label: 'Format', dataType: 'string' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
      KMCopyFrom: {
        label: 'copy_from_user', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'dst', type: 'data', label: 'Kernel Dst', dataType: 'int' },
            { id: 'src', type: 'data', label: 'User Src', dataType: 'int' },
            { id: 'n', type: 'data', label: 'Count', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'result', type: 'data', label: 'Uncopied', dataType: 'int' },
          ],
        },
      },
    },
    preMain: `MODULE_LICENSE("GPL");
MODULE_AUTHOR("C-Builder");
MODULE_DESCRIPTION("Generated kernel module");

static int __init cbuilder_init(void) {
    printk(KERN_INFO "C-Builder module loaded\\n");`,
    postMain: `    return 0;
}

static void __exit cbuilder_exit(void) {
    printk(KERN_INFO "C-Builder module unloaded\\n");
}

module_init(cbuilder_init);
module_exit(cbuilder_exit);`,
    buildHint: 'Use Linux kernel build system: make -C /lib/modules/$(uname -r)/build M=$PWD modules',
  },
  {
    id: 'windows-gui',
    name: 'Windows GUI',
    desc: 'Win32 desktop application',
    icon: Terminal,
    replacesMain: true,
    headers: ['#include <windows.h>'],
    functions: {
      WinMsgBox: {
        label: 'MessageBox', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'text', type: 'data', label: 'Text', dataType: 'string' },
            { id: 'caption', type: 'data', label: 'Caption', dataType: 'string' },
            { id: 'type', type: 'data', label: 'Type (MB_OK etc)', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'result', type: 'data', label: 'Result', dataType: 'int' },
          ],
        },
      },
      WinCreateWindow: {
        label: 'CreateWindowEx', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'title', type: 'data', label: 'Title', dataType: 'string' },
            { id: 'x', type: 'data', label: 'X', dataType: 'int' },
            { id: 'y', type: 'data', label: 'Y', dataType: 'int' },
            { id: 'w', type: 'data', label: 'Width', dataType: 'int' },
            { id: 'h', type: 'data', label: 'Height', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'hwnd', type: 'data', label: 'HWND', dataType: 'int' },
          ],
        },
      },
      WinGetText: {
        label: 'GetDlgItemText', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'hwnd', type: 'data', label: 'HWND', dataType: 'int' },
            { id: 'id', type: 'data', label: 'Control ID', dataType: 'int' },
            { id: 'max', type: 'data', label: 'Max Length', dataType: 'int' },
          ],
          outputs: [
            { id: 'exec_out', type: 'exec', label: 'Out' },
            { id: 'text', type: 'data', label: 'Text', dataType: 'string' },
          ],
        },
      },
      WinSetText: {
        label: 'SetDlgItemText', category: 'Plugin',
        data: {
          type: 'function',
          inputs: [
            { id: 'exec_in', type: 'exec', label: 'In' },
            { id: 'hwnd', type: 'data', label: 'HWND', dataType: 'int' },
            { id: 'id', type: 'data', label: 'Control ID', dataType: 'int' },
            { id: 'text', type: 'data', label: 'Text', dataType: 'string' },
          ],
          outputs: [{ id: 'exec_out', type: 'exec', label: 'Out' }],
        },
      },
    },
    preMain: `LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
    case WM_DESTROY: PostQuitMessage(0); return 0;
    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);
        TextOutA(hdc, 10, 10, "C-Builder App", 13);
        EndPaint(hwnd, &ps);
        return 0;
    }
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    WNDCLASSA wc = {0};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "CBuilderWindow";
    RegisterClassA(&wc);
    HWND hwnd = CreateWindowExA(0, "CBuilderWindow", "C-Builder App",
        WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, 800, 600,
        NULL, NULL, hInstance, NULL);
    if (!hwnd) return 1;
    ShowWindow(hwnd, nCmdShow);
    OnStart();
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return 0;
}`,
    postMain: '',
    buildHint: 'gcc main.c -o app -lgdi32 -mwindows',
  },
];

export const getPlugin = (id: string): CodePlugin => PLUGINS.find(p => p.id === id) ?? PLUGINS[0];
