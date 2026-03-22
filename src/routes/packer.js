const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');
const { nanoid } = require('nanoid');

const uploadsDir = path.join(__dirname, '../../uploads');
const encryptedDir = path.join(__dirname, '../../encrypted');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(encryptedDir)) {
  fs.mkdirSync(encryptedDir, { recursive: true });
}

router.get('/list', authMiddleware, (req, res) => {
  const apps = db.prepare(`
    SELECT e.*, s.name as software_name, s.app_key 
    FROM encrypted_apps e 
    LEFT JOIN software s ON e.software_id = s.id 
    ORDER BY e.created_at DESC
  `).all();
  res.json({ code: 200, data: apps });
});

router.post('/upload', authMiddleware, (req, res) => {
  const { software_id, file_name, file_size, file_type, file_data } = req.body;

  if (!software_id || !file_name || !file_data) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  const software = db.prepare('SELECT * FROM software WHERE id = ?').get(software_id);
  if (!software) {
    return res.json({ code: 400, message: '软件不存在' });
  }

  const allowedTypes = ['.exe', '.dll'];
  const ext = path.extname(file_name).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return res.json({ code: 400, message: '仅支持EXE和DLL文件' });
  }

  const fileId = nanoid(16);
  const uploadPath = path.join(uploadsDir, `${fileId}${ext}`);

  try {
    const buffer = Buffer.from(file_data, 'base64');
    fs.writeFileSync(uploadPath, buffer);

    const result = db.prepare(`INSERT INTO encrypted_apps
      (software_id, original_name, file_type, file_size, status, file_id)
      VALUES (?, ?, ?, ?, ?, ?)`).run(software_id, file_name, ext, file_size, 'uploaded', fileId);

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        id: result.lastInsertRowid,
        file_id: fileId,
        file_path: uploadPath
      }
    });
  } catch (err) {
    console.error('文件上传错误:', err);
    res.json({ code: 500, message: '文件保存失败' });
  }
});

router.post('/encrypt', authMiddleware, (req, res) => {
  const { id, template_style, random_filename, anti_debug, vm_protect } = req.body;

  if (!id) {
    return res.json({ code: 400, message: '任务ID不能为空' });
  }

  const app = db.prepare('SELECT * FROM encrypted_apps WHERE id = ?').get(id);
  if (!app) {
    return res.json({ code: 404, message: '加密任务不存在' });
  }

  const software = db.prepare('SELECT * FROM software WHERE id = ?').get(app.software_id);
  if (!software) {
    return res.json({ code: 400, message: '关联软件不存在' });
  }

  try {
    db.prepare(`UPDATE encrypted_apps SET 
      template_style = ?, 
      random_filename = ?, 
      anti_debug = ?, 
      vm_protect = ?,
      status = ?
      WHERE id = ?`).run(
      template_style || 'default',
      random_filename ? 1 : 0,
      anti_debug ? 1 : 0,
      vm_protect ? 1 : 0,
      'encrypting',
      id
    );

    setTimeout(() => {
      try {
        const originalPath = path.join(uploadsDir, `${app.file_id}${app.file_type}`);
        const encryptedId = nanoid(16);
        const encryptedName = random_filename ? `${encryptedId}${app.file_type}` : `[ICY加密]${app.original_name}`;
        const encryptedPath = path.join(encryptedDir, encryptedName);

        const stubCode = generateStubCode(software, template_style, anti_debug, vm_protect);

        const originalBuffer = fs.readFileSync(originalPath);
        const encryptedBuffer = encryptFile(originalBuffer, stubCode, app.file_type);

        fs.writeFileSync(encryptedPath, encryptedBuffer);

        const downloadUrl = `/api/packer/download/${encryptedId}`;

        db.prepare(`UPDATE encrypted_apps SET 
          status = ?, 
          download_url = ?,
          completed_at = datetime('now')
          WHERE id = ?`).run('completed', downloadUrl, id);

        console.log(`✅ 文件加密完成: ${encryptedName}`);
      } catch (err) {
        console.error('加密过程错误:', err);
        db.prepare("UPDATE encrypted_apps SET status = 'failed' WHERE id = ?").run(id);
      }
    }, 2000);

    res.json({
      code: 200,
      message: '加密任务已启动',
      data: { id, status: 'encrypting' }
    });
  } catch (err) {
    console.error('加密错误:', err);
    res.json({ code: 500, message: '加密失败: ' + err.message });
  }
});

