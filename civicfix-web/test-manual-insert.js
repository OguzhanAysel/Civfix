import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://clwuaqgvawzrdrofoheg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcVhvOaiHB_ZECeOfdR7Og_gxkvbGGG';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const testId = '00000000-0000-0000-0000-000000000000';
  console.log('Inserting test profile with all columns...');
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: testId, 
        full_name: 'Direct Test User',
        role: 'citizen',
        phone_number: '1234567890',
        trust_score: 100,
        reports_count: 0,
        verified_count: 0,
        badge: 'Yeni Vatandaş'
      }
    ])
    .select();

  if (error) {
    console.error('Insert error code:', error.code);
    console.error('Insert error message:', error.message);
    console.error('Insert error details:', error.details);
  } else {
    console.log('Insert success! Returned data:', data);
  }
}

run();
