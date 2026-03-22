-- ============================================
-- ICY卡密验证系统 - 数据库表结构
-- ============================================

-- 1. 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. 软件表
CREATE TABLE IF NOT EXISTS software (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    app_key TEXT UNIQUE NOT NULL,
    secret_key TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    description TEXT,
    version TEXT DEFAULT '1.0.0',
    notice TEXT,
    bind_machine INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 卡密表 (核心表)
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_key TEXT UNIQUE NOT NULL,
    software_id INTEGER NOT NULL,
    card_type TEXT DEFAULT 'time',
    duration INTEGER DEFAULT 30,
    duration_unit TEXT DEFAULT 'day',
    status INTEGER DEFAULT 0,
    bind_user TEXT,
    bind_machine TEXT,
    activated_at DATETIME,
    expire_at DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (software_id) REFERENCES software(id)
);

-- 卡密状态说明:
-- status = 0: 未使用
-- status = 1: 已使用
-- status = 2: 已禁用

-- 卡密类型说明:
-- card_type = 'time': 时间卡(天/月/年)
-- card_type = 'count': 次数卡
-- card_type = 'permanent': 永久卡

-- 4. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    software_id INTEGER NOT NULL,
    machine_code TEXT,
    expire_at DATETIME,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    FOREIGN KEY (software_id) REFERENCES software(id)
);

-- 5. 日志表
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (software_id) REFERENCES software(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. 配置表
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cards_card_key ON cards(card_key);
CREATE INDEX IF NOT EXISTS idx_cards_software_id ON cards(software_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_software_id ON users(software_id);
CREATE INDEX IF NOT EXISTS idx_logs_software_id ON logs(software_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- ============================================
-- 示例数据
-- ============================================

-- 插入默认管理员 (密码: admin123)
-- INSERT INTO admins (username, password, role) VALUES ('admin', '$2a$10$...', 'super_admin');

-- 插入示例软件
-- INSERT INTO software (name, app_key, secret_key, status) VALUES ('示例软件', 'APP_KEY_HERE', 'SECRET_KEY_HERE', 1);

-- 插入示例卡密
-- INSERT INTO cards (card_key, software_id, card_type, duration, duration_unit, status) VALUES ('KAMI-XXXX-XXXX-XXXX', 1, 'time', 30, 'day', 0);
