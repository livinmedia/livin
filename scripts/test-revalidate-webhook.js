// ============================================================
// LIVIN Platform — Revalidation Webhook Test Script
// P0-028
// ============================================================
// Run with: node scripts/test-revalidate-webhook.js
// Requires dev server running on localhost:3000
// Requires REVALIDATE_SECRET set in .env.local
// ============================================================

require('dotenv').config({ path: '.env.local' })
const SECRET = process.env.REVALIDATE_SECRET || 'test-secret-change-me'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testWebhook(label, payload) {
  console.log(`\nTest: ${label}`)
  console.log(`Payload: ${JSON.stringify(payload)}`)

  try {
    const res = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': SECRET,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    const passed = res.status === 200 || res.status === 207

    console.log(`Status: ${res.status} ${passed ? '✅' : '❌'}`)
    console.log(`Response: ${JSON.stringify(data, null, 2)}`)
    return passed
  } catch (err) {
    console.log(`❌ Request failed: ${err.message}`)
    return false
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════')
  console.log('  P0-028 — Revalidation Webhook Tests')
  console.log(`  Server: ${BASE_URL}`)
  console.log('═══════════════════════════════════════════')

  const results = []

  // Test 1: Health check (GET)
  console.log('\nTest: Health check (GET /api/revalidate)')
  try {
    const res = await fetch(`${BASE_URL}/api/revalidate`)
    const data = await res.json()
    const passed = res.status === 200 && data.status === 'ok'
    console.log(`Status: ${res.status} ${passed ? '✅' : '❌'}`)
    results.push(passed)
  } catch (err) {
    console.log(`❌ ${err.message}`)
    results.push(false)
  }

  // Test 2: Missing secret → 401
  console.log('\nTest: Missing secret → expect 401')
  try {
    const res = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'city', citySlug: 'houston-texas' }),
    })
    const passed = res.status === 401
    console.log(`Status: ${res.status} ${passed ? '✅' : '❌'}`)
    results.push(passed)
  } catch (err) {
    console.log(`❌ ${err.message}`)
    results.push(false)
  }

  // Test 3: Revalidate city page
  results.push(await testWebhook('Revalidate city page', {
    type: 'city',
    citySlug: 'houston-texas',
    triggeredBy: 'test-script',
  }))

  // Test 4: Revalidate content page
  results.push(await testWebhook('Revalidate content page', {
    type: 'content',
    citySlug: 'houston-texas',
    contentSlug: 'best-restaurants-2026',
    brand: 'livin',
    triggeredBy: 'test-script',
  }))

  // Test 5: Missing citySlug → 400
  console.log('\nTest: Missing citySlug → expect 400')
  try {
    const res = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': SECRET,
      },
      body: JSON.stringify({ type: 'city' }),
    })
    const passed = res.status === 400
    console.log(`Status: ${res.status} ${passed ? '✅' : '❌'}`)
    results.push(passed)
  } catch (err) {
    console.log(`❌ ${err.message}`)
    results.push(false)
  }

  // Summary
  const passed = results.filter(Boolean).length
  const total  = results.length
  console.log('\n═══════════════════════════════════════════')
  console.log(`  Results: ${passed}/${total} passed ${passed === total ? '✅' : '❌'}`)
  console.log('═══════════════════════════════════════════\n')

  process.exit(passed === total ? 0 : 1)
}

runTests()
