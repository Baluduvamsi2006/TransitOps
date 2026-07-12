const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) process.exit(1);

const pool = new Pool({ connectionString: match[1] });
pool.query('SELECT email, role, password FROM "User" WHERE email = \'dummy.user@transitops.in\'')
    .then(async (res) => {
        if (res.rows.length === 0) {
            console.log('USER DOES NOT EXIST!');
            return;
        }
        const user = res.rows[0];
        console.log('USER ROLE:', user.role);

        const { scryptSync, timingSafeEqual } = require('crypto');
        const [scheme, salt, hash] = user.password.split('$');
        const derivedKey = scryptSync('DummyUser@12345', salt, 64);
        const storedKey = Buffer.from(hash, 'hex');
        console.log('PASSWORD MATCHES:', timingSafeEqual(storedKey, derivedKey));
    })
    .catch(console.error)
    .finally(() => pool.end());
