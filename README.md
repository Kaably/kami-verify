# 卡密网络验证系统

基于 Node.js + Vue3 开发的轻量级卡密验证系统，参考了 kamiFaka 和 verifymall 两个开源项目的优点。

## 功能特性

- **卡密管理**: 批量生成、导出、状态管理
- **验证API**: 注册、登录、充值、信息查询
- **后台管理**: 软件管理、用户管理、日志统计
- **安全机制**: IP限流、JWT认证、机器码绑定

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装运行

```bash
# 1. 安装后端依赖
cd kami-verify
npm install

# 2. 启动后端服务
npm run dev

# 3. 安装前端依赖 (新终端)
cd admin
npm install

# 4. 启动前端服务
npm run dev
```

### 访问地址

- 后台管理: http://localhost:8080
- API地址: http://localhost:3000/api
- 默认账号: admin / admin123

## API 接口文档

### 验证接口 (供软件调用)

所有验证接口需要传递 `app_key` 和 `secret_key` 进行软件身份验证。

#### 用户注册
```
POST /api/verify/register
参数: app_key, secret_key, username, password, card_key, machine_code(可选)
```

#### 用户登录
```
POST /api/verify/login
参数: app_key, secret_key, username, password, machine_code(可选)
```

#### 卡密充值
```
POST /api/verify/recharge
参数: app_key, secret_key, username, card_key
```

#### 用户信息
```
POST /api/verify/info
参数: app_key, secret_key, username
```

#### 软件信息
```
POST /api/verify/software-info
参数: app_key, secret_key
```

## SDK 示例

### 易语言 SDK

```e
.版本 2

.程序集 窗口程序集_启动窗口
.程序集变量 app_key, 文本型
.程序集变量 secret_key, 文本型
.程序集变量 api_url, 文本型

.子程序 _按钮_登录_被单击
.局部变量 result, 文本型
.局部变量 json, 类

result = HTTP请求_POST(api_url + "/verify/login", "app_key=" + app_key + "&secret_key=" + secret_key + "&username=" + 编辑框_用户名.内容 + "&password=" + 编辑框_密码.内容 + "&machine_code=" + 取机器码())
json.解析(result)

.如果 (json.取通用属性("code") = "200")
    信息框("登录成功，到期时间：" + json.取通用属性("data.expire_at"), 0, , )
.否则
    信息框(json.取通用属性("message"), 0, , )
.如果结束

.子程序 取机器码, 文本型
.局部变量 硬盘号, 文本型

硬盘号 = 取硬盘特征字()
返回 (MD5(硬盘号))
```

### C# SDK

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class KamiVerifySDK
{
    private string apiUrl;
    private string appKey;
    private string secretKey;
    private HttpClient client;

    public KamiVerifySDK(string apiUrl, string appKey, string secretKey)
    {
        this.apiUrl = apiUrl;
        this.appKey = appKey;
        this.secretKey = secretKey;
        this.client = new HttpClient();
    }

    public JObject Login(string username, string password, string machineCode = null)
    {
        var data = new
        {
            app_key = appKey,
            secret_key = secretKey,
            username = username,
            password = password,
            machine_code = machineCode
        };
        return PostRequest("/verify/login", data);
    }

    public JObject Register(string username, string password, string cardKey, string machineCode = null)
    {
        var data = new
        {
            app_key = appKey,
            secret_key = secretKey,
            username = username,
            password = password,
            card_key = cardKey,
            machine_code = machineCode
        };
        return PostRequest("/verify/register", data);
    }

    public JObject Recharge(string username, string cardKey)
    {
        var data = new
        {
            app_key = appKey,
            secret_key = secretKey,
            username = username,
            card_key = cardKey
        };
        return PostRequest("/verify/recharge", data);
    }

    private JObject PostRequest(string path, object data)
    {
        var json = Newtonsoft.Json.JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = client.PostAsync(apiUrl + path, content).Result;
        var result = response.Content.ReadAsStringAsync().Result;
        return JObject.Parse(result);
    }
}
```

### Python SDK

```python
import requests
import hashlib
import platform

class KamiVerifySDK:
    def __init__(self, api_url, app_key, secret_key):
        self.api_url = api_url
        self.app_key = app_key
        self.secret_key = secret_key
    
    def login(self, username, password, machine_code=None):
        data = {
            'app_key': self.app_key,
            'secret_key': self.secret_key,
            'username': username,
            'password': password,
            'machine_code': machine_code
        }
        return self._post('/verify/login', data)
    
    def register(self, username, password, card_key, machine_code=None):
        data = {
            'app_key': self.app_key,
            'secret_key': self.secret_key,
            'username': username,
            'password': password,
            'card_key': card_key,
            'machine_code': machine_code
        }
        return self._post('/verify/register', data)
    
    def recharge(self, username, card_key):
        data = {
            'app_key': self.app_key,
            'secret_key': self.secret_key,
            'username': username,
            'card_key': card_key
        }
        return self._post('/verify/recharge', data)
    
    def get_info(self, username):
        data = {
            'app_key': self.app_key,
            'secret_key': self.secret_key,
            'username': username
        }
        return self._post('/verify/info', data)
    
    def _post(self, path, data):
        response = requests.post(self.api_url + path, json=data)
        return response.json()

# 使用示例
if __name__ == '__main__':
    sdk = KamiVerifySDK('http://localhost:3000/api', 'your_app_key', 'your_secret_key')
    
    # 登录
    result = sdk.login('test_user', '123456')
    if result['code'] == 200:
        print(f"登录成功，到期时间: {result['data']['expire_at']}")
    else:
        print(f"登录失败: {result['message']}")
```

## 部署指南

### 本地开发

```bash
# 后端
cd kami-verify
npm install
npm run dev

# 前端
cd admin
npm install
npm run dev
```

### 生产部署

#### 使用 PM2 部署后端

```bash
npm install -g pm2
cd kami-verify
npm install --production
pm2 start src/app.js --name kami-api
```

#### 构建前端

```bash
cd admin
npm run build
# 将 dist 目录部署到 Nginx 或其他 Web 服务器
```

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 目录结构

```
kami-verify/
├── src/
│   ├── app.js              # 入口文件
│   ├── database/
│   │   └── init.js         # 数据库初始化
│   ├── middleware/
│   │   └── auth.js         # 认证中间件
│   └── routes/
│       ├── auth.js         # 认证路由
│       ├── cards.js        # 卡密管理
│       ├── software.js     # 软件管理
│       ├── verify.js       # 验证接口
│       ├── users.js        # 用户管理
│       ├── logs.js         # 日志管理
│       └── config.js       # 系统配置
├── data/
│   └── kami.db             # SQLite 数据库
├── package.json
└── README.md

admin/
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   ├── stores/
│   ├── utils/
│   └── views/
├── index.html
├── vite.config.js
└── package.json
```

## 技术栈

- **后端**: Node.js + Express + SQLite
- **前端**: Vue3 + Element Plus + Pinia
- **安全**: JWT + bcrypt + IP限流

## License

MIT
