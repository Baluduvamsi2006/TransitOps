const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) process.exit(1);
const pool = new Pool({ connectionString: match[1] });

// First check actual column names
pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position`)
    .then(res => {
        console.log('COLUMNS:', res.rows.map(r => r.column_name).join(', '));
        return pool.query(`SELECT email, role FROM "User"`);
    })
    .then(res => {
        console.log('TOTAL USERS:', res.rows.length);
        res.rows.forEach(r => console.log(' -', r.email, '/', r.role));
    })
    .catch(console.error)
    .finally(() => pool.end());
