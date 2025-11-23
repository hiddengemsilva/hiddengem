const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class IDDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'ids.db');
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to ID database.');
                this.createTable();
            }
        });
    }

    createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS user_ids (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                usage_count INTEGER DEFAULT 1
            )
        `;
        
        this.db.run(sql, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('User IDs table ready.');
            }
        });
    }

    addUserID(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO user_ids (user_id, last_used, usage_count)
                VALUES (?, datetime('now'), COALESCE((SELECT usage_count + 1 FROM user_ids WHERE user_id = ?), 1))
            `;
            
            this.db.run(sql, [userId, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getUserID(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_ids WHERE user_id = ?`;
            
            this.db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getAllUserIDs() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_ids ORDER BY last_used DESC`;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    updateLastUsed(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE user_ids 
                SET last_used = datetime('now'), usage_count = usage_count + 1 
                WHERE user_id = ?
            `;
            
            this.db.run(sql, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    deleteUserID(userId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM user_ids WHERE user_id = ?`;
            
            this.db.run(sql, [userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    getUserStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_users,
                    SUM(usage_count) as total_uses,
                    MAX(last_used) as last_activity
                FROM user_ids
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed.');
                }
            });
        }
    }
}

// Create data directory if it doesn't exist
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = new IDDatabase();
  
