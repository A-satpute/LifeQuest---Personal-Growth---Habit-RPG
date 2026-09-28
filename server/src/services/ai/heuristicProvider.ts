import { AIProvider, StructuredPlanOutput, DailySuggestionsOutput } from './aiProvider.interface.js';
import { Priority, RecurrenceType } from '@prisma/client';
import crypto from 'crypto';

export class HeuristicAIProvider implements AIProvider {
  name = 'Heuristic Roadmap Architect';

  async generateRoadmap(input: {
    prompt: string;
    category?: string;
    targetDate?: string;
    skillLevel?: string;
    availableTimePerDay?: number;
    daysPerWeek?: number;
    preferredDifficulty?: string;
    guidanceNotes?: string;
  }): Promise<StructuredPlanOutput> {
    const promptLower = input.prompt.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    // Determine domain category
    let category = input.category || 'Learning';
    if (promptLower.includes('fit') || promptLower.includes('workout') || promptLower.includes('weight') || promptLower.includes('run') || promptLower.includes('muscle')) {
      category = 'Fitness';
    } else if (promptLower.includes('read') || promptLower.includes('book')) {
      category = 'Reading';
    } else if (promptLower.includes('meditat') || promptLower.includes('mindful') || promptLower.includes('peace') || promptLower.includes('stress')) {
      category = 'Mindfulness';
    } else if (promptLower.includes('code') || promptLower.includes('react') || promptLower.includes('study') || promptLower.includes('learn') || promptLower.includes('exam') || promptLower.includes('project')) {
      category = 'Learning';
    } else if (promptLower.includes('work') || promptLower.includes('career') || promptLower.includes('job') || promptLower.includes('resume')) {
      category = 'Career';
    }

    const goalTitle = this.extractGoalTitle(input.prompt);
    const difficulty = (input.preferredDifficulty as any) || 'MEDIUM';
    const durationDays = this.calculateDurationDays(input.prompt, input.targetDate);

    // Generate milestones based on category & goal
    const milestones = this.generateMilestones(
      goalTitle,
      category,
      durationDays,
      input.targetDate,
      input.prompt,
      input.guidanceNotes
    );

    // Generate actionable tasks tied to milestones
    const tasks = this.generateTasks(goalTitle, category, milestones, input);

    const guidanceEffect = input.guidanceNotes
      ? ` Plan refined with your directive: "${input.guidanceNotes}".`
      : '';

    return {
      goalTitle,
      category,
      summary: `A structured ${durationDays}-day blueprint designed for a ${input.skillLevel || 'Beginner'} level, allocating ${input.availableTimePerDay || 60} mins/day across ${input.daysPerWeek || 5} days/week.${guidanceEffect}`,
      estimatedDuration: `${durationDays} days`,
      difficulty,
      milestones,
      tasks,
      recommendations: [
        'Complete the high-priority tasks in the morning to protect your daily streak.',
        'Use the in-app notification alerts at 8:00 PM to ensure no pending tasks slip through.',
        'Consistent 30–60 minute sessions beat sporadic weekend cramming.',
      ],
    };
  }

  async generateDailySuggestions(context: {
    userName: string;
    streak: number;
    level: number;
    todayDate: string;
    todayTasks: Array<{ title: string; category: string; completed: boolean; priority: string }>;
    activeGoals: Array<{ title: string; category: string; progress: number; endDate: string | null }>;
    timeAvailableMinutes?: number;
    focusCategory?: string;
  }): Promise<DailySuggestionsOutput> {
    const pendingToday = context.todayTasks.filter((t) => !t.completed);
    const suggestions: any[] = [];

    // 1. Prioritize pending today tasks
    if (pendingToday.length > 0) {
      const topPending = pendingToday[0];
      suggestions.push({
        id: crypto.randomUUID(),
        title: `Complete "${topPending.title}"`,
        reason: `You have this pending today. Finish it to protect your ${context.streak}-day streak!`,
        category: topPending.category,
        priority: 'HIGH',
        estimatedMinutes: 30,
        relatedGoalTitle: null,
      });
    }

    // 2. Prioritize active goal with lowest progress
    if (context.activeGoals.length > 0) {
      const sortedGoals = [...context.activeGoals].sort((a, b) => a.progress - b.progress);
      const lowestGoal = sortedGoals[0];
      suggestions.push({
        id: crypto.randomUUID(),
        title: `Advance "${lowestGoal.title}"`,
        reason: `Currently at ${lowestGoal.progress}% completion. A focused 25-minute sprint will advance this roadmap.`,
        category: lowestGoal.category,
        priority: 'MEDIUM',
        estimatedMinutes: 25,
        relatedGoalTitle: lowestGoal.title,
      });
    }

    // 3. Consistency / Recovery action
    suggestions.push({
      id: crypto.randomUUID(),
      title: 'Quick 15-Minute Review & Reset',
      reason: 'Review your achievements today and prepare your schedule for tomorrow.',
      category: 'Mindfulness',
      priority: 'LOW',
      estimatedMinutes: 15,
      relatedGoalTitle: null,
    });

    return {
      greeting: `Greetings, Hero ${context.userName}! Ready for Level ${context.level} glory?`,
      focusTheme: context.streak > 5 ? 'Streak Defense & Mastery' : 'Consistency Momentum',
      suggestions,
      motivationalQuote: 'Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.',
    };
  }

