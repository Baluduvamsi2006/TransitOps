const { Pool } = require('pg');
const { randomBytes, scryptSync } = require('crypto');

const DB_URL = "postgresql://neondb_owner:npg_QUSeitkH19Ya@ep-odd-mud-atobs3nj-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString: DB_URL });

function h(password) {
    const salt = randomBytes(16).toString('hex');
    const key = scryptSync(password, salt, 64).toString('hex');
    return 'scrypt$' + salt + '$' + key;
}

async function seed() {
    // Check actual enum type name first
    const enumRes = await pool.query(`SELECT typname FROM pg_type WHERE typtype = 'e' AND typname ILIKE '%role%'`);
    const roleEnumName = enumRes.rows.length > 0 ? enumRes.rows[0].typname : 'Role';
    console.log('Role enum type name:', roleEnumName);

    const users = [
        { name: 'Super Admin', email: 'superadmin@transitops.in', password: h('SuperAdmin@12345'), role: 'SUPER_ADMIN' },
        { name: 'Dummy Fleet Manager', email: 'dummy.user@transitops.in', password: h('DummyUser@12345'), role: 'FLEET_MANAGER' },
        { name: 'Dummy 2 Dispatcher', email: 'dummy2@transitops.in', password: h('Dummy2@12345'), role: 'DISPATCHER' },
    ];

    for (const u of users) {
        const existing = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [u.email]);
        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE "User" SET name=$1, password=$2, role=$3::\"${roleEnumName}\", "failedLoginAttempts"=0, "lockedUntil"=NULL, "updatedAt"=NOW() WHERE email=$4`,
                [u.name, u.password, u.role, u.email]
            );
            console.log('Updated:', u.email);
        } else {
            await pool.query(
                `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4::\"${roleEnumName}\", NOW(), NOW())`,
                [u.name, u.email, u.password, u.role]
            );
            console.log('Inserted:', u.email);
        }
    }
    console.log('\nAll done!');
}

seed().catch(console.error).finally(() => pool.end());
