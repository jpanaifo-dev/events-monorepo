import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jfarspcvbclqkotzddhc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXJzcGN2YmNscWtvdHpkZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTAxOTQsImV4cCI6MjA2ODAyNjE5NH0.PXUmOri_5kjpfw3dpNqrhD2PHn8DZkj21yUgepB5Ac4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.log(`Table ${tableName}: ERROR - ${error.message} (${error.code})`);
  } else {
    console.log(`Table ${tableName}: EXISTS (Found ${data.length} rows)`);
  }
}

async function main() {
  console.log("Checking tables...");
  await checkTable("profiles");
  await checkTable("education");
  await checkTable("employment_history");
  await checkTable("certifications");
}

main().catch(console.error);
