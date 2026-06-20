import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jfarspcvbclqkotzddhc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXJzcGN2YmNscWtvdHpkZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTAxOTQsImV4cCI6MjA2ODAyNjE5NH0.PXUmOri_5kjpfw3dpNqrhD2PHn8DZkj21yUgepB5Ac4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("profiles")
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.log("Profiles columns:", Object.keys(data[0] || {}));
  }
}

main().catch(console.error);
