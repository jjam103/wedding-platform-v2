const JSDOMEnvironment = require('jest-environment-jsdom').default;
const { loadEnvConfig } = require('@next/env');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

class CustomEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    // First load Next.js environment variables (will use .env.local as fallback)
    loadEnvConfig(process.cwd(), true);
    
    // Then override with .env.test if it exists (for integration tests with real database)
    // This ensures test database credentials take precedence over local development credentials
    const envTestPath = path.resolve(process.cwd(), '.env.test');
    if (fs.existsSync(envTestPath)) {
      const result = dotenv.config({ path: envTestPath, override: true });
      if (result.parsed) {
        // Override process.env with .env.test values
        Object.assign(process.env, result.parsed);
      }
    }
    
    super(config, context);
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
