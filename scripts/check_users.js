const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) process.exit(1);
const pool = new Pool({ connectionString: match[1] });
pool.query(`SELECT email, role, "failedLoginAttempts", "lockedUntil" FROM "User"`)
    .then(res => {
        console.log('TOTAL USERS:', res.rows.length);
        res.rows.forEach(r => console.log(r.email, r.role, 'fails:', r.failedLoginAttempts, 'locked:', r.lockedUntil));
    })
    .catch(console.error)
    .finally(() => pool.end());