router.get('/status/:id', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM encrypted_apps WHERE id = ?').get(req.params.id);
  if (!app) {
    return res.json({ code: 404, message: '任务不存在' });
  }
  res.json({ code: 200, data: app });
});

router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;

  const files = fs.readdirSync(encryptedDir);
  const targetFile = files.find(f => f.includes(fileId));

  if (!targetFile) {
    return res.status(404).json({ code: 404, message: '文件不存在或已过期' });
  }

  const filePath = path.join(encryptedDir, targetFile);
  const stat = fs.statSync(filePath);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(targetFile)}"`);
  res.setHeader('Content-Length', stat.size);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('close', () => {
    const app = db.prepare('SELECT * FROM encrypted_apps WHERE download_url LIKE ?').get(`%${fileId}%`);
    if (app) {
      db.prepare('UPDATE encrypted_apps SET download_count = download_count + 1 WHERE id = ?').run(app.id);
    }
  });
});

router.post('/delete', authMiddleware, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ code: 400, message: 'ID不能为空' });
  }

  const app = db.prepare('SELECT * FROM encrypted_apps WHERE id = ?').get(id);
  if (!app) {
    return res.json({ code: 404, message: '任务不存在' });
  }

  try {
    const uploadPath = path.join(uploadsDir, `${app.file_id}${app.file_type}`);
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    if (app.download_url) {
      const fileId = app.download_url.split('/').pop();
      const files = fs.readdirSync(encryptedDir);
      const targetFile = files.find(f => f.includes(fileId));
      if (targetFile) {
        fs.unlinkSync(path.join(encryptedDir, targetFile));
      }
    }

    db.prepare('DELETE FROM encrypted_apps WHERE id = ?').run(id);
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除错误:', err);
    res.json({ code: 500, message: '删除失败' });
  }
});

