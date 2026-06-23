const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://clwuaqgvawzrdrofoheg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcVhvOaiHB_ZECeOfdR7Og_gxkvbGGG';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching last 10 reports from Supabase...');
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Fetch error:', error);
  } else {
    console.log(`Success! Fetched ${data.length} reports.`);
    data.forEach((r, idx) => {
      console.log(`\n[${idx + 1}] ID: ${r.id}`);
      console.log(`Title: ${r.title}`);
      console.log(`Citizen ID: ${r.citizen_id}`);
      console.log(`Category: ${r.category}`);
      console.log(`Status: ${r.status}`);
      console.log(`Location: (${r.latitude}, ${r.longitude})`);
      console.log(`Created At: ${r.created_at}`);
    });
  }
}

run();
