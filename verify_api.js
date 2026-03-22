/**
 * ============================================
 * ICY卡密验证系统 - 后端验证接口
 * ============================================
 * 
 * 这是DLL调用验证的核心接口
 * 
 * 接口地址: POST /api/verify/login
 * 请求参数:
 *   - app_key: 软件的app_key
 *   - card_key: 卡密
 *   - machine_code: 机器码(可选)
 * 
 * 返回格式:
 *   { code: 200, message: "验证成功", data: {...} }
 *   { code: 400, message: "验证失败原因" }
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// 获取客户端IP
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.ip;
}

// 添加日志
function addLog(softwareId, userId, action, ip, userAgent, detail) {
    db.prepare(`INSERT INTO logs (software_id, user_id, action, ip, user_agent, detail) 
                VALUES (?, ?, ?, ?, ?, ?)`).run(softwareId, userId, action, ip, userAgent, detail);
}

// 验证软件
function verifySoftware(appKey, secretKey) {
    return db.prepare('SELECT * FROM software WHERE app_key = ? AND secret_key = ? AND status = 1').get(appKey, secretKey);
}

// ============================================
// 核心验证接口 - DLL调用此接口验证卡密
// ============================================
router.post('/login', (req, res) => {
    const { app_key, card_key, machine_code } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    // 参数验证
    if (!app_key || !card_key) {
        return res.json({ code: 400, message: '参数不完整' });
    }

    // 验证软件
    const software = db.prepare('SELECT * FROM software WHERE app_key = ? AND status = 1').get(app_key);
    if (!software) {
        addLog(null, null, 'verify_failed', ip, userAgent, `无效软件: ${app_key}`);
        return res.json({ code: 403, message: '软件验证失败' });
    }

    // 查询卡密
    const card = db.prepare('SELECT * FROM cards WHERE card_key = ? AND software_id = ?').get(card_key, software.id);
    
    if (!card) {
        addLog(software.id, null, 'verify_failed', ip, userAgent, `无效卡密: ${card_key}`);
        return res.json({ code: 400, message: '卡密无效' });
    }

    // 检查卡密状态
    if (card.status === 1) {
        // 已使用 - 检查是否同一机器
        if (card.bind_machine && machine_code && card.bind_machine !== machine_code) {
            addLog(software.id, null, 'verify_failed', ip, userAgent, `机器码不匹配: ${machine_code}`);
            return res.json({ code: 403, message: '卡密已在其他设备使用' });
        }
        
        // 检查是否过期
        if (card.expire_at && new Date(card.expire_at) < new Date()) {
            addLog(software.id, null, 'verify_failed', ip, userAgent, `卡密已过期: ${card_key}`);
            return res.json({ code: 403, message: '卡密已过期' });
        }
    } else if (card.status === 2) {
        addLog(software.id, null, 'verify_failed', ip, userAgent, `卡密已禁用: ${card_key}`);
        return res.json({ code: 403, message: '卡密已被禁用' });
    } else if (card.status === 0) {
        // 首次使用 - 激活卡密
        const now = new Date();
        let expireAt = null;
        
        if (card.card_type === 'time') {
            switch (card.duration_unit) {
                case 'day': now.setDate(now.getDate() + card.duration); break;
                case 'month': now.setMonth(now.getMonth() + card.duration); break;
                case 'year': now.setFullYear(now.getFullYear() + card.duration); break;
            }
            expireAt = now.toISOString();
        } else if (card.card_type === 'permanent') {
            expireAt = null; // 永久
        }
        
        // 更新卡密状态
        db.prepare(`UPDATE cards SET status = 1, bind_machine = ?, activated_at = ?, expire_at = ? WHERE id = ?`)
            .run(machine_code || null, new Date().toISOString(), expireAt, card.id);
        
        addLog(software.id, null, 'card_activated', ip, userAgent, `卡密激活: ${card_key}`);
    }

    // 验证成功
    addLog(software.id, null, 'verify_success', ip, userAgent, `验证成功: ${card_key}`);

    res.json({
        code: 200,
        message: '验证成功',
        data: {
            card_key: card.card_key,
            card_type: card.card_type,
            expire_at: card.expire_at,
            software: {
                name: software.name,
                version: software.version,
                notice: software.notice
            }
        }
    });
});

// ============================================
// 用户注册接口 (使用卡密注册)
// ============================================
router.post('/register', (req, res) => {
    const { app_key, secret_key, username, password, card_key, machine_code } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    const software = verifySoftware(app_key, secret_key);
    if (!software) {
        return res.json({ code: 403, message: '软件验证失败' });
    }

    if (!username || !password || !card_key) {
        return res.json({ code: 400, message: '参数不完整' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
    if (existingUser) {
        return res.json({ code: 400, message: '用户名已存在' });
    }

    const card = db.prepare('SELECT * FROM cards WHERE card_key = ? AND software_id = ? AND status = 0').get(card_key, software.id);
    if (!card) {
        addLog(software.id, null, 'register_failed', ip, userAgent, `无效卡密: ${card_key}`);
        return res.json({ code: 400, message: '卡密无效或已使用' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    let expireAt = null;
    if (card.card_type === 'time') {
        const now = new Date();
        switch (card.duration_unit) {
            case 'day': now.setDate(now.getDate() + card.duration); break;
            case 'month': now.setMonth(now.getMonth() + card.duration); break;
            case 'year': now.setFullYear(now.getFullYear() + card.duration); break;
        }
        expireAt = now.toISOString();
    }

    const result = db.prepare(`INSERT INTO users (username, password, software_id, machine_code, expire_at) 
                               VALUES (?, ?, ?, ?, ?)`).run(username, hashedPassword, software.id, machine_code || null, expireAt);

    const now = new Date();
    db.prepare(`UPDATE cards SET status = 1, bind_user = ?, bind_machine = ?, activated_at = ?, expire_at = ? WHERE id = ?`)
        .run(username, machine_code || null, now.toISOString(), expireAt, card.id);

    addLog(software.id, result.lastInsertRowid, 'register', ip, userAgent, `注册成功, 卡密: ${card_key}`);

    res.json({
        code: 200,
        message: '注册成功',
        data: { username, expire_at: expireAt }
    });
});

// ============================================
// 用户登录接口
// ============================================
router.post('/user-login', (req, res) => {
    const { app_key, secret_key, username, password, machine_code } = req.body;
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    const software = verifySoftware(app_key, secret_key);
    if (!software) {
        return res.json({ code: 403, message: '软件验证失败' });
    }

    if (!username || !password) {
        return res.json({ code: 400, message: '参数不完整' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND software_id = ?').get(username, software.id);
    if (!user) {
        addLog(software.id, null, 'login_failed', ip, userAgent, `用户不存在: ${username}`);
        return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const bcrypt = require('bcryptjs');
    if (!bcrypt.compareSync(password, user.password)) {
        addLog(software.id, user.id, 'login_failed', ip, userAgent, '密码错误');
        return res.json({ code: 400, message: '用户名或密码错误' });
    }

    if (user.status !== 1) {
        addLog(software.id, user.id, 'login_failed', ip, userAgent, '账号已禁用');
        return res.json({ code: 403, message: '账号已被禁用' });
    }

    if (user.expire_at && new Date(user.expire_at) < new Date()) {
        addLog(software.id, user.id, 'login_failed', ip, userAgent, '授权已过期');
        return res.json({ code: 403, message: '授权已过期' });
    }

    if (software.bind_machine === 1 && machine_code) {
        if (user.machine_code && user.machine_code !== machine_code) {
            addLog(software.id, user.id, 'login_failed', ip, userAgent, `机器码不匹配: ${machine_code}`);
            return res.json({ code: 403, message: '机器码不匹配' });
        }
        
        if (!user.machine_code) {
            db.prepare('UPDATE users SET machine_code = ? WHERE id = ?').run(machine_code, user.id);
        }
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    addLog(software.id, user.id, 'login', ip, userAgent, '登录成功');

    res.json({
        code: 200,
        message: '登录成功',
        data: {
            username: user.username,
            expire_at: user.expire_at,
            machine_code: user.machine_code
        }
    });
});

// ============================================
// 软件信息接口
// ============================================
router.post('/software-info', (req, res) => {
    const { app_key, secret_key } = req.body;

    const software = db.prepare('SELECT name, version, notice, status FROM software WHERE app_key = ? AND secret_key = ?').get(app_key, secret_key);
    if (!software) {
        return res.json({ code: 403, message: '软件验证失败' });
    }

    if (software.status !== 1) {
        return res.json({ code: 403, message: '软件已停用' });
    }

    res.json({
        code: 200,
        data: {
            name: software.name,
            version: software.version,
            notice: software.notice
        }
    });
});

module.exports = router;

// ============================================
// 使用示例 (DLL调用)
// ============================================
/*
// C/C++ 调用示例:

#include <wininet.h>

BOOL VerifyCard(const char* appKey, const char* cardKey, const char* machineCode) {
    char postData[512];
    sprintf(postData, "{\"app_key\":\"%s\",\"card_key\":\"%s\",\"machine_code\":\"%s\"}", 
            appKey, cardKey, machineCode);
    
    // HTTP POST 到 http://your-server/api/verify/login
    // 检查返回的 code 是否为 200
}
*/
