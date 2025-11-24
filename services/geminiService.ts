
import { GoogleGenAI } from "@google/genai";
import { Goal, Task, AIConfig, JournalEntry, UserStats, CoachMode, CoachContext } from "../types";

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const getAIConfig = (): AIConfig => {
  const savedConfig = localStorage.getItem('unigrow_ai_config');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  const legacyKey = localStorage.getItem('unigrow_api_key') || '';
  return {
    provider: 'gemini',
    apiKey: legacyKey,
    baseUrl: '',
    modelName: DEFAULT_GEMINI_MODEL
  };
};

const callGenericAI = async (
  config: AIConfig, 
  messages: { role: string, content: string }[], 
  jsonMode: boolean = false
): Promise<string | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    const body: any = {
      model: config.modelName || 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      stream: false
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Generic AI Call Failed:", error);
    return null;
  }
};

const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return str.replace(/```json\n?|```/g, "").trim();
};

const FALLBACK_QUOTES = [
  { text: "生活不是等待风暴过去，而是学会在雨中跳舞。", author: "Vivian Greene" },
  { text: "种一棵树最好的时间是十年前，其次是现在。", author: "Dambisa Moyo" },
  { text: "伟大的作品不是靠力量，而是靠坚持来完成的。", author: "Samuel Johnson" },
  { text: "未经审视的人生不值得度过。", author: "苏格拉底" },
  { text: "星光不问赶路人，时光不负有心人。", author: "大冰" },
  { text: "你的负担将变成礼物，你受的苦将照亮你的路。", author: "泰戈尔" },
  { text: "世界上只有一种英雄主义，就是看清生活的真相之后依然热爱生活。", author: "罗曼·罗兰" },
  { text: "万物皆有裂痕，那是光照进来的地方。", author: "莱昂纳德·科恩" },
  { text: "知足且上进，温柔而坚定。", author: "网络" },
  { text: "现在的努力，是为了以后有更多的选择。", author: "网络" },
  { text: "路虽远，行则将至；事虽难，做则必成。", author: "荀子" },
  { text: "不要让未来的你，讨厌现在的自己。", author: "网络" },
  { text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采" },
  { text: "你若盛开，蝴蝶自来。", author: "网络" },
  { text: "悲观者称半杯水为空，乐观者称半杯水为满，而实干者去倒水。", author: "网络" },
  { text: "凡是过往，皆为序章。", author: "莎士比亚" },
  { text: "虽然辛苦，我还是会选择那种滚烫的人生。", author: "北野武" },
  { text: "你要悄悄拔尖，然后惊艳所有人。", author: "网络" },
  { text: "追光的人，终会光芒万丈。", author: "网络" },
  { text: "人生没有白走的路，每一步都算数。", author: "李宗盛" }
];

const FALLBACK_PROMPTS = [
    "今天发生的最让你感激的小事是什么？",
    "如果今天可以重来，你会做什么不同的选择？",
    "描述一下你此刻的能量状态。",
    "此时此刻，你最想对谁说一声谢谢？",
    "最近有什么事情让你感到焦虑？试着写下来。",
    "如果明天是世界末日，你今天最想做什么？",
    "你最近学到的一个重要道理是什么？",
    "今天为了目标，你迈出了哪一小步？",
    "描述一个让你感到宁静的瞬间。",
    "你对自己最近的表现满意吗？为什么？"
];

const getRandomFallbackQuote = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[randomIndex];
};

export const generateDailyQuote = async (goals: Goal[]): Promise<{ text: string; author: string } | null> => {
  const config = getAIConfig();
  if (config.provider !== 'gemini' && !config.apiKey) return getRandomFallbackQuote();

  const goalContext = goals.map(g => g.title).join(', ');
  const date = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });

  const prompt = `
    今天是${date}。用户当前人生目标：${goalContext || "寻找方向"}。
    请生成一句简短、温暖且富有哲理的中文金句（20字以内）。
    请务必结合今日的节气、节日或星期几的氛围。
    输出JSON格式: { "text": "内容", "author": "作者" }
  `;

  try {
    let resultText = "";
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY;
      if (!apiKey) return getRandomFallbackQuote();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.modelName || DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      resultText = response.text || "{}";
    } else {
      const responseText = await callGenericAI(config, [{ role: 'user', content: prompt }], true);
      resultText = responseText || "{}";
    }
    return JSON.parse(cleanJsonString(resultText));
  } catch (error) {
    return getRandomFallbackQuote();
  }
};

export const generateGoalPlan = async (goalTitle: string): Promise<{ description: string; milestones: string[] } | null> => {
  const config = getAIConfig();
  if (config.provider !== 'gemini' && !config.apiKey) return null;

  const prompt = `
    人生目标："${goalTitle}"。
    请提供一句鼓舞人心的简短描述，并拆解为5个可执行的起步步骤。
    JSON格式: { "description": "...", "milestones": ["...", ...] }
  `;

  try {
    let resultText = "";
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY;
      if (!apiKey) return null;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.modelName || DEFAULT_GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      resultText = response.text || "{}";
    } else {
      const responseText = await callGenericAI(config, [{ role: 'user', content: prompt }], true);
      resultText = responseText || "{}";
    }
    return JSON.parse(cleanJsonString(resultText));
  } catch (error) {
    console.error("Goal Plan Gen Error:", error);
    return null;
  }
};

