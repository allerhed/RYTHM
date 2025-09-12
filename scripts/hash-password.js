#!/usr/bin/env node

const bcrypt = require('bcryptjs')

async function hashPassword() {
  const password = 'Password123'
  const saltRounds = 10
  
  try {
    const hash = await bcrypt.hash(password, saltRounds)
    console.log('Password:', password)
    console.log('Hash:', hash)
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash)
    console.log('Verification:', isValid ? 'SUCCESS' : 'FAILED')
  } catch (error) {
    console.error('Error:', error)
  }
}

hashPassword()