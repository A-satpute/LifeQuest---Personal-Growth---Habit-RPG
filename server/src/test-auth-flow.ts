import http from 'http';
import app from './app';
import { env } from './config/env';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function request(
  serverPort: number,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const jsonBody = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: 'localhost',
        port: serverPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody) } : {}),
          ...headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const data = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode || 500, data });
          } catch {
            resolve({ status: res.statusCode || 500, data: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (jsonBody) req.write(jsonBody);
    req.end();
  });
}

async function runTests() {
  const TEST_PORT = 5055;
  const server = app.listen(TEST_PORT);

  console.log(`\n======================================================`);
  console.log(`🧪 RUNNING AUTOMATED AUTHENTICATION & SECURITY TESTS`);
  console.log(`======================================================\n`);

  try {
    // 1. Health check
    const health = await request(TEST_PORT, 'GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check responds with healthy status');

    // 2. Register valid user
    const testEmail = `hero_${Date.now()}@quest.com`;
    const regRes = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Ranger Arthur',
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(regRes.status === 201 && regRes.data.data.token, 'Register valid user returns 201 and JWT token');
    const token1 = regRes.data.data.token;
    const user1Id = regRes.data.data.user.id;

    // 3. Register duplicate email -> expect 409
    const dupRes = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Imposter Arthur',
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(dupRes.status === 409, 'Duplicate registration rejected with 409 Conflict');

    // 4. Register with invalid password -> expect 400
    const weakRes = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Weak Pass',
      email: `weak_${Date.now()}@quest.com`,
      password: '123',
    });
    assert(weakRes.status === 400 && weakRes.data.message === 'Validation failed', 'Weak password rejected with 400 Validation Error');

    // 5. Login with invalid password -> expect 401
    const badLogin = await request(TEST_PORT, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401, 'Invalid credentials rejected with 401 Unauthorized');

    // 6. Login with correct credentials -> expect 200 & JWT
    const goodLogin = await request(TEST_PORT, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(goodLogin.status === 200 && goodLogin.data.data.token, 'Valid login returns 200 OK and fresh JWT token');

    // 7. Protected route /api/auth/me without token -> expect 401
    const noToken = await request(TEST_PORT, 'GET', '/api/auth/me');
    assert(noToken.status === 401, 'Protected route rejects unauthenticated request with 401');

    // 8. Protected route /api/auth/me with valid token -> expect 200
    const meRes = await request(TEST_PORT, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${token1}`,
    });
    assert(meRes.status === 200 && meRes.data.data.user.id === user1Id, 'Protected route returns authorized user profile');

    // 9. Update profile via PUT /api/users/profile
    const updateRes = await request(
      TEST_PORT,
      'PUT',
      '/api/users/profile',
      { Authorization: `Bearer ${token1}` },
      { name: 'Arthur Pendragon', bio: 'Champion of the realm' }
    );
    assert(
      updateRes.status === 200 && updateRes.data.data.user.bio === 'Champion of the realm',
      'Profile updated successfully with authenticated user token'
    );

    // 10. Data isolation check: Register User 2 and verify User 2 cannot see User 1 data
    const user2Email = `mage_${Date.now()}@quest.com`;
    const regUser2 = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Mage Merlin',
      email: user2Email,
      password: 'SecurePassword123!',
    });
    const token2 = regUser2.data.data.token;
    const user2Me = await request(TEST_PORT, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${token2}`,
    });
    assert(
      user2Me.data.data.user.email === user2Email && user2Me.data.data.user.id !== user1Id,
      'Data isolation verified: Authenticated sessions only return caller-scoped user data'
    );
  } catch (err: any) {
    console.error('Test execution failed:', err);
    results.push({ name: 'Execution Error', passed: false, message: err.message });
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log('📊 TEST SUMMARY RESULTS:');
  console.log('======================================================');
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon}: ${r.name}`);
    if (!r.passed) {
      allPassed = false;
      if (r.message) console.log(`   └─ Error: ${r.message}`);
    }
  }
  console.log('======================================================\n');
  process.exit(allPassed ? 0 : 1);
}

function assert(condition: boolean, name: string) {
  if (condition) {
    results.push({ name, passed: true });
  } else {
    results.push({ name, passed: false, message: 'Assertion failed' });
  }
}

runTests();
