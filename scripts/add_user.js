const { randomBytes, scryptSync } = require('crypto');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
let dbUrl = '';
for (const line of envLines) {
    const m = line.match(/^DATABASE_URL="(.+)"$/);
    if (m) { dbUrl = m[1]; break; }
}
if (!dbUrl) { console.error('DATABASE_URL not found'); process.exit(1); }

const pool = new Pool({ connectionString: dbUrl });

const password = 'Yashwanth@123';
const salt = randomBytes(16).toString('hex');
const dk = scryptSync(password, salt, 64).toString('hex');
const hash = 'scrypt$' + salt + '$' + dk;

const email = 'yashwanthn36@gmail.com';
const name = 'Yashwanth N';
const role = 'SUPER_ADMIN';

pool.query(
    'INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4::\"Role\", NOW(), NOW()) ON CONFLICT (email) DO NOTHING RETURNING email, role',
    [email, hash, name, role]
).then(res => {
    if (res.rows.length === 0) {
        console.log('User already exists with that email.');
    } else {
        console.log('✅ User created successfully!');
        console.log('   Email:', res.rows[0].email);
        console.log('   Role:', res.rows[0].role);
        console.log('   Password: Yashwanth@123');
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
}).finally(() => pool.end());
