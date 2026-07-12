const { Pool } = require('pg');

const DB_URL = "postgresql://neondb_owner:npg_QUSeitkH19Ya@ep-odd-mud-atobs3nj-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString: DB_URL });

pool.query(`SELECT typname, enumlabel FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid`)
    .then(res => console.log('ENUM VALUES:', JSON.stringify(res.rows)))
    .catch(console.error)
    .finally(() => pool.end());
