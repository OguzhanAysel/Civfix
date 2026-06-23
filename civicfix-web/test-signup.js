import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://clwuaqgvawzrdrofoheg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QcVhvOaiHB_ZECeOfdR7Og_gxkvbGGG';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const randomEmail = `testuser_${Math.floor(Math.random() * 1000000)}@civicfix.com`;
  console.log(`Registering random user: ${randomEmail}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Database User',
        role: 'citizen',
        phone_number: '1234567890'
      }
    }
  });

  if (error) {
    console.error('Signup error:', error);
  } else {
    console.log('Signup success! User data:', data);
  }
}

run();