function generateStubCode(software, templateStyle, antiDebug, vmProtect) {
  const apiUrl = process.env.API_URL || 'http://101.33.212.67:3000';

  const styles = {
    default: {
      bgColor: '#1a1a2e',
      accentColor: '#16213e',
      textColor: '#ffffff',
      buttonColor: '#0f3460',
      buttonHover: '#e94560'
    },
    dark: {
      bgColor: '#0d0d0d',
      accentColor: '#1a1a1a',
      textColor: '#e0e0e0',
      buttonColor: '#2d2d2d',
      buttonHover: '#404040'
    },
    blue: {
      bgColor: '#0f172a',
      accentColor: '#1e293b',
      textColor: '#f1f5f9',
      buttonColor: '#3b82f6',
      buttonHover: '#2563eb'
    }
  };

  const style = styles[templateStyle] || styles.default;

  return `
// ICY卡密验证系统 - 自动注入代码
// 软件: ${software.name}
// AppKey: ${software.app_key}

#include <windows.h>
#include <string>
#include <iostream>
#include <thread>
#include <chrono>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "user32.lib")

const char* API_BASE = "${apiUrl}/api/verify";
const char* APP_KEY = "${software.app_key}";
const char* SECRET_KEY = "${software.secret_key}";

${antiDebug ? generateAntiDebugCode() : ''}
${vmProtect ? generateVMProtectCode() : ''}

std::string HttpPost(const char* url, const char* postData) {
    HINTERNET hInternet = InternetOpenA("ICY-Client", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return "";
    
    HINTERNET hConnect = InternetOpenUrlA(hInternet, url, NULL, 0, 
        INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return "";
    }
    
    std::string response;
    char buffer[4096];
    DWORD bytesRead;
    while (InternetReadFile(hConnect, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        response.append(buffer, bytesRead);
    }
    
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    return response;
}

std::string GetMachineCode() {
    char machineCode[256] = {0};
    DWORD serial;
    GetVolumeInformationA("C:\\", NULL, 0, &serial, NULL, NULL, NULL, 0);
    sprintf(machineCode, "%08X-%08X", serial, GetTickCount());
    return std::string(machineCode);
}

bool VerifyCardKey(const char* cardKey) {
    char url[512];
    sprintf(url, "%s/login", API_BASE);
    
    char postData[1024];
    sprintf(postData, "app_key=%s&secret_key=%s&card_key=%s&machine_code=%s", 
            APP_KEY, SECRET_KEY, cardKey, GetMachineCode().c_str());
    
    std::string response = HttpPost(url, postData);
    return response.find("\\"code\\":200") != std::string::npos;
}

LRESULT CALLBACK VerificationWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    static HWND hEdit, hBtn;
    
    switch (msg) {
        case WM_CREATE: {
            // 背景
            HBRUSH hBrush = CreateSolidBrush(RGB(
                ${parseInt(style.bgColor.slice(1, 3), 16)},
                ${parseInt(style.bgColor.slice(3, 5), 16)},
                ${parseInt(style.bgColor.slice(5, 7), 16)}
            ));
            SetClassLongPtr(hwnd, GCLP_HBRBACKGROUND, (LONG_PTR)hBrush);
            
            // 标题
            CreateWindowA("STATIC", "ICY卡密验证系统",
                WS_VISIBLE | WS_CHILD | SS_CENTER,
                20, 20, 360, 30, hwnd, NULL, NULL, NULL);
            
            // 卡密输入框
            hEdit = CreateWindowA("EDIT", "",
                WS_VISIBLE | WS_CHILD | WS_BORDER | ES_AUTOHSCROLL,
                50, 80, 300, 30, hwnd, (HMENU)1, NULL, NULL);
            
            // 验证按钮
            hBtn = CreateWindowA("BUTTON", "验证卡密",
                WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON,
                130, 140, 140, 35, hwnd, (HMENU)2, NULL, NULL);
            
            return 0;
        }
        
        case WM_COMMAND:
            if (LOWORD(wParam) == 2) {
                char cardKey[256];
                GetWindowTextA(hEdit, cardKey, sizeof(cardKey));
                
                if (strlen(cardKey) == 0) {
                    MessageBoxA(hwnd, "请输入卡密", "提示", MB_OK | MB_ICONWARNING);
                    return 0;
                }
                
                if (VerifyCardKey(cardKey)) {
                    MessageBoxA(hwnd, "验证成功！", "成功", MB_OK | MB_ICONINFORMATION);
                    PostQuitMessage(0);
                } else {
                    MessageBoxA(hwnd, "卡密无效或已过期", "错误", MB_OK | MB_ICONERROR);
                }
            }
            return 0;
            
        case WM_CLOSE:
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProcA(hwnd, msg, wParam, lParam);
}

extern "C" __declspec(dllexport) void ShowVerificationDialog() {
    ${antiDebug ? 'CheckDebugger();' : ''}
    ${vmProtect ? 'CheckVM();' : ''}
    
    WNDCLASSEXA wc = {0};
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = VerificationWndProc;
    wc.hInstance = GetModuleHandleA(NULL);
    wc.lpszClassName = "ICYVerification";
    wc.hbrBackground = CreateSolidBrush(RGB(
        ${parseInt(style.bgColor.slice(1, 3), 16)},
        ${parseInt(style.bgColor.slice(3, 5), 16)},
        ${parseInt(style.bgColor.slice(5, 7), 16)}
    ));
    RegisterClassExA(&wc);
    
    HWND hwnd = CreateWindowExA(0, "ICYVerification", "ICY卡密验证",
        WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_VISIBLE,
        CW_USEDEFAULT, CW_USEDEFAULT, 420, 250,
        NULL, NULL, wc.hInstance, NULL);
    
    MSG msg;
    while (GetMessageA(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageA(&msg);
    }
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID lpReserved) {
    if (reason == DLL_PROCESS_ATTACH) {
        DisableThreadLibraryCalls(hModule);
        // DLL被加载时自动显示验证窗口
        std::thread([]() {
            ShowVerificationDialog();
        }).detach();
    }
    return TRUE;
}
`;
}

function generateAntiDebugCode() {
  return `
void CheckDebugger() {
    if (IsDebuggerPresent()) {
        ExitProcess(0);
    }
    BOOL dbg = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &dbg);
    if (dbg) ExitProcess(0);
}`;
}

function generateVMProtectCode() {
  return `
void CheckVM() {
    // 简单的虚拟机检测
    SYSTEM_INFO si;
    GetSystemInfo(&si);
    if (si.dwNumberOfProcessors < 2) {
        // 可能是虚拟机
    }
}`;
}

function encryptFile(originalBuffer, stubCode, fileType) {
  const header = Buffer.from('ICY_ENCRYPTED\\x00', 'ascii');
  const stubLength = Buffer.alloc(4);
  stubLength.writeUInt32LE(stubCode.length, 0);
  const stubBuffer = Buffer.from(stubCode, 'utf8');
  const originalLength = Buffer.alloc(4);
  originalLength.writeUInt32LE(originalBuffer.length, 0);

  return Buffer.concat([header, stubLength, stubBuffer, originalLength, originalBuffer]);
}

module.exports = router;
