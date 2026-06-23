import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://clwuaqgvawzrdrofoheg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcVhvOaiHB_ZECeOfdR7Og_gxkvbGGG';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching profiles...');
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles count:', data.length);
    if (data.length > 0) {
      console.log('Profiles columns:', Object.keys(data[0]));
      console.log('Sample profiles:', data);
    } else {
      console.log('No profiles found in the profiles table.');
    }
  }
}

run();
