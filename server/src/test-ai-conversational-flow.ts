import process from 'node:process';

const API_BASE = 'http://localhost:5000/api';

interface TestUser {
  token: string;
  email: string;
  id: string;
}

let user: TestUser;

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

async function runConversationalAiTests() {
  console.log('\n=================================================================');
  console.log('🧪 RUNNING AI CONVERSATIONAL REDESIGN & COMPACT HISTORY TESTS');
  console.log('=================================================================\n');

  const timestamp = Date.now();

  // 1. Setup Test User
  const resReg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `conversational_hero_${timestamp}@lifequest.com`,
      password: 'QuestPassword123!',
      name: 'Conversational Hero',
    }),
  });
  assert(resReg.status === 201, 'Test user registered successfully');
  user = {
    token: resReg.data.data.token,
    email: resReg.data.data.user.email,
    id: resReg.data.data.user.id,
  };

  // 2. Requirement 1: Removed initial fields (no skillLevel, no availableTimePerDay, no daysPerWeek)
  console.log('\n--- Test 1: Initial Roadmap Generation without removed fields ---');
  const initialPayload = {
    prompt: 'I want to learn Python',
    category: 'Learning',
    // targetDate is optional, skillLevel, availableTimePerDay, daysPerWeek omitted!
  };

  const genRes = await request('/ai/goals/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify(initialPayload),
  });

  assert(genRes.status === 201, 'AI generated plan without initial skill level, daily time, or days per week');
  assert(genRes.data.success === true, 'Response marked success');
  const plan1 = genRes.data.data;
  assert(!!plan1.id, 'Plan record created with ID');
  assert(plan1.category === 'Learning', 'Category preserved');

  // 3. Requirement 3: Roadmap displayed as structured bullets with simple explanations
  console.log('\n--- Test 2: Bullet Point Roadmap with Simple Explanations ---');
  const milestones = plan1.planData?.milestones || [];
  assert(milestones.length >= 3, `Roadmap contains ${milestones.length} milestone topics`);
  const firstMilestone = milestones[0];
  assert(!!firstMilestone.title, `First milestone topic: "${firstMilestone.title}"`);
  assert(typeof firstMilestone.description === 'string' && firstMilestone.description.includes('-'),
    'Milestone explanation provides simple, clean bullet points starting with -');
  console.log(`Sample topic explanation:\n${firstMilestone.description}`);

  // 4. Requirement 4 & 5: User does not like roadmap -> Modification Loop without restarting
  console.log('\n--- Test 3: Natural Language Roadmap Modification Loop ---');
  const feedbackNotes = "I don't want APIs yet. Add more practice projects and make it beginner friendly.";
  const regenRes = await request('/ai/goals/regenerate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      planId: plan1.id,
      guidanceNotes: feedbackNotes,
    }),
  });

  assert(regenRes.status === 200, 'Roadmap regenerated with guidance notes');
  const plan2 = regenRes.data.data;
  assert(plan2.id === plan1.id, 'Plan ID is preserved (did NOT restart the whole plan)');
  const updatedMilestones = plan2.planData?.milestones || [];
  const hasApi = updatedMilestones.some((m: any) => m.title.toLowerCase().includes('api'));
  assert(!hasApi, 'APIs were removed as requested by user feedback');
  const hasProjects = updatedMilestones.some((m: any) => m.title.toLowerCase().includes('project') || m.description.toLowerCase().includes('project'));
  assert(hasProjects, 'Practice projects were reinforced in the updated roadmap');

  // 5. Requirement 6: Roadmap Approval
  console.log('\n--- Test 4: Roadmap Approval ---');
  // Plan is now approved by user. We test the two clear paths:
  // Path A: Design Daily Tasks For Me (with daily time asked ONLY after approval)
  // Path B: I'll Create Tasks Manually

  // 6. Requirement 7 & 8: Daily Task Generation with time asked AFTER approval
  console.log('\n--- Test 5: Daily Task Generation based on Approved Roadmap & Daily Time ---');
  const chosenDailyTime = 30; // User chose 30 minutes
  const dailyTasksRes = await request('/ai/goals/regenerate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      planId: plan1.id,
      availableTimePerDay: chosenDailyTime,
      guidanceNotes: 'Generate daily tasks for 30 minutes based on approved roadmap.',
    }),
  });

  assert(dailyTasksRes.status === 200, 'Daily tasks generated after approval with selected daily time');
  const dayPlan = dailyTasksRes.data.data;
  const tasks = dayPlan.planData?.tasks || [];
  assert(tasks.length >= 3, `Generated ${tasks.length} concrete day-by-day tasks`);
  const day1Task = tasks[0];
  assert(day1Task.title.toLowerCase().includes('day 1'), `Tasks are organized day-by-day: "${day1Task.title}"`);
  assert(day1Task.estimatedMinutes === chosenDailyTime, `Task estimated minutes matches selected daily time (${chosenDailyTime}m)`);

  // Materialize AI daily tasks via accept
  const acceptDailyRes = await request('/ai/goals/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      planId: plan1.id,
      goalTitle: 'Learn Python Fast Track',
      selectedTasks: tasks,
    }),
  });

  assert(acceptDailyRes.status === 201, 'AI Daily tasks successfully materialized into real Goal and Task instances');
  assert(acceptDailyRes.data.data.createdTasksCount === tasks.length, `Created ${tasks.length} task instances in Postgres`);

  // 7. Requirement 9: Manual Task Creation Option (Accept roadmap goal with 0 tasks)
  console.log('\n--- Test 6: Manual Task Creation Option ---');
  // Generate a second plan for manual task option
  const manualPlanRes = await request('/ai/goals/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      prompt: 'I want to build a reading habit of 20 pages every day',
      category: 'Reading',
    }),
  });
  const manualPlan = manualPlanRes.data.data;

  const acceptManualRes = await request('/ai/goals/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({
      planId: manualPlan.id,
      goalTitle: 'Daily Reading Habit 20 Pages',
      selectedTasks: [], // User chooses to create tasks manually!
    }),
  });

  assert(acceptManualRes.status === 201, 'Manual task option saves Goal without forcing AI-generated tasks');
  assert(acceptManualRes.data.data.createdTasksCount === 0, 'Zero AI tasks forced when user chose manual creation');
  assert(!!acceptManualRes.data.data.goal.id, 'Goal safely created in database for manual task building');

  // 8. Requirement 16: Compact Calendar & History API & Filtering Verification
  console.log('\n--- Test 7: Compact Calendar & History Verification ---');
  const today = new Date().toISOString().split('T')[0];
  const historyRes = await request(`/analytics/history?startDate=${today}&endDate=${today}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  assert(historyRes.status === 200, 'Date-specific history API responds 200 OK');
  assert(Array.isArray(historyRes.data.data), 'History returns task instances array');

  // Test category filter
  const categoryFilterRes = await request('/analytics/history?category=Learning', {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  assert(categoryFilterRes.status === 200, 'Category filtered history responds 200 OK');

  // Test status filter
  const statusFilterRes = await request('/analytics/history?status=PENDING', {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  assert(statusFilterRes.status === 200, 'Status filtered history responds 200 OK');

  console.log('\n=================================================================');
  console.log('🎉 ALL AI CONVERSATIONAL & COMPACT HISTORY TESTS PASSED (100%)');
  console.log('=================================================================\n');
}

runConversationalAiTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
