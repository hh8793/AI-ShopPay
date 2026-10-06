// LLM 导购客户端：支持 OpenAI 兼容端点（GPT / DeepSeek / 各类网关）与 Anthropic Messages API。
// 前端直连仅面向 MVP 路演；生产环境应收敛到服务端代理。

import { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_PROVIDER } from '../config'
import type { ChatMessage, Product } from '../types'

export interface LlmOutcome {
  reply: string
  productIds: string[]
}

const LLM_TIMEOUT_MS = 12000

function buildSystemPrompt(catalog: Product[]): string {
  const inventory = catalog.map((p) => ({
    id: p.id,
    name: p.name,
    priceSol: p.priceSol,
    description: p.description,
  }))
  return [
    '你是「AI ShopPay on Solana」的 AI 导购助手，帮助用户通过自然语言在 Solana 上完成购物。',
    '规则：只能从下方商品库中选择商品，禁止编造不存在的商品或价格；',
    '如用户表达模糊，联系上下文给出最可能的 1-3 个推荐；',
    '始终只输出一个 JSON 对象，不要输出任何解释性文字：',
    '{"reply": "给用户的中文回复，简洁友好，推荐商品时说明价格与理由", "productIds": ["匹配的商品 id 数组，最多 3 个；无匹配则为空数组"]}',
    '商品库 JSON：' + JSON.stringify(inventory),
  ].join('\n')
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM 返回内容无法解析为 JSON')
  }
  return JSON.parse(text.slice(start, end + 1))
}

async function callOpenAICompat(
  userText: string,
  history: ChatMessage[],
  systemPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(`${LLM_BASE_URL.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: userText },
      ],
    }),
    signal,
  })
  if (!res.ok) throw new Error(`LLM API 请求失败 HTTP ${res.status}`)
  const data = await res.json()
  const content: unknown = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('LLM 返回缺少 choices[0].message.content')
  }
  return content
}

async function callAnthropic(
  userText: string,
  history: ChatMessage[],
  systemPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: userText },
      ],
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Anthropic API 请求失败 HTTP ${res.status}`)
  const data = await res.json()
  const block = (data?.content ?? []).find((b: { type?: string }) => b?.type === 'text')
  if (typeof block?.text !== 'string' || block.text.length === 0) {
    throw new Error('Anthropic 返回缺少文本内容')
  }
  return block.text as string
}

/** 调用 LLM 完成一次导购理解；任何失败均抛出异常，由上层降级到本地引擎 */
export async function runLLM(
  userText: string,
  history: ChatMessage[],
  catalog: Product[],
): Promise<LlmOutcome> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)
  try {
    const systemPrompt = buildSystemPrompt(catalog)
    const raw =
      LLM_PROVIDER === 'anthropic'
        ? await callAnthropic(userText, history, systemPrompt, controller.signal)
        : await callOpenAICompat(userText, history, systemPrompt, controller.signal)

    const parsed = extractJson(raw) as { reply?: unknown; productIds?: unknown }
    if (typeof parsed.reply !== 'string' || parsed.reply.length === 0) {
      throw new Error('LLM 返回结构不符合约定')
    }
    if (!Array.isArray(parsed.productIds)) {
      throw new Error('LLM 返回缺少 productIds')
    }
    const validIds = new Set(catalog.map((p) => p.id))
    const productIds = (parsed.productIds as unknown[])
      .filter((id): id is string => typeof id === 'string' && validIds.has(id))
      .slice(0, 3)
    return { reply: parsed.reply, productIds }
  } finally {
    clearTimeout(timer)
  }
}