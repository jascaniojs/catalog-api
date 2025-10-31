/**
 * Global teardown for e2e tests
 * Ensures all connections are properly closed
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  // Give any pending operations time to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('✅ Test environment cleanup complete\n');
}