export const getCoachAdvice = async (message: string, context: CoachContext, mode: CoachMode = 'empathetic'): Promise<string> => {
  const config = getAIConfig();
  if (config.provider !== 'gemini' && !config.apiKey) return "请先在设置中配置 API Key 以激活智能教练。";

  const goalSummary = context.goals.map(g => `- ${g.title} (进度: ${g.progress}%)`).join('\n');
  const taskSummary = `今日任务: ${context.tasks.filter(t => !t.completed).length} 个未完成`;
  const recentMood = context.journalEntries.length > 0 ? context.journalEntries[0].mood : '未知';
  const lifeVision = context.userStats.lifeVision || "用户暂未定义人生愿景";

  let personaInstruction = "";
  if (mode === 'strict') {
      personaInstruction = "你的名字叫'斯巴达'。你是严厉的、直接的。不要说客套话，直接指出用户的借口，用强硬的语气鞭策用户行动。";
  } else if (mode === 'strategic') {
      personaInstruction = "你的名字叫'军师'。你是理性的、逻辑缜密的。多用SWOT分析、第一性原理。只讲方法论，不谈情绪。";
  } else {
      personaInstruction = "你的名字叫'大白'。你是温暖的、治愈的。多倾听，多共情，像一个老朋友一样安慰和鼓励用户。";
  }

  const systemContent = `
    ${personaInstruction}
    
    【用户核心愿景】
    "${lifeVision}"

    【当前状态】
    - 等级: Lv.${context.userStats.level}
    - 专注: ${context.focusMinutes}分钟
    - 心情: ${recentMood}
    - 目标: \n${goalSummary}
    - 任务: ${taskSummary}

    【核心指令】
    请根据用户的【核心愿景】和当前状态提供建议。你的所有建议都应该服务于帮助用户成为"${lifeVision}"里描述的人。
    1. 简单对话/咨询 -> 直接回复文本。
    2. 需要"短期/今日"的行动清单 -> 输出JSON "taskPlan"。
    3. 需要"长期/阶段性"的项目规划（如学游泳、考研） -> 输出JSON "goalPlan"。

    JSON格式示例 (必须包含在 markdown 代码块 \`\`\`json ... \`\`\` 中):
    
    A. 针对短期任务清单 (Task Plan):
    {
      "taskPlan": {
        "title": "今日冲刺计划",
        "items": [
          { "title": "做一套数学卷子", "priority": "high", "difficulty": "hard" },
          { "title": "整理错题本", "priority": "medium", "difficulty": "medium" }
        ]
      }
    }

    B. 针对长期目标规划 (Goal Plan):
    {
      "goalPlan": {
        "title": "学会游泳",
        "description": "掌握一项生存技能，享受水中自由。",
        "category": "skill", 
        "difficulty": "medium",
        "milestones": ["适应水性与呼吸", "学习漂浮与蹬腿", "练习划水动作", "尝试完整配合游10米", "挑战连续游50米"]
      }
    }
  `;

  try {
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY;
      if (!apiKey) return "请检查 API Key 配置。";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.modelName || DEFAULT_GEMINI_MODEL,
        contents: message,
        config: { systemInstruction: systemContent }
      });
      return response.text || "思考中...";
    } else {
      const messages = [{ role: 'system', content: systemContent }, { role: 'user', content: message }];
      return await callGenericAI(config, messages) || "服务无响应";
    }
  } catch (error) {
    return "连接失败，请检查配置。";
  }
};

export const analyzeJournalEntry = async (content: string, mood: string, tags: string[] = []): Promise<string> => {
  const config = getAIConfig();
  if (config.provider !== 'gemini' && !config.apiKey) return "配置 API Key 获取 AI 深度反馈。";

  const prompt = `
    用户刚刚写了一篇日记。
    心情: ${mood}
    标签: ${tags.join(', ') || '无'}
    内容: "${content}"
    
    请作为一位心理咨询师，给出一句温暖、共情且治愈的反馈（50字以内）。
    如果心情负面，请侧重安抚；如果正面，请侧重鼓励。
  `;

  try {
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY;
      if (!apiKey) return "";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.modelName || DEFAULT_GEMINI_MODEL,
        contents: prompt,
      });
      return response.text || "";
    } else {
      return await callGenericAI(config, [{ role: 'user', content: prompt }]) || "";
    }
  } catch (error) {
    return "";
  }
};

export const generateJournalPrompt = async (context: CoachContext, currentMood?: string): Promise<string> => {
    const config = getAIConfig();
    
    if (config.provider !== 'gemini' && !config.apiKey) {
        return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    }

    const goalSummary = context.goals.slice(0, 3).map(g => g.title).join('、');
    const lifeVision = context.userStats.lifeVision || "寻找更好的自己";

    const prompt = `
      请根据用户当前状态，生成一个直击人心、用于日记反思的"灵感胶囊"问题。
      
      【用户愿景】
      "${lifeVision}"
      
      【用户状态】
      - 心情: ${currentMood || '未知'}
      - 专注时长: ${context.focusMinutes}分钟
      - 近期目标: ${goalSummary || '暂无'}
      
      【生成策略】
      - 结合用户的愿景进行提问：例如"今天的行动是否让你离'${lifeVision}'更近了一步？"
      - 如果心情焦虑/任务多 -> 问如何化解压力。
      - 如果专注时间长 -> 问心流体验。
      
      要求：
      1. 问题要简短（30字以内）。
      2. 语气温暖、像朋友一样。
      3. 直接输出问题文本，不要加引号。
    `;

    try {
        let resultText = "";
        if (config.provider === 'gemini') {
            const apiKey = config.apiKey || process.env.API_KEY;
            if (!apiKey) return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: config.modelName || DEFAULT_GEMINI_MODEL,
                contents: prompt,
            });
            resultText = response.text?.trim() || "";
        } else {
            resultText = await callGenericAI(config, [{ role: 'user', content: prompt }]) || "";
        }
        return resultText || FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    } catch (error) {
        return FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
    }
};
