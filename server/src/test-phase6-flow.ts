import process from 'node:process';

const API_BASE = 'http://localhost:5000/api';

interface TestUser {
  token: string;
  email: string;
  id: string;
}

let userA: TestUser;
let userB: TestUser;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runPhase6Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 6: ANALYTICS, HISTORY & ACHIEVEMENTS');
  console.log('======================================================\n');

  const timestamp = Date.now();

  // 1. Setup Test Users
  const resRegA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `analytics_user_a_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Analytics Hero A',
    }),
  });
  assert(resRegA.status === 201, 'User A registered successfully');
  userA = {
    token: resRegA.data.data.token,
    email: resRegA.data.data.user.email,
    id: resRegA.data.data.user.id,
  };

  const resRegB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `analytics_user_b_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Analytics Hero B',
    }),
  });
  assert(resRegB.status === 201, 'User B registered successfully');
  userB = {
    token: resRegB.data.data.token,
    email: resRegB.data.data.user.email,
    id: resRegB.data.data.user.id,
  };

  // ==========================================================
  // Test 1: New user with no activity returns clean empty stats
  // ==========================================================
  console.log('\n--- Test 1: New user with no activity ---');
  const resEmptyOverview = await request('/analytics/overview?range=30d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resEmptyOverview.status === 200, 'Overview endpoint returns 200 OK');
  const emptyData = resEmptyOverview.data.data;
  assert(emptyData.tasks.total === 0, 'New user has 0 total tasks');
  assert(emptyData.tasks.completed === 0, 'New user has 0 completed tasks');
  assert(emptyData.tasks.completionRate === 0, 'New user completion rate is 0%');
  assert(emptyData.xp.totalEarnedInRange === 0, 'New user has 0 XP earned');
  assert(emptyData.streak.current === 0, 'New user has 0 current streak');

  // ==========================================================
  // Test 2 & 3: User with completed and pending tasks
  // ==========================================================
  console.log('\n--- Test 2 & 3: User with completed and pending tasks ---');
  const today = new Date().toISOString().split('T')[0];

  // Create Goal
  const resGoal = await request('/goals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Full-Stack Mastery',
      category: 'Learning',
      priority: 'HIGH',
      startDate: today,
    }),
  });
  assert(resGoal.status === 201, 'Goal created successfully');
  const goalId = resGoal.data.data.goal.id;

  // Create 3 tasks
  const resTask1 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Task 1: Study TypeScript',
      category: 'Learning',
      priority: 'HIGH',
      goalId,
      taskDate: today,
      isRecurring: false,
    }),
  });
  assert(resTask1.status === 201, 'Task 1 created');
  const instance1Id = resTask1.data.data.initialInstance?.id || resTask1.data.data.instance?.id;

  const resTask2 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Task 2: Build Express API',
      category: 'Learning',
      priority: 'MEDIUM',
      goalId,
      taskDate: today,
      isRecurring: false,
    }),
  });
  assert(resTask2.status === 201, 'Task 2 created');
  const instance2Id = resTask2.data.data.initialInstance?.id || resTask2.data.data.instance?.id;

  const resTask3 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Task 3: Read Prisma Docs',
      category: 'Learning',
      priority: 'LOW',
      goalId,
      taskDate: today,
      isRecurring: false,
    }),
  });
  assert(resTask3.status === 201, 'Task 3 created');

  // Complete Task 1
  const resComplete1 = await request(`/tasks/instances/${instance1Id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resComplete1.status === 200, 'Task 1 toggled to completed');

  // Check Overview analytics
  const resOverviewAfter = await request('/analytics/overview?range=30d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const overviewAfter = resOverviewAfter.data.data;
  assert(overviewAfter.tasks.total === 3, 'Total tasks count is 3');
  assert(overviewAfter.tasks.completed === 1, 'Completed tasks count is 1');
  assert(overviewAfter.tasks.pending === 2, 'Pending tasks count is 2');
  assert(overviewAfter.tasks.completionRate === 33, 'Completion rate is 33% (1/3)');
  assert(overviewAfter.xp.totalEarnedInRange > 0, 'XP earned in range is positive');

  // ==========================================================
  // Test 4, 5, 6, 7: Time range filters (7d, 30d, 90d, all)
  // ==========================================================
  console.log('\n--- Test 4, 5, 6, 7: Time range filtering ---');
  const res7d = await request('/analytics/overview?range=7d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(res7d.status === 200 && res7d.data.data.range === '7d', '7-day range processed');

  const res30d = await request('/analytics/overview?range=30d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(res30d.status === 200 && res30d.data.data.range === '30d', '30-day range processed');

  const res90d = await request('/analytics/overview?range=90d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(res90d.status === 200 && res90d.data.data.range === '90d', '90-day range processed');

  const resAll = await request('/analytics/overview?range=all', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resAll.status === 200 && resAll.data.data.range === 'all', 'All-time range processed');

  // ==========================================================
  // Test 8: Timezone handling
  // ==========================================================
  console.log('\n--- Test 8: Timezone boundary resolution ---');
  const resTzTokyo = await request('/analytics/overview?range=7d&timezone=Asia/Tokyo', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resTzTokyo.status === 200, 'Timezone parameter accepted');
  assert(resTzTokyo.data.data.timezone === 'Asia/Tokyo', 'Timezone accurately reflected in response');

  // ==========================================================
  // Test 9: Goal Analytics
  // ==========================================================
  console.log('\n--- Test 9: Goal progress and task distribution ---');
  const resGoals = await request('/analytics/goals', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resGoals.status === 200, 'Goal analytics endpoint returned 200 OK');
  const goalsList = resGoals.data.data;
  assert(Array.isArray(goalsList) && goalsList.length >= 1, 'Contains user goals');
  const targetGoal = goalsList.find((g: any) => g.id === goalId);
  assert(!!targetGoal, 'Target goal found in analytics');
  assert(targetGoal.metrics.completedTaskInstances === 1, 'Goal metrics report 1 completed instance');
  assert(targetGoal.metrics.pendingTaskInstances === 2, 'Goal metrics report 2 pending instances');

  // ==========================================================
  // Test 10: XP Trends & History
  // ==========================================================
  console.log('\n--- Test 10: XP history and daily breakdown ---');
  const resXp = await request('/analytics/xp?range=30d', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resXp.status === 200, 'XP trends endpoint returned 200 OK');
  assert(Array.isArray(resXp.data.data.dailyXp), 'Daily XP breakdown array returned');
  assert(Array.isArray(resXp.data.data.recentHistory) && resXp.data.data.recentHistory.length > 0, 'Recent XP history returned');

  // ==========================================================
  // Test 11: Streak values from Character
  // ==========================================================
  console.log('\n--- Test 11: Streak values match Character source of truth ---');
  assert(overviewAfter.streak.current >= 1, 'Current streak is active');
  assert(overviewAfter.streak.longest >= 1, 'Longest streak is recorded');

  // ==========================================================
  // Test 12: Activity Heatmap
  // ==========================================================
  console.log('\n--- Test 12: Activity Heatmap levels ---');
  const resHeatmap = await request('/analytics/heatmap?year=2026', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resHeatmap.status === 200, 'Heatmap endpoint returned 200 OK');
  const heatmapData = resHeatmap.data.data;
  assert(heatmapData.totalCompletedDays >= 1, 'Heatmap recorded active completion days');
  const todayEntry = heatmapData.days.find((d: any) => d.date === today);
  assert(!!todayEntry && todayEntry.count >= 1 && todayEntry.level >= 1, 'Today has activity level >= 1');

  // ==========================================================
  // Test 13, 14, 15, 16: Task History and Filtering
  // ==========================================================
  console.log('\n--- Test 13, 14, 15, 16: Task history and filters ---');
  const resHistAll = await request('/analytics/history', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resHistAll.status === 200, 'Task history endpoint returned 200 OK');
  assert(resHistAll.data.data.length === 3, 'Returns all 3 task instances');

  // Filter completed only
  const resHistCompleted = await request('/analytics/history?status=COMPLETED', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resHistCompleted.data.data.length === 1, 'Filtered completed instances returns 1');

  // Filter pending only
  const resHistPending = await request('/analytics/history?status=PENDING', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resHistPending.data.data.length === 2, 'Filtered pending instances returns 2');

  // Filter by goalId
  const resHistGoal = await request(`/analytics/history?goalId=${goalId}`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resHistGoal.data.data.length === 3, 'Filtered by goalId returns 3');

  // ==========================================================
  // Test 17: Achievement Unlocking - First Step
  // ==========================================================
  console.log('\n--- Test 17: First Step Achievement Unlocked on Task Completion ---');
  // Trigger evaluation
  const resEval1 = await request('/achievements/evaluate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resEval1.status === 200, 'Achievement evaluation endpoint responded 200 OK');

  const resAchAll = await request('/achievements', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resAchAll.status === 200, 'Achievements list endpoint returned 200 OK');
  const achList = resAchAll.data.data.achievements;
  const firstStep = achList.find((a: any) => a.key === 'FIRST_STEP');
  assert(!!firstStep, 'FIRST_STEP achievement exists');
  assert(firstStep.isUnlocked === true, 'FIRST_STEP is unlocked');
  assert(firstStep.progress.percentage === 100, 'FIRST_STEP progress is 100%');

  // ==========================================================
  // Test 18: 5-task achievement progress tracking
  // ==========================================================
  console.log('\n--- Test 18: Getting Started (5 tasks) progress tracking ---');
  const gettingStarted = achList.find((a: any) => a.key === 'GETTING_STARTED');
  assert(!!gettingStarted, 'GETTING_STARTED achievement exists');
  assert(gettingStarted.isUnlocked === false, 'GETTING_STARTED is still locked (only 1 task completed)');
  assert(gettingStarted.progress.current === 1, 'Current progress is 1 task');
  assert(gettingStarted.progress.target === 5, 'Target is 5 tasks');

  // ==========================================================
  // Test 21 & 24: Goal Completion Achievement & Notification
  // ==========================================================
  console.log('\n--- Test 21 & 24: Goal completion achievement & notification ---');
  // Mark goal as COMPLETED
  const resCompleteGoal = await request(`/goals/${goalId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  assert(resCompleteGoal.status === 200, 'Goal marked as COMPLETED');

  // Evaluate achievements
  await request('/achievements/evaluate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  const resAchAfterGoal = await request('/achievements', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const goalCrusher = resAchAfterGoal.data.data.achievements.find((a: any) => a.key === 'GOAL_CRUSHER');
  assert(goalCrusher.isUnlocked === true, 'GOAL_CRUSHER unlocked after goal completion');

  // Verify in-app achievement notification was created
  const resNotifs = await request('/notifications', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resNotifs.status === 200, 'Notifications fetched');
  const achNotif = resNotifs.data.data.notifications.find((n: any) => n.type === 'ACHIEVEMENT');
  assert(!!achNotif, 'In-app notification created for achievement unlock');
  assert(achNotif.title.includes('Achievement Unlocked'), 'Notification title announces unlock');

  // ==========================================================
  // Test 22 & 23: Duplicate event processing & prevention
  // ==========================================================
  console.log('\n--- Test 22 & 23: Idempotent evaluation and duplicate unlock prevention ---');
  const resEvalDup = await request('/achievements/evaluate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resEvalDup.status === 200, 'Second evaluation request succeeded');
  assert(resEvalDup.data.newlyUnlockedCount === 0, 'Zero duplicate achievements unlocked on repeat evaluation');

  // ==========================================================
  // Test 25 & 26: Security & Cross-User Isolation
  // ==========================================================
  console.log('\n--- Test 25 & 26: Security & Data Isolation ---');
  const resUserBOverview = await request('/analytics/overview', {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(resUserBOverview.data.data.tasks.total === 0, 'User B analytics isolated: reports 0 tasks');
  assert(resUserBOverview.data.data.xp.lifetimeTotalXP === 0, 'User B reports 0 XP');

  const resUserBAch = await request('/achievements', {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(resUserBAch.data.data.stats.unlocked === 0, 'User B has 0 unlocked achievements');

  // ==========================================================
  // Test 27: Unauthenticated access rejected
  // ==========================================================
  console.log('\n--- Test 27: Unauthenticated request rejected ---');
  const resUnauth = await request('/analytics/overview');
  assert(resUnauth.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 6 TEST SCENARIOS PASSED WITH ZERO ERRORS');
  console.log('======================================================\n');
}

runPhase6Tests().catch((err) => {
  console.error('Fatal error during Phase 6 tests:', err);
  process.exit(1);
});

export {};
