// AI Service with Chain of Responsibility (Auto-Fallback)

const SYSTEM_PROMPT = `
You are an expert educational content generator for autistic children.
Your task is to generate multiple-choice questions based on a Topic or provided Context.
CRITICAL: Every question MUST include a "visualKeyword" that describes a simple, clear image to accompany the question.

Output Format: JSON Array ONLY.
Structure:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "visualKeyword": "simple cat cartoon" 
  }
]
`;

const fetchImageForKeyword = (keyword) => {
    // Pollinations.ai for generated AI images
    const k = encodeURIComponent(keyword + " cartoon style, cute, colorful, clear lines, autism friendly");
    return `https://image.pollinations.ai/prompt/${k}?width=400&height=300&nologo=true`;
};

// --- Providers ---

const PROVIDERS = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        envKey: 'VITE_GEMINI_API_KEY',
        call: async (prompt, apiKey) => {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + prompt }] }]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.candidates[0].content.parts[0].text;
        }
    },
    {
        id: 'openai',
        name: 'OpenAI',
        envKey: 'VITE_OPENAI_API_KEY',
        call: async (prompt, apiKey) => {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        }
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        envKey: 'VITE_DEEPSEEK_API_KEY',
        call: async (prompt, apiKey) => {
            const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        }
    },
    {
        id: 'grok',
        name: 'Grok',
        envKey: 'VITE_GROK_API_KEY',
        call: async (prompt, apiKey) => {
            const response = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        }
    }
];

export const generateQuizContent = async (params) => {
    const { topic, context, grade, count } = params;

    let userPrompt = `Generate ${count} multiple choice questions for a ${grade} grade level student.`;
    if (context) {
        userPrompt += `\n\nBase the questions ONLY on this context:\n${context}`;
    } else {
        userPrompt += `\n\nTopic: ${topic}`;
    }
    userPrompt += `\n\nEnsure questions are suitable for autistic children (clear language, no metaphors).`;

    let errors = [];

    // Auto-Fallback Loop
    for (const provider of PROVIDERS) {
        const key = import.meta.env[provider.envKey];
        if (!key) {
            console.warn(`Skipping ${provider.name}: No API Key in .env`);
            continue;
        }

        console.log(`Attempting generation with ${provider.name}...`);

        try {
            const rawText = await provider.call(userPrompt, key);

            // Clean JSON
            const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonString);

            // Success! Enhance with Images and return
            return parsed.map((q, i) => ({
                id: Date.now() + i,
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                imageUrl: fetchImageForKeyword(q.visualKeyword || topic || "learning")
            }));

        } catch (err) {
            console.error(`${provider.name} failed:`, err);
            errors.push(`${provider.name}: ${err.message}`);
            // Continue to next provider
        }
    }

    throw new Error(`All AI providers failed. Check your .env keys.\nErrors: ${errors.join(', ')}`);
};
