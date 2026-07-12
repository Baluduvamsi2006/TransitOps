const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) throw new Error("No DATABASE_URL found");
const pool = new Pool({ connectionString: match[1] });
pool.query('SELECT email, password, role FROM "User"').then(res => console.log(res.rows)).catch(console.error).finally(() => pool.end());
