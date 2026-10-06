// 本地智能匹配引擎：零依赖、零密钥、零网络，为路演提供 100% 稳定的 AI 导购理解能力。
// 采用中英文关键词 + 标签加权重评分的轻量语义匹配，支持意图识别（问候/推荐/询价/购物）。

import type { Product } from '../types'
import catalog from '../data/catalog.json'

const PRODUCTS = catalog as Product[]

export interface LocalIntent {
  kind: 'greeting' | 'recommend' | 'price' | 'buy'
  matchedProducts: Product[]
}

const GREETING_RE = /^(你好|您好|嗨|哈喽|嗨喽|hello|hi|hey|在吗|在么|在不在)/i
const PRICE_WORDS = ['多少钱', '什么价', '价格', '多钱', '几钱', '贵不贵', 'how much', '多少sol', '多少 sol']
const RECOMMEND_WORDS = ['推荐', '有什么', '看看', '随便', '介绍', '都有什么', '大全', '列表', 'show', '挑一个', '来点']

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // 保留中英文与数字，去标点/emoji
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreProduct(p: Product, text: string): number {
  let score = 0
  for (const tag of p.tags) {
    const nt = normalize(tag)
    if (nt.length === 0) continue
    if (text.includes(nt)) {
      score += nt.length * 3 // 命中标签，按标签长度加权
      if (nt.length >= 4) score += 3 // 长关键词更精准
    }
  }
  const nameHead = normalize(p.name).slice(0, 4)
  if (nameHead.length >= 2 && text.includes(nameHead)) score += 8
  return score
}

/** 商品推荐（未匹配到时的兜底精选） */
export function hotProducts(): Product[] {
  return PRODUCTS.slice(0, 3)
}

export function analyze(rawText: string): LocalIntent {
  const text = normalize(rawText)
  if (text.length === 0) return { kind: 'greeting', matchedProducts: [] }

  if (GREETING_RE.test(text) && text.length <= 10) {
    return { kind: 'greeting', matchedProducts: [] }
  }

  const scored = PRODUCTS.map((p) => ({ p, s: scoreProduct(p, text) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
  const matched = scored.slice(0, 3).map((x) => x.p)

  const wantsPrice = PRICE_WORDS.some((w) => text.includes(w))
  const wantsRecommend = RECOMMEND_WORDS.some((w) => text.includes(w))

  if (wantsPrice) return { kind: 'price', matchedProducts: matched }
  if (matched.length > 0) return { kind: 'buy', matchedProducts: matched }
  if (wantsRecommend) return { kind: 'recommend', matchedProducts: [] }
  return { kind: 'buy', matchedProducts: [] }
}