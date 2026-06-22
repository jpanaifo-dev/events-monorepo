import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jfarspcvbclqkotzddhc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXJzcGN2YmNscWtvdHpkZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTAxOTQsImV4cCI6MjA2ODAyNjE5NH0.PXUmOri_5kjpfw3dpNqrhD2PHn8DZkj21yUgepB5Ac4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  console.log(`Checking table: ${tableName}`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`  Error: ${error.message} (${error.code})`);
  } else {
    console.log(`  Success! Table exists. Row sample:`, data);
  }
}

async function main() {
  await checkTable('event_sessions');
  await checkTable('session_speakers');
  await checkTable('session_resources');
  await checkTable('session_thematic_lines');
  await checkTable('thematic_lines');
}

main();
