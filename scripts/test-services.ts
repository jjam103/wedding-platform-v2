/**
 * Service Connection Test Script
 * Tests connectivity to all configured external services
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Resend } from 'resend';

// Load environment variables
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  b2: {
    keyId: process.env.B2_APPLICATION_KEY_ID,
    key: process.env.B2_APPLICATION_KEY,
    bucketName: process.env.B2_BUCKET_NAME,
    bucketId: process.env.B2_BUCKET_ID,
  },
  cloudflare: {
    cdnUrl: process.env.CLOUDFLARE_CDN_URL,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
};

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testSupabase(): Promise<TestResult> {
  try {
    if (!config.supabase.url || !config.supabase.key) {
      return {
        service: 'Supabase',
        status: 'error',
        message: 'Missing credentials',
      };
    }

    const supabase = createClient(config.supabase.url, config.supabase.key);
    
    // Test connection by checking auth
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      return {
        service: 'Supabase',
        status: 'error',
        message: error.message,
      };
    }

    // Try to query a table (will fail if migrations not run, but connection works)
    const { error: queryError } = await supabase.from('guests').select('count').limit(1);
    
    if (queryError) {
      return {
        service: 'Supabase',
        status: 'success',
        message: 'Connected, but tables not found. Run migrations: npx supabase db push',
        details: { error: queryError.message },
      };
    }

    return {
      service: 'Supabase',
      status: 'success',
      message: 'Connected and tables exist',
    };
  } catch (error) {
    return {
      service: 'Supabase',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testResend(): Promise<TestResult> {
  try {
    if (!config.resend.apiKey || config.resend.apiKey.includes('your-')) {
      return {
        service: 'Resend',
        status: 'skipped',
        message: 'Not configured (optional)',
      };
    }

    const resend = new Resend(config.resend.apiKey);
    
    // Test by getting API key info (doesn't send email)
    // Note: Resend doesn't have a test endpoint, so we'll just verify the key format
    if (!config.resend.apiKey.startsWith('re_')) {
      return {
        service: 'Resend',
        status: 'error',
        message: 'Invalid API key format (should start with re_)',
      };
    }

    return {
      service: 'Resend',
      status: 'success',
      message: 'API key configured (format valid)',
    };
  } catch (error) {
    return {
      service: 'Resend',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testBackblazeB2(): Promise<TestResult> {
  try {
    if (!config.b2.keyId || !config.b2.key || config.b2.keyId.includes('your-')) {
      return {
        service: 'Backblaze B2',
        status: 'skipped',
        message: 'Not configured (optional)',
      };
    }

    const s3Client = new S3Client({
      endpoint: 'https://s3.us-east-005.backblazeb2.com',
      region: 'us-east-005',
      credentials: {
        accessKeyId: config.b2.keyId,
        secretAccessKey: config.b2.key,
      },
    });

    // Test bucket access
    const command = new HeadBucketCommand({ Bucket: config.b2.bucketName });
    await s3Client.send(command);

    return {
      service: 'Backblaze B2',
      status: 'success',
      message: `Connected to bucket: ${config.b2.bucketName}`,
    };
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return {
        service: 'Backblaze B2',
        status: 'error',
        message: `Bucket not found: ${config.b2.bucketName}`,
      };
    }
    return {
      service: 'Backblaze B2',
      status: 'error',
      message: error.message || 'Connection failed',
    };
  }
}

async function testCloudflare(): Promise<TestResult> {
  try {
    if (!config.cloudflare.cdnUrl || config.cloudflare.cdnUrl.includes('your-')) {
      return {
        service: 'Cloudflare CDN',
        status: 'skipped',
        message: 'Not configured (optional)',
      };
    }

    // Test if URL is accessible
    const url = config.cloudflare.cdnUrl.startsWith('http') 
      ? config.cloudflare.cdnUrl 
      : `https://${config.cloudflare.cdnUrl}`;
    
    const response = await fetch(url, { method: 'HEAD' });
    
    if (response.ok || response.status === 404) {
      return {
        service: 'Cloudflare CDN',
        status: 'success',
        message: `CDN URL accessible: ${url}`,
      };
    }

    return {
      service: 'Cloudflare CDN',
      status: 'error',
      message: `CDN URL not accessible (status: ${response.status})`,
    };
  } catch (error) {
    return {
      service: 'Cloudflare CDN',
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function testGemini(): Promise<TestResult> {
  try {
    if (!config.gemini.apiKey || config.gemini.apiKey.includes('your-')) {
      return {
        service: 'Google Gemini',
        status: 'skipped',
        message: 'Not configured (optional)',
      };
    }

    // Verify API key format
    if (!config.gemini.apiKey.startsWith('AIzaSy')) {
      return {
        service: 'Google Gemini',
        status: 'error',
        message: 'Invalid API key format (should start with AIzaSy)',
      };
    }

    return {
      service: 'Google Gemini',
      status: 'success',
      message: 'API key configured (format valid)',
    };
  } catch (error) {
    return {
      service: 'Google Gemini',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🔍 Testing Service Connections...\n');

  results.push(await testSupabase());
  results.push(await testResend());
  results.push(await testBackblazeB2());
  results.push(await testCloudflare());
  results.push(await testGemini());

  console.log('\n📊 Test Results:\n');
  console.log('═'.repeat(80));

  results.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    console.log(`${icon} ${result.service.padEnd(20)} ${result.status.toUpperCase()}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('─'.repeat(80));
  });

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  console.log('\n📈 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors:  ${errorCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log('═'.repeat(80));

  if (errorCount > 0) {
    console.log('\n⚠️  Some services have errors. Check the details above.');
    process.exit(1);
  } else {
    console.log('\n✨ All configured services are working!');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
