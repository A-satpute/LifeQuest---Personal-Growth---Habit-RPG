import http from 'http';
import app from './app';
import { prisma } from './db/prisma';

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

function assert(condition: boolean, name: string) {
  if (condition) {
    results.push({ name, passed: true });
  } else {
    results.push({ name, passed: false, message: 'Assertion failed' });
  }
}

async function runPhase2Tests() {
  const TEST_PORT = 5066;
  const server = app.listen(TEST_PORT);

  console.log(`\n======================================================`);
  console.log(`🧪 RUNNING PHASE 2: GOALS & TASKS AUTOMATED TESTS`);
  console.log(`======================================================\n`);

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Create User A & User B
    const userAEmail = `hero_a_${Date.now()}@quest.com`;
    const regA = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Hero Arthur',
      email: userAEmail,
      password: 'Password123!',
    });
    const tokenA = regA.data.data.token;
    const userAId = regA.data.data.user.id;

    const userBEmail = `hero_b_${Date.now()}@quest.com`;
    const regB = await request(TEST_PORT, 'POST', '/api/auth/register', {}, {
      name: 'Rival Lancelot',
      email: userBEmail,
      password: 'Password123!',
    });
    const tokenB = regB.data.data.token;
    const userBId = regB.data.data.user.id;

    assert(tokenA && tokenB, 'Initialized authenticated test accounts');

    // 2. User A creates Goal
    const goalRes = await request(TEST_PORT, 'POST', '/api/goals', { Authorization: `Bearer ${tokenA}` }, {
      title: 'Gain 5kg Muscle & Strength',
      description: 'Progressive overload training and balanced nutrition.',
      category: 'Fitness',
      priority: 'HIGH',
      startDate: todayStr,
      endDate: '2026-12-31',
    });
    assert(goalRes.status === 201 && goalRes.data.data.goal.id, 'User A created goal successfully');
    const goalId = goalRes.data.data.goal.id;

    // 3. User A views Goals list & single goal
    const goalsList = await request(TEST_PORT, 'GET', '/api/goals', { Authorization: `Bearer ${tokenA}` });
    assert(goalsList.status === 200 && goalsList.data.data.goals.length === 1, 'User A retrieves goal list');

    const singleGoal = await request(TEST_PORT, 'GET', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenA}` });
    assert(singleGoal.status === 200 && singleGoal.data.data.goal.progress === 0, 'User A views single goal details');

    // 4. User A edits goal & pauses goal
    const editGoal = await request(TEST_PORT, 'PUT', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenA}` }, {
      title: 'Gain 5kg Lean Muscle (Updated)',
    });
    assert(editGoal.status === 200 && editGoal.data.data.goal.title.includes('Updated'), 'User A edited goal title');

    const pauseGoal = await request(TEST_PORT, 'PATCH', `/api/goals/${goalId}/status`, { Authorization: `Bearer ${tokenA}` }, {
      status: 'PAUSED',
    });
    assert(pauseGoal.status === 200 && pauseGoal.data.data.goal.status === 'PAUSED', 'User A paused goal status');

    // Resume goal
    await request(TEST_PORT, 'PATCH', `/api/goals/${goalId}/status`, { Authorization: `Bearer ${tokenA}` }, {
      status: 'ACTIVE',
    });

    // 5. User A creates a one-off Goal Task
    const taskRes1 = await request(TEST_PORT, 'POST', '/api/tasks', { Authorization: `Bearer ${tokenA}` }, {
      title: 'Heavy Bench Press Session',
      description: '5 sets of 5 reps',
      goalId: goalId,
      category: 'Fitness',
      priority: 'HIGH',
      taskDate: todayStr,
      isRecurring: false,
    });
    assert(taskRes1.status === 201 && taskRes1.data.data.initialInstance.id, 'User A created one-off goal task with instance');
    const instance1Id = taskRes1.data.data.initialInstance.id;

    // 6. User A creates an independent daily task (no goal attached)
    const taskRes2 = await request(TEST_PORT, 'POST', '/api/tasks', { Authorization: `Bearer ${tokenA}` }, {
      title: 'Drink 3L Hydration Water',
      category: 'Health',
      priority: 'MEDIUM',
      taskDate: todayStr,
      isRecurring: false,
    });
    assert(taskRes2.status === 201 && taskRes2.data.data.initialInstance.goalId === null, 'User A created independent task without goal');

    // 7. User A creates a Daily Recurring Task
    const recTaskRes = await request(TEST_PORT, 'POST', '/api/tasks', { Authorization: `Bearer ${tokenA}` }, {
      title: 'Daily 15-min Mobility Stretch',
      category: 'Health',
      priority: 'LOW',
      taskDate: todayStr,
      isRecurring: true,
      recurrenceType: 'DAILY',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    });
    assert(recTaskRes.status === 201 && recTaskRes.data.data.task.isRecurring === true, 'User A created daily recurring task template');

    // 8. User A queries Today's tasks (verifies materialization and calculation)
    const todayRes = await request(TEST_PORT, 'GET', `/api/tasks/today?date=${todayStr}`, { Authorization: `Bearer ${tokenA}` });
    assert(todayRes.status === 200 && todayRes.data.data.tasks.length === 3, 'Today tasks includes one-off, independent, and materialized recurring instances');
    assert(todayRes.data.data.stats.total === 3 && todayRes.data.data.stats.completed === 0, 'Today stats correctly compute 0 completed out of 3');

    // 9. User A Completes Goal Task 1 -> triggers Goal progress update
    const completeRes = await request(TEST_PORT, 'PATCH', `/api/tasks/instances/${instance1Id}/toggle`, { Authorization: `Bearer ${tokenA}` });
    assert(completeRes.status === 200 && completeRes.data.data.instance.completed === true, 'Task completed with completed=true');
    assert(completeRes.data.data.goalProgress === 100, 'Goal progress dynamically updated to 100% (1/1 completed)');

    // Verify goal progress via GET /api/goals/:id
    const updatedGoal = await request(TEST_PORT, 'GET', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenA}` });
    assert(updatedGoal.data.data.goal.progress === 100, 'Goal record progress verified as 100%');

    // 10. User A Uncompletes Goal Task 1 -> goal progress recalculates
    const uncompleteRes = await request(TEST_PORT, 'PATCH', `/api/tasks/instances/${instance1Id}/toggle`, { Authorization: `Bearer ${tokenA}` });
    assert(uncompleteRes.status === 200 && uncompleteRes.data.data.instance.completed === false, 'Task uncompleted with completed=false');
    assert(uncompleteRes.data.data.goalProgress === 0, 'Goal progress recalculated back to 0%');

    // 11. Recurring instance date isolation test:
    // Query tomorrow's upcoming tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcomingRes = await request(TEST_PORT, 'GET', `/api/tasks/upcoming?fromDate=${todayStr}&days=1`, { Authorization: `Bearer ${tokenA}` });
    assert(upcomingRes.status === 200 && upcomingRes.data.data.tasks.length >= 1, 'Upcoming tasks materialized tomorrow instance of recurring task');
    
    // Find tomorrow's instance of mobility stretch
    const tomorrowInstance = upcomingRes.data.data.tasks.find((t: any) => t.title.includes('Mobility Stretch') && t.taskDate === tomorrowStr);
    assert(tomorrowInstance && tomorrowInstance.completed === false, 'Tomorrow instance is separate and remains uncompleted');

    // 12. Security & Data Isolation Tests: User B cannot access User A's data
    const rivalViewGoal = await request(TEST_PORT, 'GET', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenB}` });
    assert(rivalViewGoal.status === 404, 'User B rejected with 404 when attempting to view User A goal');

    const rivalEditGoal = await request(TEST_PORT, 'PUT', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenB}` }, { title: 'Hacked Goal' });
    assert(rivalEditGoal.status === 404, 'User B rejected with 404 when attempting to edit User A goal');

    const rivalCompleteTask = await request(TEST_PORT, 'PATCH', `/api/tasks/instances/${instance1Id}/toggle`, { Authorization: `Bearer ${tokenB}` });
    assert(rivalCompleteTask.status === 404, 'User B rejected with 404 when attempting to complete User A task');

    const rivalDeleteTask = await request(TEST_PORT, 'DELETE', `/api/tasks/instances/${instance1Id}`, { Authorization: `Bearer ${tokenB}` });
    assert(rivalDeleteTask.status === 404, 'User B rejected with 404 when attempting to delete User A task');

    // 13. Clean deletion test: User A deletes task instance
    const delInstance = await request(TEST_PORT, 'DELETE', `/api/tasks/instances/${instance1Id}`, { Authorization: `Bearer ${tokenA}` });
    assert(delInstance.status === 200, 'User A deleted task instance successfully');

    // User A deletes goal
    const delGoal = await request(TEST_PORT, 'DELETE', `/api/goals/${goalId}`, { Authorization: `Bearer ${tokenA}` });
    assert(delGoal.status === 200, 'User A deleted goal successfully');
  } catch (err: any) {
    console.error('Test execution failed:', err);
    results.push({ name: 'Execution Error', passed: false, message: err.message });
  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log('📊 PHASE 2 TEST SUMMARY RESULTS:');
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

runPhase2Tests();
