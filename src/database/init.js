const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/kami.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;
let SQL;

async function initDatabase() {
  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS software (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      app_key TEXT UNIQUE NOT NULL,
      secret_key TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      description TEXT,
      version TEXT DEFAULT '1.0.0',
      notice TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS encrypted_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      software_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      file_id TEXT,
      template_style TEXT DEFAULT 'default',
      random_filename INTEGER DEFAULT 0,
      anti_debug INTEGER DEFAULT 0,
      vm_protect INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      download_url TEXT,
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (software_id) REFERENCES software(id)
    )
  `);

  const adminResult = db.exec("SELECT id FROM admins WHERE username = 'icy'");
  if (adminResult.length === 0 || adminResult[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync('cc020818', 10);
    db.run(`INSERT INTO admins (username, password, role) VALUES (?, ?, ?)`, ['icy', hashedPassword, 'super_admin']);
    console.log('✅ 默认管理员账号已创建: icy / cc020818');
  }

  saveDatabase();

  return Promise.resolve();
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function prepare(sql) {
  return {
    run: function(...params) {
      db.run(sql, params);
      const lastId = getLastInsertRowId();
      const changes = db.getRowsModified();
      saveDatabase();
      return { changes: changes, lastInsertRowid: lastId };
    },
    get: function(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: function(...params) {
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
}

function getLastInsertRowId() {
  const result = db.exec("SELECT last_insert_rowid() as id");
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return 0;
}

function exec(sql) {
  db.run(sql);
  saveDatabase();
}

module.exports = { db: { prepare, exec, run: (sql) => { db.run(sql); saveDatabase(); } }, initDatabase, saveDatabase };
