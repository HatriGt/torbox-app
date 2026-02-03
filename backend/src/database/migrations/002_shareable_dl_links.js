/**
 * Shareable download links table
 * Stores token -> torbox_url for redirect-only download links (no bandwidth usage)
 */
export const up = (db) => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS shareable_dl_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      torbox_url TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_shareable_dl_links_token ON shareable_dl_links(token)
  `).run();
};

export const down = (db) => {
  db.prepare('DROP TABLE IF EXISTS shareable_dl_links').run();
};
