const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) process.exit(1);
const pool = new Pool({ connectionString: match[1] });
pool.query('SELECT email FROM "User"').then(res => {
    console.log(JSON.stringify(res.rows));
}).catch(console.error).finally(() => pool.end());
