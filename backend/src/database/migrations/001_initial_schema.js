/**
 * Initial schema migration
 * Creates all base tables for the TorBox backend
 */
export const up = (db) => {
  const tables = [
    // Users table - stores encrypted API keys per user
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      api_key_hash TEXT UNIQUE NOT NULL,
      encrypted_api_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Automation rules table - now with user_id
    `CREATE TABLE IF NOT EXISTS automation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      enabled BOOLEAN DEFAULT true,
      trigger_config TEXT NOT NULL,
      conditions TEXT NOT NULL,
      action_config TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // Download history table
    `CREATE TABLE IF NOT EXISTS download_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      download_url TEXT NOT NULL,
      file_size INTEGER,
      status TEXT DEFAULT 'completed',
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // User settings table
    `CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Storage table for key-value pairs
    `CREATE TABLE IF NOT EXISTS storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Rule execution log
    `CREATE TABLE IF NOT EXISTS rule_execution_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      rule_name TEXT NOT NULL,
      execution_type TEXT NOT NULL,
      items_processed INTEGER DEFAULT 0,
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES automation_rules (id)
    )`
  ];

  for (const table of tables) {
    db.prepare(table).run();
  }

  // Create indexes for better performance
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_api_key_hash ON users(api_key_hash)`
  ];

  for (const index of indexes) {
    db.prepare(index).run();
  }
};

export const down = (db) => {
  const tables = [
    'rule_execution_log',
    'storage',
    'user_settings',
    'download_history',
    'automation_rules',
    'users'
  ];

  for (const table of tables) {
    db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  }
};

