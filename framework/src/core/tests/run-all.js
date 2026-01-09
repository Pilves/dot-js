#!/usr/bin/env node
/**
 * Main test runner - runs all test files
 * Usage: node src/core/tests/run-all.js
 */

import { spawn } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const testFiles = [
  'signal.test.js',
  'template.test.js',
  'router.test.js',
  'list.test.js'
]

console.log('\n' + '='.repeat(50))
console.log('  dot-js Framework Test Suite')
console.log('='.repeat(50))

let allPassed = true
let totalTests = 0
let failedTests = 0

async function runTest(file) {
  return new Promise((resolve) => {
    const testPath = join(__dirname, file)

    console.log(`\n Running ${file}...`)
    console.log('-'.repeat(50))

    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        allPassed = false
        failedTests++
      }
      totalTests++
      resolve(code)
    })

    child.on('error', (err) => {
      console.error(`Failed to run ${file}:`, err.message)
      allPassed = false
      failedTests++
      totalTests++
      resolve(1)
    })
  })
}

// Run tests sequentially
for (const file of testFiles) {
  await runTest(file)
}

// Final summary
console.log('\n' + '='.repeat(50))
console.log('  Final Summary')
console.log('='.repeat(50))

if (allPassed) {
  console.log(`\n\x1b[32m All ${totalTests} test file(s) passed!\x1b[0m\n`)
  process.exit(0)
} else {
  console.log(`\n\x1b[31m ${failedTests} of ${totalTests} test file(s) failed!\x1b[0m\n`)
  process.exit(1)
}
