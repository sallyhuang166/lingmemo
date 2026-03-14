import type { Note } from '../types';

// AI Service - 使用 MiniMax API
// 需要配置 API Key 才能使用

const API_CONFIG = {
  // MiniMax API
  apiKey: localStorage.getItem('ai_api_key') || 'sk-cp-vuo8i46_OyMbB1FFX3Q3PJailt-lkeMpQ3w_sPP4PczvT2gc82rNDn49fl7iESr2vUS2NPW9cdF-kUVUlhEiADE7IT_155Zf074NDu6vlf7NkEzYPV_wcrk',
  baseUrl: 'https://api.minimax.chat/v1',
  model: 'MiniMax-M2.5',
};

export const setApiKey = (key: string) => {
  localStorage.setItem('ai_api_key', key);
  API_CONFIG.apiKey = key;
};

export const hasApiKey = () => !!API_CONFIG.apiKey;

// 生成笔记摘要
export const generateSummary = async (content: string): Promise<string> => {
  if (!API_CONFIG.apiKey) {
    return '请在设置中配置 AI API Key';
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个笔记助手，请用简洁的语言总结以下笔记的主要内容，生成一段50字左右的摘要。',
          },
          {
            role: 'user',
            content: content.slice(0, 2000), // 限制内容长度
          },
        ],
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '生成摘要失败';
  } catch (error) {
    console.error('AI Summary Error:', error);
    return '生成摘要失败，请检查 API Key';
  }
};

// AI 语义搜索
export const semanticSearch = async (query: string, notes: Note[]): Promise<Note[]> => {
  if (!API_CONFIG.apiKey) {
    // 如果没有 API Key，回退到本地搜索
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }

  try {
    const notesContent = notes
      .slice(0, 10) // 限制搜索数量
      .map(n => `标题: ${n.title}\n内容: ${n.content.slice(0, 500)}`)
      .join('\n\n---\n\n');

    const response = await fetch(`${API_CONFIG.baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '根据用户的问题，从以下笔记中找出最相关的笔记。返回笔记的 ID 列表，用逗号分隔。如果都不相关，返回 "none"。',
          },
          {
            role: 'user',
            content: `用户问题: ${query}\n\n笔记列表:\n${notesContent}\n\n相关笔记 ID:`,
          },
        ],
      }),
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    if (result.trim() === 'none') {
      return [];
    }

    // 如果没有返回有效结果，回退到本地搜索
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('AI Search Error:', error);
    // 回退到本地搜索
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }
};
