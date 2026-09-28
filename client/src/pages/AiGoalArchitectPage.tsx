import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiService } from '../services/ai.service';
import { useToast } from '../context/ToastContext';
import type { AiPlan, AiTaskItem, AiMilestone } from '../types/ai';
import type { Priority } from '../types/goals';
import {
  Sparkles,
  User,
  Send,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw,
  Check,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  roadmap?: {
    goalTitle: string;
    summary: string;
    milestones: AiMilestone[];
    category: string;
    version?: number;
  };
  dayPlan?: {
    dailyTime: number;
    tasks: AiTaskItem[];
  };
  stage?: 'welcome' | 'roadmap' | 'feedback_prompt' | 'feedback_revised' | 'approved' | 'daily_time' | 'daily_tasks' | 'manual_tasks';
}

export const AiGoalArchitectPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initial Goal Input State (Fields 1, 2, 3 removed as per spec)
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Learning');
  const [targetDate, setTargetDate] = useState('');
  const [priority] = useState<Priority>('HIGH');

  // Conversation & AI Plan State
  const [currentPlan, setCurrentPlan] = useState<AiPlan | null>(null);
  const [approvedPlan, setApprovedPlan] = useState<AiPlan | null>(null);
  const [roadmapVersion, setRoadmapVersion] = useState(1);
  const [isRoadmapApproved, setIsRoadmapApproved] = useState(false);
  const [wantsAiDailyTasks, setWantsAiDailyTasks] = useState<boolean | null>(null);
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState(30);
  const [customDailyTime, setCustomDailyTime] = useState('');
  const [generatedDailyTasks, setGeneratedDailyTasks] = useState<AiTaskItem[]>([]);

  // Chat message timeline
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "Greetings, Hero! 🧙‍♂️ I am your LifeQuest AI Architect. Tell me what skill, project, or ambition you want to master, and let's craft your step-by-step roadmap.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stage: 'welcome',
    },
  ]);

  // Chat input bar state
  const [chatInputText, setChatInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Inspiration Prompts
  const quickPrompts = [
    'I want to learn Python',
    'I want to get fit, build strength, and complete a 5k run in 90 days',
    'I want to master React and build modern full-stack web applications',
    'I want to build a consistent habit of reading 20 pages every day for 60 days',
  ];

  // Quick Feedback Suggestion Chips
  const feedbackChips = [
    { label: 'Looks good! 👍', action: 'approve' },
    { label: 'Add more practice projects 🛠️', action: 'Add more practice projects and hands-on exercises.' },
    { label: 'Make it beginner friendly 🌱', action: 'Make it beginner friendly with simpler step-by-step guidance.' },
    { label: 'Focus more on practical work ⚡', action: 'Focus more on practical work and less on abstract theory.' },
    { label: 'Remove advanced topics ✂️', action: 'Remove advanced topics for now and keep the foundation strong.' },
  ];

  // Daily time choices
  const dailyTimeOptions = [
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
  ];

  // Auto-scroll chat to bottom smoothly
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  /**
   * Step 1: Initial Goal Submission -> Generate Roadmap Blueprint
   */
  const handleInitialGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setError('Please tell me what you want to achieve.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add user goal message
      addMessage({
        sender: 'user',
        text: prompt.trim(),
      });

      // AI acknowledges
      addMessage({
        sender: 'ai',
        text: "Great! Let's build your roadmap.",
      });

      const plan = await AiService.generatePlan({
        prompt: prompt.trim(),
        category,
        targetDate: targetDate || undefined,
        priority,
      });

      setCurrentPlan(plan);
      setRoadmapVersion(1);

      // Add AI roadmap card message with bullet point layout
      addMessage({
        sender: 'ai',
        text: `Here is your roadmap for ${plan.planData?.goalTitle || plan.goalTitle || 'your quest'}:`,
        roadmap: {
          goalTitle: plan.planData?.goalTitle || plan.goalTitle || 'Quest Roadmap',
          summary: plan.planData?.summary || plan.summary || '',
          milestones: plan.planData?.milestones || [],
          category: plan.planData?.category || plan.category || category,
          version: 1,
        },
        stage: 'roadmap',
      });

      // AI follow-up asking for feedback
      addMessage({
        sender: 'ai',
        text: 'Does this roadmap look good to you, or would you like me to change anything?',
        stage: 'feedback_prompt',
      });

      showSuccessToast('Roadmap Blueprint Generated', 'Review your roadmap and give feedback or approve!');
    } catch (err: unknown) {
      console.error('Failed to generate roadmap:', err);
      const msg = err instanceof Error ? err.message : 'AI planning is temporarily unavailable. Please try again.';
      setError(msg);
      showErrorToast('Generation Error', msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper: Check if user text expresses approval
   */
  const isApprovalText = (text: string): boolean => {
    const clean = text.trim().toLowerCase();
    const approvalKeywords = [
      'yes',
      'looks good',
      'looks great',
      'look good',
      'i like it',
      'like it',
      'perfect',
      'okay',
      'ok',
      'approved',
      'approve',
      'good',
      'great',
      'awesome',
      'love it',
      'sounds good',
      'proceed',
      'looks perfect',
    ];
    return approvalKeywords.some((kw) => clean === kw || clean.startsWith(kw) || clean.includes('looks good'));
  };

  /**
   * Step 2: Handle User Feedback / Modification or Approval in Chat
   */
  const handleSendChatFeedback = async (feedbackText: string) => {
    if (!feedbackText.trim() || loading || !currentPlan) return;
    const text = feedbackText.trim();
    setChatInputText('');
    setError(null);

    // 1. Check if user approves the roadmap
    if (isApprovalText(text)) {
      handleApproveRoadmap(text);
      return;
    }

    // 2. Otherwise: User requests changes / modifications
    try {
      setLoading(true);

      // Post user's feedback
      addMessage({
        sender: 'user',
        text,
      });

      const nextVersion = roadmapVersion + 1;

      // Call regenerate with guidanceNotes
      const updatedPlan = await AiService.regeneratePlan({
        planId: currentPlan.id,
        guidanceNotes: text,
        targetDate: targetDate || undefined,
      });

      setCurrentPlan(updatedPlan);
      setRoadmapVersion(nextVersion);

      // AI response acknowledging the specific requested changes
      addMessage({
        sender: 'ai',
        text: `Got it. I've updated the roadmap based on your feedback: "${text}".`,
      });

      // Show revised roadmap
      addMessage({
        sender: 'ai',
        text: `Here is the revised roadmap (Version ${nextVersion}):`,
        roadmap: {
          goalTitle: updatedPlan.planData?.goalTitle || updatedPlan.goalTitle || 'Updated Quest Roadmap',
          summary: updatedPlan.planData?.summary || updatedPlan.summary || '',
          milestones: updatedPlan.planData?.milestones || [],
          category: updatedPlan.planData?.category || updatedPlan.category || category,
          version: nextVersion,
        },
        stage: 'feedback_revised',
      });

      // Ask again
      addMessage({
        sender: 'ai',
        text: 'How does this version look? Does this version look better?',
        stage: 'feedback_prompt',
      });

      showSuccessToast('Roadmap Updated', 'Roadmap revised with your guidance!');
    } catch (err: unknown) {
      console.error('Failed to update roadmap:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update roadmap. Please try again.';
      setError(msg);
      showErrorToast('Update Error', msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Roadmap Approved -> Ask Daily Task Generation Choice
   */
  const handleApproveRoadmap = (userResponse: string = 'Looks good!') => {
    if (!currentPlan) return;

    setIsRoadmapApproved(true);
    setApprovedPlan(currentPlan);

    // User message
    addMessage({
      sender: 'user',
      text: userResponse,
    });

    // AI message asking about task generation method
    addMessage({
      sender: 'ai',
      text: 'Great! Would you like me to design your tasks day-by-day based on your available time, or would you prefer to create the tasks manually?',
      stage: 'approved',
    });
  };

  /**
   * Step 4A: User selects "Design Daily Tasks For Me"
   */
  const handleChooseAiDailyTasks = () => {
    setWantsAiDailyTasks(true);

    addMessage({
      sender: 'user',
      text: 'Design Daily Tasks For Me',
    });

    // Prompt for daily time
    addMessage({
      sender: 'ai',
      text: 'How much time can you spend on this goal each day?',
      stage: 'daily_time',
    });
  };

  /**
   * Step 4B: User selects "I'll Create Tasks Manually"
   */
  const handleChooseManualTasks = () => {
    setWantsAiDailyTasks(false);

    addMessage({
      sender: 'user',
      text: "I'll Create Tasks Manually",
    });

    addMessage({
      sender: 'ai',
      text: 'Understood! Your approved roadmap blueprint is preserved. You can now build out your own quest tasks manually at your own pace.',
      stage: 'manual_tasks',
    });
  };

  /**
   * Step 5: Generate Daily Task Plan based on selected daily time
   */
  const handleSelectDailyTime = async (minutes: number) => {
    if (!approvedPlan) return;
    const activePlan = approvedPlan;

    try {
      setLoading(true);
      setError(null);
      setDailyTimeMinutes(minutes);

      const timeLabel = minutes >= 60 ? `${minutes / 60} hour${minutes > 60 ? 's' : ''}` : `${minutes} minutes`;

      addMessage({
        sender: 'user',
        text: `${timeLabel} per day`,
      });

      // Regenerate with availableTimePerDay to generate day-by-day tasks
      const updated = await AiService.regeneratePlan({
        planId: activePlan.id,
        availableTimePerDay: minutes,
        guidanceNotes: `Generate realistic day-by-day tasks matching ${minutes} minutes per day based on the approved roadmap.`,
      });

      const dayTasks = (updated.planData?.tasks || []).map((t) => ({
        ...t,
        selected: t.selected !== undefined ? t.selected : true,
      }));

      setGeneratedDailyTasks(dayTasks);
      setApprovedPlan(updated);

      addMessage({
        sender: 'ai',
        text: `Awesome! Here is your day-by-day task plan designed for ${timeLabel} per day:`,
        dayPlan: {
          dailyTime: minutes,
          tasks: dayTasks,
        },
        stage: 'daily_tasks',
      });

      showSuccessToast('Daily Tasks Ready', 'Day-by-day tasks designed according to your schedule!');
    } catch (err: unknown) {
      console.error('Failed to generate daily tasks:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate daily tasks. Please try again.';
      setError(msg);
      showErrorToast('Daily Task Error', msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 6A: Materialize AI-generated daily tasks into database
   */
  const handleAcceptAiDailyTasks = async () => {
    if (!approvedPlan) return;
    const selectedTasks = generatedDailyTasks.filter((t) => t.selected !== false);

    if (selectedTasks.length === 0) {
      setError('Please select at least one task to include in your quest.');
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const result = await AiService.acceptPlan({
        planId: approvedPlan.id,
        goalTitle: approvedPlan.planData?.goalTitle || approvedPlan.goalTitle,
        goalDescription: approvedPlan.planData?.summary || approvedPlan.summary,
        category: approvedPlan.planData?.category || approvedPlan.category || category,
        priority,
        targetDate: targetDate || undefined,
        selectedTasks,
      });

      showSuccessToast('Quest & Daily Tasks Materialized! 🚀', result.message);
      setTimeout(() => {
        navigate('/goals');
      }, 1200);
    } catch (err: unknown) {
      console.error('Failed to materialize quest:', err);
      const msg = err instanceof Error ? err.message : 'Failed to create goal and tasks. Please try again.';
      setError(msg);
      showErrorToast('Quest Error', msg);
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Step 6B: Save Goal with Manual Task Creation (0 auto-generated tasks)
   */
  const handleSaveGoalManually = async () => {
    if (!approvedPlan) return;

    try {
      setAccepting(true);
      setError(null);

      const result = await AiService.acceptPlan({
        planId: approvedPlan.id,
        goalTitle: approvedPlan.planData?.goalTitle || approvedPlan.goalTitle,
        goalDescription: approvedPlan.planData?.summary || approvedPlan.summary,
        category: approvedPlan.planData?.category || approvedPlan.category || category,
        priority,
        targetDate: targetDate || undefined,
        selectedTasks: [],
      });

      showSuccessToast('Roadmap Goal Saved! 🎯', result.message);
      setTimeout(() => {
        navigate('/goals');
      }, 1200);
    } catch (err: unknown) {
      console.error('Failed to save manual goal:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save goal. Please try again.';
      setError(msg);
      showErrorToast('Save Error', msg);
    } finally {
      setAccepting(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setGeneratedDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, selected: !t.selected } : t))
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 text-2xl">
            🧙‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AI Quest Architect
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-500/30">
                Conversational RPG
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Chat with your personal AI mentor to architect beginner-friendly roadmaps and daily quest plans.
            </p>
          </div>
        </div>

        {isRoadmapApproved && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Roadmap Approved</span>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white font-bold text-sm px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Container */}
      <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl flex flex-col overflow-hidden min-h-[520px]">
        {/* Chat Messages Timeline */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[700px]">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 sm:gap-3.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {/* AI Avatar */}
                {isAi && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md text-base sm:text-lg">
                    🧙‍♂️
                  </div>
                )}

                {/* Message Body */}
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed space-y-3.5 shadow-md ${
                    isAi
                      ? 'bg-slate-900/90 text-slate-200 border border-slate-800/90'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium ml-auto'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm sm:text-[15px]">{msg.text}</p>

                  {/* Bullet Roadmap Card inside AI Message */}
                  {msg.roadmap && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-4 text-left">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-400" />
                          <h3 className="font-bold text-white text-base sm:text-lg">
                            {msg.roadmap.goalTitle}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-bold">
                          v{msg.roadmap.version || 1}
                        </span>
                      </div>

                      {msg.roadmap.summary && (
                        <p className="text-xs sm:text-sm text-slate-300 italic bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/20">
                          {msg.roadmap.summary}
                        </p>
                      )}

                      {/* Bullet-Point Topics with Simple Explanations */}
                      <div className="space-y-3 pt-1">
                        <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          Roadmap Blueprint Topics
                        </span>

                        <ul className="space-y-3">
                          {msg.roadmap.milestones.map((ms, idx) => (
                            <li
                              key={ms.id || idx}
                              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block shrink-0" />
                                <span>{ms.title}</span>
                              </div>

                              {/* Simple Explanations / Sub-bullets */}
                              {ms.description && (
                                <div className="pl-4 space-y-1 text-xs sm:text-sm text-slate-400">
                                  {ms.description.split('\n').map((line, lIdx) => {
                                    const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                                    if (!cleanLine) return null;
                                    return (
                                      <div key={lIdx} className="flex items-start gap-2">
                                        <span className="text-indigo-400/70 select-none">-</span>
                                        <span>{cleanLine}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Day-by-Day Task Plan inside AI Message */}
                  {msg.dayPlan && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Day-by-Day Action Quests</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {msg.dayPlan.dailyTime || dailyTimeMinutes} mins / day
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {msg.dayPlan.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskSelection(task.id)}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                              task.selected !== false
                                ? 'bg-slate-900/90 border-slate-700 hover:border-emerald-500/50'
                                : 'bg-slate-950/50 border-slate-900 opacity-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                task.selected !== false
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {task.selected !== false && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4
                                  className={`text-sm font-semibold truncate ${
                                    task.selected !== false ? 'text-white' : 'text-slate-500 line-through'
                                  }`}
                                >
                                  {task.title}
                                </h4>
                                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                                  {task.estimatedMinutes}m
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Materialize Button */}
                      <button
                        onClick={handleAcceptAiDailyTasks}
                        disabled={accepting}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {accepting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Materializing Quests in LifeQuest...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Accept & Start Quest 🚀</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Options Stage: Choose between AI Daily Tasks and Manual Tasks */}
                  {msg.stage === 'approved' && wantsAiDailyTasks === null && (
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleChooseAiDailyTasks}
                        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/50 hover:border-indigo-400 text-left space-y-1.5 transition-all hover:scale-[1.01] group shadow-md"
                      >
                        <div className="flex items-center justify-between text-indigo-300 font-bold text-sm">
                          <span>Design Daily Tasks For Me</span>
                          <Sparkles className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <p className="text-xs text-slate-400">
                          AI generates realistic day-by-day quest missions customized to your daily available time.
                        </p>
                      </button>

                      <button
                        onClick={handleChooseManualTasks}
                        className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 text-left space-y-1.5 transition-all hover:scale-[1.01] group shadow-md"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-bold text-sm">
                          <span>I'll Create Tasks Manually</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <p className="text-xs text-slate-400">
                          Keep the approved roadmap blueprint and create your own quest tasks freely at your own pace.
                        </p>
                      </button>
                    </div>
                  )}

                  {/* Options Stage: Select Available Time per day */}
                  {msg.stage === 'daily_time' && (
                    <div className="pt-2 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {dailyTimeOptions.map((opt) => (
                          <button
                            key={opt.minutes}
                            onClick={() => handleSelectDailyTime(opt.minutes)}
                            disabled={loading}
                            className="p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/80 border border-slate-700 hover:border-indigo-400 text-white text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5 text-indigo-300" />
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom Time Option */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          min="5"
                          max="480"
                          value={customDailyTime}
                          onChange={(e) => setCustomDailyTime(e.target.value)}
                          placeholder="Custom minutes (e.g. 45)"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const val = parseInt(customDailyTime, 10);
                            if (val > 0) handleSelectDailyTime(val);
                          }}
                          disabled={!customDailyTime || loading}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Task Option Confirmation */}
                  {msg.stage === 'manual_tasks' && (
                    <div className="pt-2 space-y-3">
                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300">
                        ✨ Your approved roadmap is ready. Choose an option to proceed:
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          onClick={handleSaveGoalManually}
                          disabled={accepting}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>Save Goal to My Quests 🎯</span>
                        </button>

                        <button
                          onClick={() => navigate('/tasks')}
                          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>Go to Tasks 📋</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] font-mono pt-1 ${
                      isAi ? 'text-slate-500' : 'text-indigo-200/80 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* User Avatar */}
                {!isAi && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Typing / Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-base">
                🧙‍♂️
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2 shadow-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>AI Architect is crafting your roadmap blueprint...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips (when waiting for roadmap feedback) */}
        {currentPlan && !isRoadmapApproved && !loading && (
          <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[11px] text-slate-500 font-semibold shrink-0">Quick feedback:</span>
            {feedbackChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (chip.action === 'approve') {
                    handleApproveRoadmap('Looks good!');
                  } else {
                    handleSendChatFeedback(chip.action);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                  chip.action === 'approve'
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 hover:bg-indigo-950/60 border-slate-800 hover:border-indigo-500/40 text-slate-300'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Controls Footer */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
          {!currentPlan ? (
            /* INITIAL FORM (Fields 1, 2, 3 REMOVED: Skill Level, Daily Time, Days per Week) */
            <form onSubmit={handleInitialGenerate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>What do you want to achieve?</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Core Ambition</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. I want to learn Python..."
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder-slate-500 focus:outline-none resize-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleInitialGenerate();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Quick inspiration chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-500">Try:</span>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(qp)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {qp.slice(0, 28)}...
                  </button>
                ))}
              </div>

              {/* Useful Existing Fields: Category & Optional Target Date (Preserved) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Learning">Learning & Education</option>
                    <option value="Fitness">Fitness & Health</option>
                    <option value="Reading">Reading & Knowledge</option>
                    <option value="Career">Career & Work</option>
                    <option value="Mindfulness">Mindfulness & Mental</option>
                    <option value="Personal">Personal Habit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Roadmap Blueprint</span>
              </button>
            </form>
          ) : (
            /* CONVERSATION INPUT BAR (when roadmap is active) */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatFeedback(chatInputText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={
                  !isRoadmapApproved
                    ? 'Type feedback (e.g. "Add more projects", "Remove APIs", "Looks good")...'
                    : 'Chat with AI Architect...'
                }
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !chatInputText.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
