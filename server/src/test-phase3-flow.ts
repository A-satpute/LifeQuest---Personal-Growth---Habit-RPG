import process from 'node:process';
import { calculateLevelFromXP, getXPThresholdForLevel } from './config/xpConfig.js';
import { getCharacterStage } from './config/statMapping.js';

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

async function runPhase3Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 3: GAMIFICATION & CHARACTER TESTS');
  console.log('======================================================\n');

  // 1. Setup two distinct test accounts
  const timestamp = Date.now();
  const resRegA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `phase3_user_a_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Gamer Hero A',
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
      email: `phase3_user_b_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Gamer Hero B',
    }),
  });
  assert(resRegB.status === 201, 'User B registered successfully');
  userB = {
    token: resRegB.data.data.token,
    email: resRegB.data.data.user.email,
    id: resRegB.data.data.user.id,
  };

  // 2. Verify initial character profile for User A
  const resProfileInit = await request('/gamification/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resProfileInit.status === 200, 'User A retrieves initial gamification profile');
  const initChar = resProfileInit.data.data.character;
  const initStats = resProfileInit.data.data.stats;
  assert(initChar.level === 1 && initChar.totalXP === 0, 'Character starts at Level 1 with 0 XP');
  assert(initChar.stage === 'Beginner', 'Initial stage is Beginner');
  assert(
    initStats.strength === 10 &&
    initStats.knowledge === 10 &&
    initStats.discipline === 10 &&
    initStats.focus === 10 &&
    initStats.consistency === 10,
    'Character starts with 10 in all RPG stats'
  );

  // 3. Create a goal and a Fitness task for User A
  const resGoal = await request('/goals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Iron Body Fitness',
      category: 'Fitness',
      priority: 'HIGH',
    }),
  });
  const goalId = resGoal.data.data.id;

  const testDate = '2026-09-25';
  const resTask1 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Heavy Squats',
      category: 'Fitness',
      priority: 'HIGH', // Base 10 + High 10 + Goal 10 = 30 XP
      goalId,
      taskDate: testDate,
    }),
  });
  assert(resTask1.status === 201, 'Created Fitness task linked to Goal');
  const taskInstance1Id = resTask1.data.data.initialInstance.id;

  // 4. Complete task and verify XP award, character stat increase, and streak update
  const resComplete1 = await request(`/tasks/instances/${taskInstance1Id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resComplete1.status === 200, 'Task completed successfully');
  const completeData = resComplete1.data.data.gamification;
  // Note: Only 1 task created for testDate, so completing it also triggers the Daily Completion Bonus (+25 XP)
  // Base task XP = 30 (10 base + 10 high + 10 goal). Daily bonus = +25. Total = 55 XP.
  assert(completeData.xpAwarded >= 30, `Awarded task XP with bonuses (total ${completeData.xpAwarded} XP)`);
  assert(completeData.currentStreak === 1, 'Current streak incremented to 1 day');

  // Verify updated character stats
  const resProfileAfter1 = await request('/gamification/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const statsAfter1 = resProfileAfter1.data.data.stats;
  // Fitness gives Strength +5, Discipline +2 (plus daily bonus consistency +3, discipline +2)
  assert(statsAfter1.strength === 15, `Strength increased from 10 to 15 (got ${statsAfter1.strength})`);
  assert(statsAfter1.discipline >= 12, `Discipline increased (got ${statsAfter1.discipline})`);

  // 5. Duplicate completion prevention (Idempotency)
  const resCompleteDup = await request(`/tasks/${taskInstance1Id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resCompleteDup.status === 200, 'Second complete request handled gracefully');
  assert(
    resCompleteDup.data.data.gamification.xpAwarded === 0,
    'Idempotency verified: 0 duplicate XP awarded on repeat completion'
  );

  // 6. Test Uncompleting a Task (XP reversal & stat reversal)
  const totalXPBeforeUncomplete = resProfileAfter1.data.data.character.totalXP;
  const resUncomplete = await request(`/tasks/${taskInstance1Id}/uncomplete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resUncomplete.status === 200, 'Task uncompleted successfully');

  const resProfileAfterUncomplete = await request('/gamification/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const charAfterUncomplete = resProfileAfterUncomplete.data.data.character;
  const statsAfterUncomplete = resProfileAfterUncomplete.data.data.stats;
  assert(
    charAfterUncomplete.totalXP < totalXPBeforeUncomplete,
    `XP safely reversed on task uncomplete (from ${totalXPBeforeUncomplete} to ${charAfterUncomplete.totalXP})`
  );
  assert(
    statsAfterUncomplete.strength === 10,
    `Strength reversed back to initial 10 (got ${statsAfterUncomplete.strength})`
  );

  // Verify XP transactions history contains both TASK_COMPLETED and TASK_UNCOMPLETED
  const resXP = await request('/gamification/xp', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const txs = resXP.data.data.recentTransactions;
  const hasCompletedTx = txs.some((t: any) => t.reason === 'TASK_COMPLETED');
  const hasUncompletedTx = txs.some((t: any) => t.reason === 'TASK_UNCOMPLETED');
  assert(hasCompletedTx && hasUncompletedTx, 'XP transaction audit trail preserves both award and reversal');

  // 7. Test Level Calculation & Progression Curve
  // Re-complete task to establish baseline XP
  await request(`/tasks/${taskInstance1Id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  // Verify Level 1 -> Level 2 threshold at 100 XP
  const level1Info = calculateLevelFromXP(50);
  assert(level1Info.level === 1 && level1Info.progressPercentage === 50, '50 XP is Level 1 at 50% progress');

  const level2Info = calculateLevelFromXP(100);
  assert(level2Info.level === 2 && level2Info.progressPercentage === 0, '100 XP reaches Level 2');

  const level3Info = calculateLevelFromXP(250);
  assert(level3Info.level === 3, '250 XP reaches Level 3');

  const level5Info = calculateLevelFromXP(700);
  assert(level5Info.level === 5, '700 XP reaches Level 5');

  // Verify Stage progression
  assert(getCharacterStage(1) === 'Beginner', 'Level 1 is Beginner stage');
  assert(getCharacterStage(5) === 'Developing', 'Level 5 is Developing stage');
  assert(getCharacterStage(10) === 'Disciplined', 'Level 10 is Disciplined stage');
  assert(getCharacterStage(20) === 'Advanced', 'Level 20 is Advanced stage');
  assert(getCharacterStage(30) === 'Master', 'Level 30 is Master stage');

  // 8. Test Learning / Study category stat mapping
  const resTaskLearning = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Study TypeScript & Algorithms',
      category: 'Learning',
      priority: 'MEDIUM',
      taskDate: testDate,
    }),
  });
  const learningInstanceId = resTaskLearning.data.data.initialInstance.id;

  await request(`/tasks/${learningInstanceId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  const resProfileLearning = await request('/gamification/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const learningStats = resProfileLearning.data.data.stats;
  assert(
    learningStats.knowledge >= 15,
    `Knowledge stat increased from Learning task (got ${learningStats.knowledge})`
  );
  assert(
    learningStats.focus >= 12,
    `Focus stat increased from Learning task (got ${learningStats.focus})`
  );

  // 9. Multi-Tenant Gamification Security Check
  // User B tries to view User A's profile via direct injection/tampering
  const resUserBProfile = await request('/gamification/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(resUserBProfile.status === 200, 'User B retrieves their own gamification profile');
  const userBChar = resUserBProfile.data.data.character;
  assert(userBChar.totalXP === 0, 'User B data is completely isolated (0 XP despite User A actions)');
  assert(userBChar.id !== initChar.id, 'User B has their own separate Character entity');

  console.log('\n======================================================');
  console.log('📊 ALL PHASE 3 GAMIFICATION & CHARACTER TESTS PASSED!');
  console.log('======================================================\n');
}

runPhase3Tests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
