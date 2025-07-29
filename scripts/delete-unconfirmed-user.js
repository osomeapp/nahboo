// Script to delete unconfirmed users from Supabase
// Run with: node scripts/delete-unconfirmed-user.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteUnconfirmedUser(email) {
  try {
    console.log(`Looking for unconfirmed user with email: ${email}`)
    
    // Get user by email
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      throw new Error(`Failed to list users: ${getUserError.message}`)
    }
    
    // Find unconfirmed user
    const unconfirmedUser = users.users.find(user => 
      user.email === email && !user.email_confirmed_at
    )
    
    if (!unconfirmedUser) {
      console.log('No unconfirmed user found with that email')
      return
    }
    
    console.log(`Found unconfirmed user: ${unconfirmedUser.id}`)
    
    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      unconfirmedUser.id
    )
    
    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }
    
    console.log('✅ User deleted successfully')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function listUnconfirmedUsers() {
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`)
    }
    
    const unconfirmed = users.users.filter(user => !user.email_confirmed_at)
    
    console.log(`Found ${unconfirmed.length} unconfirmed users:`)
    unconfirmed.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`)
    })
    
    return unconfirmed
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const email = args[1]
  
  if (command === 'list') {
    await listUnconfirmedUsers()
  } else if (command === 'delete' && email) {
    await deleteUnconfirmedUser(email)
  } else {
    console.log('Usage:')
    console.log('  node scripts/delete-unconfirmed-user.js list')
    console.log('  node scripts/delete-unconfirmed-user.js delete <email>')
  }
}

main()