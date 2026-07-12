const fs = require('fs');
const { Pool } = require('pg');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) process.exit(1);

const { randomBytes, scryptSync } = require('crypto');
function h(p) {
    const salt = randomBytes(16).toString('hex');
    const key = scryptSync(p, salt, 64).toString('hex');
    return 'scrypt$' + salt + '$' + key;
}

const pool = new Pool({ connectionString: match[1] });
pool.query(`
    INSERT INTO "User" (id, name, email, password, role, "updatedAt") 
    VALUES (gen_random_uuid(), 'Dummy Fleet Manager', 'dummy.user@transitops.in', $1, 'FLEET_MANAGER', NOW())
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, "failedLoginAttempts" = 0, "lockedUntil" = NULL;
`, [h('DummyUser@12345')]).then(() => {
    pool.query(`
        INSERT INTO "User" (id, name, email, password, role, "updatedAt") 
        VALUES (gen_random_uuid(), 'Dummy 2', 'dummy2@transitops.in', $1, 'DISPATCHER', NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, "failedLoginAttempts" = 0, "lockedUntil" = NULL;
    `, [h('Dummy2@12345')]).then(() => console.log('SEEDED DIRECTLY')).catch(console.error).finally(() => pool.end());
}).catch(console.error);
