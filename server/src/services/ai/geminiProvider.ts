import { AIProvider, StructuredPlanOutput, DailySuggestionsOutput } from './aiProvider.interface.js';
import { HeuristicAIProvider } from './heuristicProvider.js';
import { env } from '../../config/env.js';

export class GeminiAIProvider implements AIProvider {
  name = 'Google Gemini 2.5 Flash';
  private fallback = new HeuristicAIProvider();

  async generateRoadmap(input: any): Promise<StructuredPlanOutput> {
    if (!env.AI_API_KEY) {
      // Graceful fallback to heuristic architect
      return await this.fallback.generateRoadmap(input);
    }

    try {
      const url = `${env.AI_BASE_URL}/models/${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`;
      const systemInstruction = `You are the LifeQuest AI Goal Architect.
You transform user goals into structured, actionable RPG-style roadmaps with milestones and concrete daily tasks.
IMPORTANT FORMATTING & QUALITY RULES:
1. Explain each roadmap milestone topic in SIMPLE, beginner-friendly bullet points.
2. In each milestone description, provide 2 to 4 simple bullet points starting with "- " explaining what to do in clear language.
3. Avoid giant paragraphs and unnecessary jargon. Keep roadmap topics clearly separated.
4. If guidance notes request changes (e.g. "remove APIs", "add more projects", "make it easier"), adapt the roadmap accordingly without restarting.
5. When availableTimePerDay is provided, generate realistic day-by-day tasks (e.g. Day 1: ..., Day 2: ...) matching the user's daily time limit.
You MUST output valid JSON matching this schema:
{
  "goalTitle": string,
  "category": "Fitness" | "Learning" | "Reading" | "Health" | "Mindfulness" | "Work" | "Career" | "Personal",
  "summary": string,
  "estimatedDuration": string,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "milestones": [
    { "id": string, "title": string, "description": string, "order": number, "targetDate": string }
  ],
  "tasks": [
    {
      "id": string,
      "milestoneId": string,
      "title": string,
      "description": string,
      "category": string,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "estimatedMinutes": number,
      "isRecurring": boolean,
      "recurrenceType": "NONE" | "DAILY" | "WEEKLY" | "SELECTED_DAYS",
      "recurrenceDays": number[],
      "suggestedDate": string
    }
  ],
  "recommendations": string[]
}`;

      const prompt = `User Goal: "${input.prompt}"
Category: ${input.category || 'auto-detect'}
Target Date: ${input.targetDate || 'auto-schedule'}
Skill Level: ${input.skillLevel || 'Beginner'}
Available Time Per Day: ${input.availableTimePerDay || 60} minutes
Days Per Week: ${input.daysPerWeek || 5}
Guidance / Modification notes: ${input.guidanceNotes || 'none'}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`Gemini API returned status ${response.status}. Falling back to heuristic architect.`);
        return await this.fallback.generateRoadmap(input);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return await this.fallback.generateRoadmap(input);
      }

      const parsed = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.warn('Gemini generation encountered error/timeout. Falling back to heuristic architect.', err);
      return await this.fallback.generateRoadmap(input);
    }
  }

  async generateDailySuggestions(context: any): Promise<DailySuggestionsOutput> {
    if (!env.AI_API_KEY) {
      return await this.fallback.generateDailySuggestions(context);
    }

    try {
      const url = `${env.AI_BASE_URL}/models/${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const prompt = `Analyze this user's current LifeQuest state and return 3 high-impact actionable suggestions for today.
Context:
User: ${context.userName}, Level: ${context.level}, Streak: ${context.streak} days
Today's Date: ${context.todayDate}
Today's Tasks: ${JSON.stringify(context.todayTasks)}
Active Goals: ${JSON.stringify(context.activeGoals)}

Return valid JSON in this schema:
{
  "greeting": string,
  "focusTheme": string,
  "suggestions": [
    {
      "id": string,
      "title": string,
      "reason": string,
      "category": string,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "estimatedMinutes": number,
      "relatedGoalTitle": string | null
    }
  ],
  "motivationalQuote": string
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return await this.fallback.generateDailySuggestions(context);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? JSON.parse(text) : await this.fallback.generateDailySuggestions(context);
    } catch {
      return await this.fallback.generateDailySuggestions(context);
    }
  }
}
