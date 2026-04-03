import { supabaseAdmin } from '../src/config/supabase';

async function seedUsers() {
  console.log('🌱 Seeding Supabase Auth with Mock Users...');

  const usersToSeed = [
    { email: 'citizen@flowguard.com', password: 'password123', role: 'citizen', name: 'Muthu (Citizen)' },
    { email: 'admin@flowguard.com', password: 'password123', role: 'admin', name: 'City Admin User' },
  ];

  for (const user of usersToSeed) {
    console.log(`Checking ${user.email}...`);
    
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role, full_name: user.name }
    });

    if (authError && authError.message.includes('already been registered')) {
      console.log(`   ✅ ${user.email} already exists in Auth.`);
    } else if (authError) {
      console.error(`   ❌ Failed to create ${user.email}:`, authError.message);
      continue;
    } else if (authData.user) {
      console.log(`   ✅ Created Auth User: ${user.email} (ID: ${authData.user.id})`);
      
      // 2. Ensure profile exists (Triggers might do this automatically, but just in case)
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        role: user.role,
        full_name: user.name,
        phone_number: '+919999999999'
      });
      
      if (profileError) {
        console.error(`   ⚠️ Failed to seed profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`   ✅ Profile linked successfully for config role [${user.role}]`);
      }
    }
  }

  console.log('✅ Done seeding.');
  process.exit(0);
}

seedUsers();
