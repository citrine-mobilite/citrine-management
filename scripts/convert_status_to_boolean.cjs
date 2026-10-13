const fs = require('fs');

// 1. Update src/db/schema.ts
let schemaTs = fs.readFileSync('src/db/schema.ts', 'utf8');
schemaTs = schemaTs.replace(/status:\s*text\('status'\)[^,\n]*/g, "status: boolean('status').default(true)");
fs.writeFileSync('src/db/schema.ts', schemaTs, 'utf8');

// 2. Update supabase_schema.sql
let sqlSchema = fs.readFileSync('supabase_schema.sql', 'utf8');
sqlSchema = sqlSchema.replace(/status\s+TEXT\s+DEFAULT\s+[^,\n]+/gi, "status BOOLEAN DEFAULT TRUE");
fs.writeFileSync('supabase_schema.sql', sqlSchema, 'utf8');

console.log('Successfully converted status fields to boolean in schema.ts and supabase_schema.sql');
