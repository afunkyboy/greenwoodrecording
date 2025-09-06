import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { program } from 'commander';
import readline from 'readline';
import { hideBin } from 'yargs/helpers';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.log('Please create a .env file with the following variables:');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser(email: string, password: string) {
  try {
    console.log(`Creating admin user: ${email}`);
    
    // Create the user
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Admin User'
      }
    });

    if (signUpError) throw signUpError;

    console.log('✅ Admin user created successfully!');
    console.log('User ID:', authData.user.id);
    
    return authData.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  program
    .requiredOption('-e, --email <email>', 'Email for the admin user')
    .requiredOption('-p, --password <password>', 'Password for the admin user')
    .parse(process.argv);

  const options = program.opts();
  
  try {
    await createAdminUser(options.email, options.password);
    console.log('✅ Setup complete! You can now log in with the admin credentials.');
  } catch (error) {
    console.error('❌ Failed to create admin user');
    process.exit(1);
  }
}

main();
