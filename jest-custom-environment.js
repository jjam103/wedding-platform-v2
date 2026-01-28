const JSDOMEnvironment = require('jest-environment-jsdom').default;
const { loadEnvConfig } = require('@next/env');

class CustomEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    // Load environment variables before initializing
    loadEnvConfig(process.cwd(), true);
    
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
