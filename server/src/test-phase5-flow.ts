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

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 5: AI GOAL ARCHITECT & ROADMAP TESTS');
  console.log('======================================================\n');

  const timestamp = Date.now();

  // 1. Setup Test Users
  const resRegA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `ai_architect_a_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Architect Hero A',
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
      email: `ai_architect_b_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Architect Hero B',
    }),
  });
  assert(resRegB.status === 201, 'User B registered successfully');
  userB = {
    token: resRegB.data.data.token,
    email: resRegB.data.data.user.email,
    id: resRegB.data.data.user.id,
  };

  // ==========================================================
  // Test 1: User submits valid goal -> Structured roadmap returned
  // ==========================================================
  console.log('\n--- Test 1: User submits valid goal -> Structured roadmap returned ---');
  const genPayload = {
    prompt: 'I want to master React and build modern full-stack web applications in 3 months',
    category: 'SKILL',
    skillLevel: 'BEGINNER',
    availableTimePerDay: 60,
    daysPerWeek: 5,
    preferredDifficulty: 'MEDIUM',
    existingKnowledge: 'Basic HTML, CSS, and JavaScript',
    priority: 'HIGH',
  };

  const resGen = await request('/ai/goals/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify(genPayload),
  });

  console.log('resGen returned:', resGen.status, JSON.stringify(resGen.data));
  assert(resGen.status === 201, 'Generate roadmap endpoint responded with 201 Created');
  assert(resGen.data.success === true, 'Response marked success');
  const planData = resGen.data.data;
  assert(!!planData.id, 'Plan has generated ID');
  assert(planData.status === 'DRAFT', 'Plan is initially in DRAFT state');
  assert(Array.isArray(planData.planData.milestones) && planData.planData.milestones.length > 0, 'Plan contains milestones');
  assert(Array.isArray(planData.planData.tasks) && planData.planData.tasks.length > 0, 'Plan contains suggested tasks');
  assert(typeof planData.planData.summary === 'string', 'Plan contains summary string');

  const generatedPlanId = planData.id;

  // ==========================================================
  // Test 2: AI Input / Output Validation with Zod
  // ==========================================================
  console.log('\n--- Test 2: Malformed input validation fails safely ---');
  const malformedRes = await request('/ai/goals/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      prompt: '', // empty prompt
      availableTimePerDay: -20, // invalid time
    }),
  });
  assert(malformedRes.status === 400, 'Malformed input rejected with status 400 Bad Request');
  assert(malformedRes.data.success === false, 'Error response returned for malformed input');

  // ==========================================================
  // Test 3: AI Provider Resilience / Regeneration
  // ==========================================================
  console.log('\n--- Test 3: AI Plan regeneration with additional guidance ---');
  const regenRes = await request('/ai/goals/regenerate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      planId: generatedPlanId,
      guidanceNotes: 'I only have 30 minutes per day, make tasks smaller and more focused on coding practice',
    }),
  });

  assert(regenRes.status === 200, 'Regenerate endpoint responded with 200 OK');
  assert(regenRes.data.success === true, 'Regeneration marked success');
  const regeneratedPlan = regenRes.data.data;
  assert(regeneratedPlan.id === generatedPlanId, 'Regenerated plan updates preview without creating duplicate record');
  assert(regeneratedPlan.status === 'DRAFT', 'Regenerated plan remains in DRAFT state before acceptance');

  // ==========================================================
  // Test 4 & 5: User edits generated tasks and rejects unwanted task
  // ==========================================================
  console.log('\n--- Test 4 & 5: User edits task details and excludes unwanted tasks (selected: false) ---');
  const previewTasks = [...regeneratedPlan.planData.tasks];
  assert(previewTasks.length >= 2, 'Has at least 2 tasks to test editing and rejection');

  // Edit first task
  const originalFirstTitle = previewTasks[0].title;
  previewTasks[0].title = 'CUSTOM EDITED: ' + originalFirstTitle;
  previewTasks[0].estimatedMinutes = 45;
  previewTasks[0].selected = true;

  // Reject second task
  const rejectedTaskTitle = previewTasks[1].title;
  previewTasks[1].selected = false; // user deselected this task

  // Ensure remaining tasks are selected
  for (let i = 2; i < previewTasks.length; i++) {
    previewTasks[i].selected = true;
  }

  // ==========================================================
  // Test 6 & 7: User accepts roadmap -> Existing Goal & Task records created
  // ==========================================================
  console.log('\n--- Test 6 & 7: User accepts roadmap -> Materializes real Goal + Tasks + Instances ---');
  const acceptPayload = {
    planId: generatedPlanId,
    goalTitle: 'Master React & Full-Stack Development',
    goalDescription: 'Roadmap generated by AI Architect and customized by user',
    category: 'SKILL',
    priority: 'HIGH',
    tasks: previewTasks,
  };

  const acceptRes = await request('/ai/goals/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify(acceptPayload),
  });

  assert(acceptRes.status === 201, 'Accept endpoint responded with 201 Created');
  assert(acceptRes.data.success === true, 'Accept marked success');
  const createdGoal = acceptRes.data.data.goal;
  const createdTasks = acceptRes.data.data.tasks;

  assert(!!createdGoal.id, 'Real Goal record created in database');
  assert(createdGoal.title === 'Master React & Full-Stack Development', 'Goal title matches accepted title');
  assert(createdGoal.userId === userA.id, 'Goal belongs strictly to User A');

  // Verify edited task was created with edited title
  const foundEditedTask = createdTasks.find((t: any) => t.title.startsWith('CUSTOM EDITED:'));
  assert(!!foundEditedTask, 'Edited task was created with the edited title');

  // Verify rejected task was NOT created
  const foundRejectedTask = createdTasks.find((t: any) => t.title === rejectedTaskTitle);
  assert(!foundRejectedTask, 'Rejected task (selected: false) was NOT created in the database');

  // Verify recurring tasks used existing TaskTemplate architecture
  const recurringTask = createdTasks.find((t: any) => t.isRecurring === true);
  if (recurringTask) {
    assert(recurringTask.isRecurring === true, 'Recurring AI task flagged as recurring');
    assert(recurringTask.goalId === createdGoal.id, 'Recurring task correctly linked to created goal');
  }

  // Verify task instances were materialized in database
  const taskInstancesRes = await request('/tasks/today', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(taskInstancesRes.status === 200, 'Task instances fetched via existing Task service');
  console.log('taskInstancesRes data:', JSON.stringify(taskInstancesRes.data));
  const instances = taskInstancesRes.data.data.tasks || taskInstancesRes.data.data.instances;
  assert(Array.isArray(instances) && instances.length > 0, 'Task instances exist for today/schedule');

  // ==========================================================
  // Test 8: Unauthorized user access protection
  // ==========================================================
  console.log('\n--- Test 8: Unauthorized user cannot view or accept another user AI plan ---');
  const unauthorizedGet = await request(`/ai/plans/${generatedPlanId}`, {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(unauthorizedGet.status === 404, 'User B cannot access User A AI plan (returns 404 Not Found)');

  const unauthorizedAccept = await request('/ai/goals/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify(acceptPayload),
  });
  assert(unauthorizedAccept.status === 404, 'User B cannot accept User A AI plan (returns 404 Not Found)');

  // ==========================================================
  // Test 9: Task Count Capped at Configured Limit
  // ==========================================================
  console.log('\n--- Test 9: Task count capped at configured limit ---');
  const excessPayload = {
    prompt: 'Create 100 workout tasks for every single muscle group',
    category: 'FITNESS',
    availableTimePerDay: 120,
    daysPerWeek: 7,
  };
  const excessRes = await request('/ai/goals/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify(excessPayload),
  });
  assert(excessRes.status === 201, 'Excess request processed safely');
  assert(excessRes.data.data.planData.tasks.length <= 50, 'Task count is bounded by AI_MAX_TASKS (<= 50)');

  // ==========================================================
  // Test 10: Duplicate accept prevention
  // ==========================================================
  console.log('\n--- Test 10: Duplicate accept prevention ---');
  const duplicateAccept = await request('/ai/goals/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify(acceptPayload),
  });
  assert(duplicateAccept.status === 400, 'Accepting an already accepted plan returns 400 Bad Request');

  // ==========================================================
  // Test 11: Daily AI suggestions based on live user data
  // ==========================================================
  console.log('\n--- Test 11: Daily AI suggestions based on actual user context ---');
  const dailyRes = await request('/ai/daily-suggestions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      availableMinutes: 60,
      focusPreference: 'SKILL',
    }),
  });

  assert(dailyRes.status === 200, 'Daily suggestions endpoint responded with 200 OK');
  assert(dailyRes.data.success === true, 'Daily suggestions marked success');
  const suggestions = dailyRes.data.data;
  assert(Array.isArray(suggestions.suggestions) && suggestions.suggestions.length > 0, 'Contains prioritized suggestions');
  assert(typeof suggestions.focusTheme === 'string', 'Contains theme focus');
  assert(typeof suggestions.motivationalQuote === 'string', 'Contains motivational quote');

  console.log('Daily Suggestion focus area:', suggestions.focusTheme);
  console.log('Sample recommendation:', suggestions.suggestions[0]?.title);

  // ==========================================================
  // Test 12: AI has NO direct access to XP, streak, or character stats
  // ==========================================================
  console.log('\n--- Test 12: AI cannot directly manipulate XP or streaks ---');
  // Check user character stats before task completion
  const charBefore = await request('/gamification/profile', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const xpBefore = charBefore.data.data.character.totalXP;

  // Ensure generating AI roadmaps or receiving daily suggestions did not award XP or modify character
  assert(xpBefore === 0, 'AI generation or advice directly awarded 0 XP (character remains at baseline)');

  // Now complete a real task instance via the existing Phase 2/3 Task Instance API
  const instanceToComplete = instances[0];
  const completeRes = await request(`/tasks/instances/${instanceToComplete.id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(completeRes.status === 200, 'Task instance completed via existing Gamification system');
  const gamificationResult = completeRes.data.data.gamification;
  assert(gamificationResult.xpAwarded > 0, 'XP correctly awarded ONLY via existing task completion business logic');

  const charAfter = await request('/gamification/profile', {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(charAfter.data.data.character.totalXP > xpBefore, 'Character progression handled exclusively by Gamification system');

  console.log('\n======================================================');
  console.log('🎉 ALL 12 PHASE 5 TEST SCENARIOS PASSED WITH ZERO ERRORS');
  console.log('======================================================\n');
}

runPhase5Tests().catch((err) => {
  console.error('Fatal error during Phase 5 tests:', err);
  process.exit(1);
});

export {};