  private extractGoalTitle(prompt: string): string {
    let clean = prompt
      .replace(/^(i want to|i need to|i plan to|help me|create a roadmap for|plan for)\s+/i, '')
      .trim();
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    // Limit to reasonable title length
    return clean.slice(0, 80);
  }

  private calculateDurationDays(prompt: string, targetDate?: string): number {
    if (targetDate) {
      const now = new Date();
      const target = new Date(targetDate);
      const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return Math.min(365, diffDays);
    }

    const matchMonths = prompt.match(/(\d+)\s*months?/i);
    if (matchMonths) return parseInt(matchMonths[1], 10) * 30;

    const matchDays = prompt.match(/(\d+)\s*days?/i);
    if (matchDays) return parseInt(matchDays[1], 10);

    const matchWeeks = prompt.match(/(\d+)\s*weeks?/i);
    if (matchWeeks) return parseInt(matchWeeks[1], 10) * 7;

    return 60; // Default 60-day roadmap
  }

  private generateMilestones(
    goalTitle: string,
    category: string,
    durationDays: number,
    targetDate?: string,
    prompt: string = '',
    guidanceNotes?: string
  ) {
    const pLower = prompt.toLowerCase();
    const gLower = (guidanceNotes || '').toLowerCase();
    const now = new Date();

    interface MilestoneTemplate {
      title: string;
      points: string[];
    }

    let templates: MilestoneTemplate[] = [];

    if (pLower.includes('python')) {
      templates = [
        {
          title: 'Python Basics',
          points: [
            'Learn Python syntax.',
            'Understand how Python programs work.',
            'Practice variables and basic commands.',
          ],
        },
        {
          title: 'Variables & Data Types',
          points: [
            'Learn strings, numbers, and booleans.',
            'Practice lists, tuples, and dictionaries.',
            'Learn simple type conversions.',
          ],
        },
        {
          title: 'Conditions & Loops',
          points: [
            'Learn if/else logic.',
            'Learn for and while loops.',
            'Practice small coding problems.',
          ],
        },
        {
          title: 'Functions & Modules',
          points: [
            'Write reusable functions.',
            'Understand parameters and return values.',
            'Organize code into clean files.',
          ],
        },
        {
          title: 'Practical Coding Projects',
          points: [
            'Build a command-line calculator.',
            'Build a text-based decision game.',
            'Practice small problem-solving challenges.',
          ],
        },
      ];

      // Handle guidance modifications
      if (gLower.includes('api') && (gLower.includes('remove') || gLower.includes('without') || gLower.includes("don't want") || gLower.includes('not yet'))) {
        templates = templates.filter((t) => !t.title.toLowerCase().includes('api'));
      }
      if (gLower.includes('project') || gLower.includes('practical')) {
        if (!templates.some((t) => t.title.toLowerCase().includes('project'))) {
          templates.push({
            title: 'Hands-on Practice Projects',
            points: [
              'Build a mini budget tracker in Python.',
              'Create a simple quiz game.',
              'Apply everything learned in practical exercises.',
            ],
          });
        }
      }
      if (gLower.includes('easier') || gLower.includes('beginner')) {
        templates = templates.map((t) => ({
          ...t,
          points: t.points.map((p) => `Step-by-step: ${p}`),
        }));
      }
    } else if (category === 'Fitness' || pLower.includes('fit') || pLower.includes('workout')) {
      templates = [
        {
          title: 'Foundation & Proper Form',
          points: [
            'Learn foundational bodyweight movements.',
            'Establish 10-minute dynamic warmups.',
            'Focus on correct breathing and posture.',
          ],
        },
        {
          title: 'Building Strength & Stamina',
          points: [
            'Introduce structured progressive resistance.',
            'Practice upper and lower body circuits.',
            'Track repetitions and resting intervals.',
          ],
        },
        {
          title: 'Endurance & Active Recovery',
          points: [
            'Incorporate light cardio and recovery walks.',
            'Maintain daily hydration and sleep goals.',
            'Increase workout intensity gradually.',
          ],
        },
        {
          title: 'Consistency & Habit Mastery',
          points: [
            'Complete your weekly workout routine reliably.',
            'Review personal milestones and stamina gains.',
            'Solidify lifelong health habits.',
          ],
        },
      ];
    } else if (category === 'Reading' || pLower.includes('read') || pLower.includes('book')) {
      templates = [
        {
          title: 'Daily Reading Routine',
          points: [
            'Establish a distraction-free 20-minute daily reading block.',
            'Read 10 to 15 pages consistently each day.',
            'Keep track of daily pages completed.',
          ],
        },
        {
          title: 'Active Note-Taking & Highlights',
          points: [
            'Highlight key quotes and ideas while reading.',
            'Write down 2-3 key takeaways after every chapter.',
            'Connect ideas to your personal life or work.',
          ],
        },
        {
          title: 'Deep Understanding & Synthesis',
          points: [
            'Summarize complete sections in your own words.',
            'Discuss insights with a friend or in a reading journal.',
            'Review challenging chapters to ensure comprehension.',
          ],
        },
        {
          title: 'Knowledge Application',
          points: [
            'Identify actionable lessons from the book.',
            'Implement at least one concept in your daily routine.',
            'Celebrate finishing the book and pick the next quest!',
          ],
        },
      ];
    } else if (category === 'Mindfulness' || pLower.includes('meditat') || pLower.includes('mindful')) {
      templates = [
        {
          title: 'Breathwork Baseline',
          points: [
            'Practice 5 minutes of focused box breathing.',
            'Establish a quiet morning meditation spot.',
            'Notice wandering thoughts without judgment.',
          ],
        },
        {
          title: 'Daily Mindful Awareness',
          points: [
            'Take a 10-minute midday screen break.',
            'Practice mindful eating during lunch.',
            'Do a gentle physical body scan.',
          ],
        },
        {
          title: 'Stress Regulation & Calm',
          points: [
            'Use deep breathing during stressful moments.',
            'Write down 3 things you are grateful for each day.',
            'Unwind 30 minutes before bed without devices.',
          ],
        },
        {
          title: 'Emotional Resilience',
          points: [
            'Reflect on weekly emotional growth.',
            'Cultivate kindness toward yourself and others.',
            'Maintain peace and mental balance daily.',
          ],
        },
      ];
    } else {
      // General / Learning / Career
      templates = [
        {
          title: `${goalTitle} Fundamentals`,
          points: [
            'Understand basic concepts and core terms.',
            'Set up required tools and resources.',
            'Practice simple introductory exercises.',
          ],
        },
        {
          title: 'Core Concepts & Techniques',
          points: [
            'Study the essential patterns and rules.',
            'Practice with guided examples.',
            'Overcome common beginner hurdles.',
          ],
        },
        {
          title: 'Hands-on Practice & Application',
          points: [
            'Apply concepts in small practical exercises.',
            'Review errors and consolidate your notes.',
            'Build confidence through repetition.',
          ],
        },
        {
          title: 'Milestone Achievement & Review',
          points: [
            'Combine all skills into a finished project or test.',
            'Evaluate your progress and growth.',
            'Plan next-level adventures and habits.',
          ],
        },
      ];
    }

    const intervalDays = Math.max(7, Math.floor(durationDays / templates.length));

    return templates.map((tmpl, i) => {
      const milestoneDate = new Date(now.getTime() + (i + 1) * intervalDays * 24 * 60 * 60 * 1000);
      const desc = tmpl.points.map((p) => `- ${p}`).join('\n');
      return {
        id: `ms-${i + 1}`,
        title: tmpl.title,
        description: desc,
        order: i + 1,
        targetDate: milestoneDate.toISOString().split('T')[0],
      };
    });
  }

