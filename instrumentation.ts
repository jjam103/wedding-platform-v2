/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js on server startup.
 * Use it to initialize services that need to be ready before handling requests.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { initializeB2Client, validateB2Config } from './services/b2Service';

/**
 * Called once when the server starts (both dev and production).
 * Initializes B2 storage client with environment variables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing application services...');

    // Initialize B2 Storage
    const configResult = validateB2Config();
    if (!configResult.success) {
      console.error('❌ B2 Configuration Error:', configResult.error.message);
      console.error('   Details:', configResult.error.details);
      console.error('   Photo uploads will not work until configuration is fixed.');
      return;
    }

    const initResult = initializeB2Client(configResult.data);
    if (!initResult.success) {
      console.error('❌ B2 Initialization Error:', initResult.error.message);
      console.error('   Photo uploads will not work until this is resolved.');
      return;
    }

    console.log('✅ Application services initialized successfully');
  }
}
