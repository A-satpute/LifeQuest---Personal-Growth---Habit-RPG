import process from 'node:process';
import { getUserLocalDateTime } from './utils/timezone.js';

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

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 4: SMART NOTIFICATION SYSTEM TESTS');
  console.log('======================================================\n');

  const timestamp = Date.now();

  // 1. Setup Test Users
  const resRegA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `notif_user_a_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Notifier Hero A',
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
      email: `notif_user_b_${timestamp}@lifequest.com`,
      password: 'HeroPassword123!',
      name: 'Notifier Hero B',
    }),
  });
  assert(resRegB.status === 201, 'User B registered successfully');
  userB = {
    token: resRegB.data.data.token,
    email: resRegB.data.data.user.email,
    id: resRegB.data.data.user.id,
  };

  // 2. Set Preferences for User A & User B
  const day1 = '2026-09-25';
  const day2 = '2026-09-26';

  const resPrefA = await request('/notifications/preferences', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      taskNotificationsEnabled: true,
      notificationTime: '20:00',
      timezone: 'America/New_York',
    }),
  });
  assert(resPrefA.status === 200, 'User A updated preferences with America/New_York timezone');
  assert(
    resPrefA.data.data.timezone === 'America/New_York' && resPrefA.data.data.notificationTime === '20:00',
    'Preferences accurately persisted in database'
  );

  // User B in Asia/Kolkata
  await request('/notifications/preferences', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify({
      taskNotificationsEnabled: true,
      notificationTime: '20:00',
      timezone: 'Asia/Kolkata',
    }),
  });

  // TEST 1 — Pending task: Workout — Sep 25
  const resTask1 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Workout',
      category: 'Fitness',
      priority: 'HIGH',
      taskDate: day1,
    }),
  });
  assert(resTask1.status === 201, 'User A created Workout task for Sep 25');

  // Simulate scheduler run on Day 1 for User A
  const resSimDay1 = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ targetDate: day1 }),
  });
  assert(resSimDay1.status === 200, 'Scheduler evaluated Day 1 successfully');
  assert(resSimDay1.data.data.notified === true, 'Test 1: One pending task notification created for Sep 25');

  // Verify in-app notifications
  const resNotifs1 = await request('/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resNotifs1.data.data.total === 1, 'In-app notification center contains 1 notification');
  const notif1 = resNotifs1.data.data.notifications[0];
  assert(notif1.title.includes('Pending Task Reminder'), 'Notification title accurately identifies single pending task');
  assert(notif1.message.includes('Workout'), 'Notification body contains task title "Workout"');
  assert(notif1.targetDate === day1, 'Notification targetDate is exactly 2026-09-25');

  // TEST 2 — Scheduler runs repeatedly (Idempotency)
  const resSimDay1Repeat = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ targetDate: day1 }),
  });
  assert(resSimDay1Repeat.data.data.notified === false, 'Test 2: Repeat run rejected with notified=false');
  assert(
    resSimDay1Repeat.data.data.reason.includes('already generated'),
    'Idempotency verified: Duplicate notification skipped'
  );

  const resNotifs1Check = await request('/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resNotifs1Check.data.data.total === 1, 'Total notifications remains exactly 1 despite repeat scheduler runs');

  // TEST 3 — Completed task before notification time produces ZERO notifications
  const resTaskCompleted = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify({
      title: 'Morning Meditation',
      category: 'Mindfulness',
      priority: 'MEDIUM',
      taskDate: day1,
    }),
  });
  const medInstanceId = resTaskCompleted.data.data.initialInstance.id;
  // User B completes task immediately
  await request(`/tasks/${medInstanceId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
  });

  const resSimUserB = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify({ targetDate: day1 }),
  });
  assert(resSimUserB.data.data.notified === false, 'Test 3: Completed task produces zero pending notifications');
  assert(resSimUserB.data.data.reason.includes('No pending tasks'), 'Verified reason: No pending tasks');

  // TEST 4 — Previous-Day Rule (Day 2 starts, Day 1 remains incomplete)
  // Day 1 Workout was never completed. Now evaluate Day 2 for User A (with no tasks created yet for Day 2)
  const resSimDay2Empty = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ targetDate: day2 }),
  });
  assert(resSimDay2Empty.data.data.notified === false, 'Test 4: Previous-day rule: No notification generated for Day 2 when only Day 1 task is incomplete');

  // TEST 5 — New recurring / Day 2 instance generates its own notification
  const resTaskDay2 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      title: 'Workout',
      category: 'Fitness',
      priority: 'HIGH',
      taskDate: day2,
    }),
  });
  assert(resTaskDay2.status === 201, 'User A created Day 2 Workout instance');

  const resSimDay2WithTask = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ targetDate: day2 }),
  });
  assert(resSimDay2WithTask.data.data.notified === true, 'Test 5: Day 2 task instance independently generates Day 2 notification');

  const resNotifsAfterDay2 = await request('/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resNotifsAfterDay2.data.data.total === 2, 'User A has exactly 2 notifications (1 for Day 1, 1 for Day 2)');
  const dates = resNotifsAfterDay2.data.data.notifications.map((n: any) => n.targetDate);
  assert(dates.includes(day1) && dates.includes(day2), 'Both independent date notifications preserved');

  // TEST 6 — Multiple pending tasks summary
  const day3 = '2026-09-27';
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ title: 'Task Alpha', category: 'Study', priority: 'MEDIUM', taskDate: day3 }),
  });
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ title: 'Task Beta', category: 'Health', priority: 'LOW', taskDate: day3 }),
  });
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ title: 'Task Gamma', category: 'Work', priority: 'HIGH', taskDate: day3 }),
  });

  const resSimMulti = await request('/notifications/simulate-run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({ targetDate: day3 }),
  });
  assert(resSimMulti.data.data.notified === true, 'Scheduler processed multiple pending tasks for Day 3');

  const resNotifsMulti = await request('/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  const notifDay3 = resNotifsMulti.data.data.notifications.find((n: any) => n.targetDate === day3);
  assert(notifDay3 !== undefined, 'Found Day 3 summary notification');
  assert(notifDay3.title.includes('3 Tasks Pending Today'), 'Test 6: Multiple pending tasks consolidated into 1 summary notification');
  assert(
    notifDay3.message.includes('Task Alpha') &&
    notifDay3.message.includes('Task Beta') &&
    notifDay3.message.includes('Task Gamma'),
    'Summary message includes all pending task titles'
  );

  // TEST 7 — Multiple Users Isolation
  // User A has 3 notifications; User B has 0 pending task notifications and zero leak from User A
  const resNotifsUserB = await request('/notifications', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  const pendingNotifsUserB = resNotifsUserB.data.data.notifications.filter((n: any) => n.type === 'PENDING_TASK');
  assert(pendingNotifsUserB.length === 0, 'Test 7: User B has 0 pending task notifications');
  const leakedFromUserA = resNotifsUserB.data.data.notifications.some((n: any) => n.userId === userA.id);
  assert(!leakedFromUserA, 'Test 7: User B notifications list is completely isolated from User A');

  // TEST 8 — Timezone handling
  const tzNY = getUserLocalDateTime('America/New_York', new Date('2026-09-25T14:30:00.000Z'));
  const tzTokyo = getUserLocalDateTime('Asia/Tokyo', new Date('2026-09-25T14:30:00.000Z'));
  assert(tzNY.localTime === '10:30', 'America/New_York calculates 10:30 AM at 14:30 UTC');
  assert(tzTokyo.localTime === '23:30', 'Asia/Tokyo calculates 23:30 PM at 14:30 UTC');
  assert(tzTokyo.localDate === '2026-09-25', 'Asia/Tokyo calculates correct date');

  // TEST 9 — Notification Center: Unread count, Mark as Read, Mark All as Read
  const resUnread1 = await request('/notifications/unread-count', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resUnread1.data.data.unreadCount === 3, 'Unread count correctly reports 3 unread notifications');

  // Mark single notification as read
  const notifToMark = resNotifsMulti.data.data.notifications[0];
  const resMarkSingle = await request(`/notifications/${notifToMark.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resMarkSingle.status === 200, 'Marked single notification as read');
  assert(resMarkSingle.data.data.status === 'READ', 'Notification status updated to READ');

  const resUnread2 = await request('/notifications/unread-count', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resUnread2.data.data.unreadCount === 2, 'Unread count dynamically decremented to 2');

  // Mark all as read
  const resMarkAll = await request('/notifications/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resMarkAll.status === 200 && resMarkAll.data.data.markedCount === 2, 'Mark all as read succeeded');

  const resUnread3 = await request('/notifications/unread-count', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resUnread3.data.data.unreadCount === 0, 'Unread count is now 0');

  // Record delivery attempt (browser notification separation)
  const resDelivery = await request(`/notifications/${notifToMark.id}/delivery-attempted`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  assert(resDelivery.status === 200, 'Browser delivery attempt recorded without conflating with read status');
  assert(resDelivery.data.data.browserDeliveryAttempted === true, 'browserDeliveryAttempted set to true');

  // TEST 10 — Security: User B cannot access or modify User A notification
  const resSecRead = await request(`/notifications/${notifToMark.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  assert(resSecRead.status === 404, 'Test 10: User B rejected with 404 when attempting to mark User A notification as read');

  console.log('\n======================================================');
  console.log('📊 ALL PHASE 4 SMART NOTIFICATION TESTS PASSED!');
  console.log('======================================================\n');
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 Test execution failed:', err);
  process.exit(1);
});
