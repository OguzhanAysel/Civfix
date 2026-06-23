import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://clwuaqgvawzrdrofoheg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcVhvOaiHB_ZECeOfdR7Og_gxkvbGGG';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Deleting all reports from Supabase...');
  
  // reports tablosundaki tüm satırları silelim
  const { data, error } = await supabase
    .from('reports')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Delete error:', error);
  } else {
    console.log('Success! All reports deleted.');
  }
}

run();