  private generateTasks(
    goalTitle: string,
    category: string,
    milestones: any[],
    input: any
  ) {
    const today = new Date();
    const minutes = input.availableTimePerDay || 30;
    const pLower = (input.prompt || '').toLowerCase();
    const gLower = (input.guidanceNotes || '').toLowerCase();

    interface DayTaskDef {
      day: number;
      title: string;
      desc: string;
      prio: Priority;
    }

    let dayPlans: DayTaskDef[] = [];

    if (pLower.includes('python')) {
      dayPlans = [
        {
          day: 1,
          title: 'Day 1: Install Python & Environment Setup',
          desc: 'Install Python and set up your editor (VS Code or IDLE). Run your first Hello World.',
          prio: Priority.HIGH,
        },
        {
          day: 1,
          title: 'Day 1: Learn Variables & Basic Output',
          desc: 'Practice declaring variables, printing text, and accepting user input in Python.',
          prio: Priority.MEDIUM,
        },
        {
          day: 2,
          title: 'Day 2: Data Types & Simple Operations',
          desc: 'Learn strings, integers, and floats. Practice basic arithmetic operations.',
          prio: Priority.HIGH,
        },
        {
          day: 2,
          title: 'Day 2: Complete 3 Practice Exercises',
          desc: 'Solve 3 beginner exercises manipulating numbers and strings.',
          prio: Priority.MEDIUM,
        },
        {
          day: 3,
          title: 'Day 3: Conditions & Decision Logic',
          desc: 'Learn if, elif, and else statements. Practice evaluating boolean conditions.',
          prio: Priority.HIGH,
        },
        {
          day: 3,
          title: 'Day 3: Build a Decision Program',
          desc: 'Create a small interactive program (e.g. simple grade checker or number game).',
          prio: Priority.HIGH,
        },
        {
          day: 4,
          title: 'Day 4: Loops & Repetition',
          desc: 'Learn while loops and for loops. Practice iterating over simple ranges.',
          prio: Priority.HIGH,
        },
        {
          day: 5,
          title: 'Day 5: Lists & Collections',
          desc: 'Learn how to create and modify lists, append items, and loop through them.',
          prio: Priority.MEDIUM,
        },
        {
          day: 6,
          title: 'Day 6: Reusable Functions',
          desc: 'Define your own functions using def, pass parameters, and return values.',
          prio: Priority.HIGH,
        },
        {
          day: 7,
          title: 'Day 7: Hands-On Practice Project',
          desc: 'Build a mini-project combining variables, conditions, loops, and functions.',
          prio: Priority.URGENT,
        },
      ];
    } else {
      // General day-by-day task generation
      dayPlans = [
        {
          day: 1,
          title: `Day 1: Getting Started with ${goalTitle}`,
          desc: `Set up your learning materials and environment for ${goalTitle}.`,
          prio: Priority.HIGH,
        },
        {
          day: 1,
          title: 'Day 1: Core Fundamentals Introduction',
          desc: 'Review basic concepts and complete your first guided exercise.',
          prio: Priority.MEDIUM,
        },
        {
          day: 2,
          title: 'Day 2: Core Concepts Deep Dive',
          desc: 'Study key patterns and practice with hands-on examples.',
          prio: Priority.HIGH,
        },
        {
          day: 2,
          title: 'Day 2: Complete 3 Practice Exercises',
          desc: 'Solve exercises to test and reinforce today\'s learning.',
          prio: Priority.MEDIUM,
        },
        {
          day: 3,
          title: 'Day 3: Intermediate Application',
          desc: 'Apply learned principles to a realistic practical problem.',
          prio: Priority.HIGH,
        },
        {
          day: 4,
          title: 'Day 4: Practice & Consolidation',
          desc: 'Review mistakes, take notes, and complete practical challenges.',
          prio: Priority.MEDIUM,
        },
        {
          day: 5,
          title: 'Day 5: Mini Capstone Challenge',
          desc: 'Put everything together into a concrete finished milestone.',
          prio: Priority.URGENT,
        },
      ];
    }

    return dayPlans.map((dp, idx) => {
      const taskDate = new Date(today.getTime() + (dp.day - 1) * 24 * 60 * 60 * 1000);
      const milestone = milestones[Math.min(milestones.length - 1, Math.floor(idx / 2))];

      return {
        id: crypto.randomUUID(),
        milestoneId: milestone?.id || 'ms-1',
        title: dp.title,
        description: dp.desc,
        category,
        priority: dp.prio,
        estimatedMinutes: minutes,
        isRecurring: false,
        recurrenceType: RecurrenceType.NONE,
        recurrenceDays: [],
        suggestedDate: taskDate.toISOString().split('T')[0],
        selected: true,
      };
    });
  }
}
