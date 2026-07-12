const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="([^"]+)"/);
process.env.DATABASE_URL = match[1];

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'dummy.user@transitops.in' } }).then(async (user) => {
    if (!user) { console.log('USER NOT FOUND'); return; }
    console.log('USER ROLE:', user.role);

    const { scryptSync, timingSafeEqual } = require('crypto');
    const [scheme, salt, hash] = user.password.split('$');
    const derivedKey = scryptSync('DummyUser@12345', salt, 64);
    const storedKey = Buffer.from(hash, 'hex');
    console.log('PASSWORD MATCHES:', timingSafeEqual(storedKey, derivedKey));
    console.log('ROLE MATCHES:', user.role === 'FLEET_MANAGER');
}).catch(console.error).finally(() => prisma.$disconnect());
