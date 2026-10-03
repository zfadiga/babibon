const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read local .env.local file
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log(`🔍 Checking database at ${supabaseUrl}...`);
  const tables = ['profiles', 'candies', 'cart_items', 'orders', 'order_items', 'store_settings'];
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error && status === 404) {
        console.log(`⚠️ Table '${table}' does not exist yet (status: 404).`);
      } else if (error) {
        console.log(`⚠️ Table '${table}' returned error: ${error.message} (status: ${status})`);
      } else {
        console.log(`✅ Table '${table}' is active and connected (status: ${status}).`);
      }
    } catch (e) {
      console.log(`❌ Error checking '${table}':`, e.message);
    }
  }
}

checkDatabase();
