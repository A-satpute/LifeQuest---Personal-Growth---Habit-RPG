import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

async function registerTestUser(emailSuffix: string) {
  const email = `hero_${emailSuffix}_${Date.now()}@lifequest.io`;
  const password = 'Password123!';
  const name = `Hero ${emailSuffix}`;

  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  assert.strictEqual(res.status, 201, `Failed to register user ${email}`);
  return {
    user: res.data.data.user,
    token: res.data.data.token,
    email,
  };
}

async function runMajorUpdateTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MAJOR UPDATE: PROFILE, CALENDAR & CHARACTER TESTS');
  console.log('======================================================\n');

  // Step 1: Register two isolated test users
  const userA = await registerTestUser('Alpha');
  const userB = await registerTestUser('Bravo');
  console.log('✅ PASS: Registered test users Alpha & Bravo for security isolation');

  // ==========================================================
  // 1. HERO PROFILE — PROFILE PICTURE
  // ==========================================================
  console.log('\n--- Test 1: Profile Picture Upload, Persistence & Isolation ---');

  // Valid base64 image data URI
  const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const updateProfileRes = await request('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      avatarUrl: sampleImageBase64,
      bio: 'Ready to level up in life and conquer goals.',
    }),
  });

  assert.strictEqual(updateProfileRes.status, 200, 'Profile update endpoint returned 200');
  assert.strictEqual(updateProfileRes.data.data.user.avatarUrl, sampleImageBase64, 'Avatar URL returned in update response');
  console.log('✅ PASS: Profile picture uploaded successfully via authenticated PATCH');

  // Persistence check on /auth/me
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert.strictEqual(meRes.status, 200, 'GET /auth/me returned 200');
  assert.strictEqual(meRes.data.data.user.avatarUrl, sampleImageBase64, 'Avatar URL persisted in database across requests');
  console.log('✅ PASS: Profile picture persisted across session requests');

  // User isolation check: User B profile must not be modified or affected
  const userBMeRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert.strictEqual(userBMeRes.status, 200);
  assert.strictEqual(userBMeRes.data.data.user.avatarUrl, null, 'User B avatar is null and isolated from User A');
  console.log('✅ PASS: User profile picture data isolation strictly enforced');

  // Sensible rejection check: reject non-image string
  const invalidImageRes = await request('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      avatarUrl: 'ftp://not-an-image.exe',
    }),
  });
  assert.strictEqual(invalidImageRes.status, 400, 'Invalid image format rejected with 400 Bad Request');
  console.log('✅ PASS: Invalid avatarUrl format rejected safely');

  // ==========================================================
  // 2. CHARACTER GENDER & PROGRESSION SYSTEM
  // ==========================================================
  console.log('\n--- Test 2: Character Gender Selection & Stat Preservation ---');

  // Check initial character
  const profileRes = await request('/gamification/profile', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.data.character.gender, 'MALE', 'Default character gender is MALE');
  const initialXP = profileRes.data.data.character.currentXP;
  const initialLevel = profileRes.data.data.character.level;
  const initialStreak = profileRes.data.data.character.currentStreak;
  console.log(`✅ PASS: Initial character gender verified (MALE, Level ${initialLevel}, XP ${initialXP})`);

  // Explicitly update gender to FEMALE
  const updateGenderRes = await request('/gamification/character/gender', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ gender: 'FEMALE' }),
  });
  assert.strictEqual(updateGenderRes.status, 200, 'Update character gender endpoint returned 200');
  assert.strictEqual(updateGenderRes.data.data.character.gender, 'FEMALE', 'Character gender switched to FEMALE');
  assert.strictEqual(updateGenderRes.data.data.character.level, initialLevel, 'Character level preserved');
  assert.strictEqual(updateGenderRes.data.data.character.currentXP, initialXP, 'Character XP preserved');
  assert.strictEqual(updateGenderRes.data.data.character.currentStreak, initialStreak, 'Character streak preserved');
  console.log('✅ PASS: Switched to FEMALE character while preserving level, XP, and streak intact');

  // Cross-user isolation: User B's character must remain MALE
  const userBProfile = await request('/gamification/profile', {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert.strictEqual(userBProfile.data.data.character.gender, 'MALE', 'User B character gender is isolated and unaffected');
  console.log('✅ PASS: Character gender is isolated per user');

  // ==========================================================
  // 3. DASHBOARD CALENDAR COMPLETION BEHAVIOR
  // ==========================================================
  console.log('\n--- Test 3: Dashboard Calendar - Real Data & Strict Checkmark Rules ---');

  const todayStr = new Date().toISOString().split('T')[0];
  const [currentYearStr, currentMonthStr] = todayStr.split('-');
  const year = parseInt(currentYearStr, 10);
  const month = parseInt(currentMonthStr, 10);

  // Initial calendar query
  const calendarRes1 = await request(`/analytics/calendar?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert.strictEqual(calendarRes1.status, 200, 'Month calendar endpoint returned 200');
  assert.strictEqual(calendarRes1.data.data.year, year);
  assert.strictEqual(calendarRes1.data.data.month, month);
  console.log(`✅ PASS: Month calendar retrieved for ${year}-${month}`);

  // Create two tasks for User A for today
  const task1Res = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Morning Pushups & Gym Routine',
      category: 'Fitness',
      priority: 'HIGH',
      isRecurring: false,
      taskDate: todayStr,
    }),
  });
  assert.strictEqual(task1Res.status, 201);
  const task1 = task1Res.data.data.initialInstance || task1Res.data.data.task;

  const task2Res = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Study TypeScript & Systems Architecture',
      category: 'Learning',
      priority: 'MEDIUM',
      isRecurring: false,
      taskDate: todayStr,
    }),
  });
  assert.strictEqual(task2Res.status, 201);
  const task2 = task2Res.data.data.initialInstance || task2Res.data.data.task;

  // Case A: 0 of 2 tasks completed -> isAllCompleted MUST be false
  const calendarRes2 = await request(`/analytics/calendar?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const todayData1 = calendarRes2.data.data.days[todayStr];
  assert(todayData1, 'Today entry exists in calendar days');
  assert.strictEqual(todayData1.total, 2, 'Total tasks for today is 2');
  assert.strictEqual(todayData1.completed, 0, 'Completed tasks for today is 0');
  assert.strictEqual(todayData1.isAllCompleted, false, 'Rule: 0 completed tasks does NOT show tick');
  console.log('✅ PASS: Incomplete tasks (0/2) -> isAllCompleted: false (No checkmark)');

  // Case B: 1 of 2 tasks completed (partial) -> isAllCompleted MUST be false
  await request(`/tasks/instances/${task1.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  const calendarRes3 = await request(`/analytics/calendar?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const todayData2 = calendarRes3.data.data.days[todayStr];
  assert.strictEqual(todayData2.total, 2, 'Total tasks for today is 2');
  assert.strictEqual(todayData2.completed, 1, 'Completed tasks for today is 1');
  assert.strictEqual(todayData2.isAllCompleted, false, 'Rule: Partial completion does NOT show tick');
  console.log('✅ PASS: Partial completion (1/2) -> isAllCompleted: false (No checkmark)');

  // Case C: 2 of 2 tasks completed (ALL) -> isAllCompleted MUST be true
  await request(`/tasks/instances/${task2.id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  const calendarRes4 = await request(`/analytics/calendar?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const todayData3 = calendarRes4.data.data.days[todayStr];
  assert.strictEqual(todayData3.total, 2, 'Total tasks for today is 2');
  assert.strictEqual(todayData3.completed, 2, 'Completed tasks for today is 2');
  assert.strictEqual(todayData3.isAllCompleted, true, 'Rule: ALL tasks completed (2/2) -> shows tick');
  console.log('✅ PASS: All tasks completed (2/2) -> isAllCompleted: true (Clear Checkmark ✓)');

  // ==========================================================
  // 4. DATE-SPECIFIC HISTORY QUERY
  // ==========================================================
  console.log('\n--- Test 4: Calendar Date Selection & Date-Specific History ---');

  const historyTodayRes = await request(`/analytics/history?startDate=${todayStr}&endDate=${todayStr}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert.strictEqual(historyTodayRes.status, 200, 'Date-filtered history endpoint returned 200');
  const todayInstances = Array.isArray(historyTodayRes.data.data) ? historyTodayRes.data.data : historyTodayRes.data.data.instances;
  assert.strictEqual(todayInstances.length, 2, 'Returns exactly 2 instances for today');
  assert(todayInstances.every((t: any) => t.taskDate === todayStr), 'All returned instances match selected date');
  assert(todayInstances.every((t: any) => t.completed === true), 'Instances reflect completed state');
  console.log('✅ PASS: Date-specific history query returned accurate instances for selected date');

  // Query an empty date
  const emptyDate = '2025-01-15';
  const historyEmptyRes = await request(`/analytics/history?startDate=${emptyDate}&endDate=${emptyDate}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert.strictEqual(historyEmptyRes.status, 200);
  const emptyInstances = Array.isArray(historyEmptyRes.data.data) ? historyEmptyRes.data.data : historyEmptyRes.data.data.instances;
  assert.strictEqual(emptyInstances.length, 0, 'Empty date correctly returns 0 instances');
  console.log('✅ PASS: Empty date returns 0 instances without breaking or using today state');

  console.log('\n======================================================');
  console.log('🎉 ALL MAJOR UPDATE AUTOMATED TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runMajorUpdateTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
