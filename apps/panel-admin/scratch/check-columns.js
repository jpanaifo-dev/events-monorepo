import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jfarspcvbclqkotzddhc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXJzcGN2YmNscWtvdHpkZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTAxOTQsImV4cCI6MjA2ODAyNjE5NH0.PXUmOri_5kjpfw3dpNqrhD2PHn8DZkj21yUgepB5Ac4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Query foreign key information via SQL query using a raw RPC if available,
  // or query the pg_constraint information if possible. Since Supabase REST API doesn't allow raw SQL queries directly without RPC,
  // let's try querying different system views or check if there is an RPC we can use.
  // Alternatively, we can inspect metadata about columns, or query some tables.
  // Let's try querying a table that holds constraint info, or try to insert a fake parent_activity_id to see if it triggers an error.
  
  // Let's print table information by inspecting some system views if they are exposed.
  // Typically they might not be exposed under 'public' schema, but let's test if we can query 'pg_catalog' tables.
  const { data, error } = await supabase.from('event_activities').select('id, parent_activity_id').limit(10);
  console.log("Existing event activities:", data);
  console.log("Error if any:", error);
}

main().catch(console.error);
