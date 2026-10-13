const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  console.log('Connecting to Cloud SQL...');
  const client = await pool.connect();
  try {
    const seedSql = fs.readFileSync(path.join(__dirname, '../supabase_seed_data.sql'), 'utf8');
    console.log('Executing seed SQL (size: ' + seedSql.length + ' bytes)...');
    await client.query(seedSql);
    console.log('Cloud SQL successfully seeded with all initial data!');

    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.users) as count_users,
        (SELECT COUNT(*) FROM public.employees) as count_employees,
        (SELECT COUNT(*) FROM public.departments) as count_departments,
        (SELECT COUNT(*) FROM public.tasks) as count_tasks,
        (SELECT COUNT(*) FROM public.reminders) as count_reminders,
        (SELECT COUNT(*) FROM public.presences) as count_presences,
        (SELECT COUNT(*) FROM public.inventory) as count_inventory,
        (SELECT COUNT(*) FROM public.partners) as count_partners,
        (SELECT COUNT(*) FROM public.documents) as count_documents,
        (SELECT COUNT(*) FROM public.admin_audit_logs) as count_audit_logs;
    `);
    console.log('Current table counts:', counts.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Error executing seed on Cloud SQL:', err);
  process.exit(1);
});
