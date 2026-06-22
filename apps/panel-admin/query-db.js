import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jfarspcvbclqkotzddhc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYXJzcGN2YmNscWtvdHpkZGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTAxOTQsImV4cCI6MjA2ODAyNjE5NH0.PXUmOri_5kjpfw3dpNqrhD2PHn8DZkj21yUgepB5Ac4";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const speakerId = 'a2af5b55-5033-4ca7-affc-cf3d9dfe21e6';
  const newSessionId = crypto.randomUUID();
  const editionId = '7615c713-d85c-4e49-9201-f78790a973cf';

  console.log("Trying to insert new session...");
  const { error: sessionErr } = await supabase
    .from("event_sessions")
    .insert([{
      id: newSessionId,
      title: "Second Session Test",
      edition_id: editionId,
    }]);

  if (sessionErr) {
    console.error("Failed to insert session:", sessionErr);
    return;
  }
  console.log("Session inserted successfully!");

  console.log("Trying to insert session_speakers pivot for the same participant...");
  const { error: speakerErr } = await supabase
    .from("session_speakers")
    .insert([{
      session_id: newSessionId,
      participant_id: speakerId,
      is_main_speaker: true,
    }]);

  if (speakerErr) {
    console.error("Failed to insert session_speaker pivot:", speakerErr);
    // clean up
    await supabase.from("event_sessions").delete().eq("id", newSessionId);
  } else {
    console.log("Success! Multiple sessions are allowed in database.");
    // clean up
    await supabase.from("event_sessions").delete().eq("id", newSessionId);
  }
}

main();
