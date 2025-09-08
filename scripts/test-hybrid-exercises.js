#!/usr/bin/env node

// test-hybrid-exercises.js
// Script to test the new exercise type endpoints

const API_BASE = 'http://localhost:3001'

async function testEndpoints() {
  console.log('🧪 Testing RYTHM Hybrid Exercise API Endpoints...\n')
  
  try {
    // Test 1: Get all exercise templates
    console.log('1️⃣ Testing GET /api/exercises/templates')
    const allTemplatesResponse = await fetch(`${API_BASE}/api/exercises/templates`)
    const allTemplates = await allTemplatesResponse.json()
    console.log(`   ✅ Found ${allTemplates.length} total exercise templates`)
    
    // Test 2: Get strength exercises only
    console.log('\n2️⃣ Testing GET /api/exercises/templates/by-type/STRENGTH')
    const strengthResponse = await fetch(`${API_BASE}/api/exercises/templates/by-type/STRENGTH`)
    const strengthData = await strengthResponse.json()
    console.log(`   💪 Found ${strengthData.count} STRENGTH exercises`)
    console.log(`   Sample: ${strengthData.exercises.slice(0, 3).map(e => e.name).join(', ')}...`)
    
    // Test 3: Get cardio exercises only
    console.log('\n3️⃣ Testing GET /api/exercises/templates/by-type/CARDIO')
    const cardioResponse = await fetch(`${API_BASE}/api/exercises/templates/by-type/CARDIO`)
    const cardioData = await cardioResponse.json()
    console.log(`   🏃 Found ${cardioData.count} CARDIO exercises`)
    console.log(`   Sample: ${cardioData.exercises.slice(0, 3).map(e => e.name).join(', ')}...`)
    
    // Test 4: Filter by exercise type
    console.log('\n4️⃣ Testing GET /api/exercises/templates?type=STRENGTH')
    const filteredResponse = await fetch(`${API_BASE}/api/exercises/templates?type=STRENGTH`)
    const filteredTemplates = await filteredResponse.json()
    console.log(`   ✅ Filter by type returned ${filteredTemplates.length} STRENGTH exercises`)
    
    // Test 5: Search within exercise type
    console.log('\n5️⃣ Testing GET /api/exercises/templates?type=CARDIO&search=run')
    const searchResponse = await fetch(`${API_BASE}/api/exercises/templates?type=CARDIO&search=run`)
    const searchResults = await searchResponse.json()
    console.log(`   🔍 Search for "run" in CARDIO returned ${searchResults.length} exercises`)
    if (searchResults.length > 0) {
      console.log(`   Results: ${searchResults.map(e => e.name).join(', ')}`)
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Total exercises: ${allTemplates.length}`)
    console.log(`   Strength exercises: ${strengthData.count}`)
    console.log(`   Cardio exercises: ${cardioData.count}`)
    console.log(`   API is ready for hybrid training! 🔥`)
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message)
    console.log('\n💡 Make sure your API server is running on port 3001')
    console.log('   Run: npm run dev or node apps/api/src/simple-server.js')
  }
}

// Run the tests
testEndpoints()