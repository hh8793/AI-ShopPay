// 导购编排层：统一入口 getShopAnswer。
// 降级策略（保证路演 100% 成功）：配置了 LLM 密钥 → 优先调用 LLM；
// LLM 任何异常（超时/限流/网络/解析失败）→ 自动回退本地智能匹配引擎，全程无感。

import type { ChatMessage, ChatResult, Product } from '../types'
import catalog from '../data/catalog.json'
import { LLM_ENABLED } from '../config'
import { runLLM } from './llmClient'
import { analyze, hotProducts, type LocalIntent } from './localMatcher'

const PRODUCTS = catalog as Product[]

function formatList(products: Product[]): string {
  return products.map((p) => `${p.icon} ${p.name}（${p.priceSol} SOL）`).join('、')
}

function localReply(intent: LocalIntent, text: string): string {
  switch (intent.kind) {
    case 'greeting':
      return '你好呀！我是 AI ShopPay 导购助手。直接告诉我你想买什么，比如「来一杯咖啡」「想入创作者会员」，也可以让我「推荐一下」。'
    case 'recommend':
      return '好的，为你精选了以下人气商品，点击卡片即可一键生成 Solana Pay 支付二维码：'
    case 'price': {
      const hit = intent.matchedProducts[0]
      if (hit) {
        return `「${hit.name}」售价 ${hit.priceSol} SOL，链上确认支付后立刻获得凭证。要帮你下单吗？`
      }
      return '这几件商品的参考价格如下，点击即可查看详情：'
    }
    case 'buy':
    default: {
      const hit = intent.matchedProducts[0]
      if (hit && intent.matchedProducts.length === 1) {
        return `为你找到「${hit.name}」：${hit.description} 价格 ${hit.priceSol} SOL。点击下方卡片即可完成购买 🛒`
      }
      if (hit && intent.matchedProducts.length > 1) {
        return `为你找到 ${intent.matchedProducts.length} 件符合要求的商品：${formatList(intent.matchedProducts)}，点击卡片即可支付。`
      }
      return '商品库里暂时没有完全匹配的商品，不过这些也很受欢迎，看看有没有你喜欢的？'
    }
  }
}

export function localAnswer(text: string): ChatResult {
  const intent = analyze(text)
  const reply = localReply(intent, text)
  let products: Product[]
  switch (intent.kind) {
    case 'greeting':
      products = []
      break
    case 'recommend':
      products = hotProducts()
      break
    case 'price':
    case 'buy':
    default:
      products = intent.matchedProducts.length > 0 ? intent.matchedProducts : hotProducts()
      break
  }
  return { reply, products, engine: 'local' }
}

/** 统一导购入口：LLM 优先，异常自动降级本地引擎 */
export async function getShopAnswer(text: string, history: ChatMessage[]): Promise<ChatResult> {
  if (LLM_ENABLED) {
    try {
      const outcome = await runLLM(text, history, PRODUCTS)
      const products = PRODUCTS.filter((p) => outcome.productIds.includes(p.id))
      return { reply: outcome.reply, products, engine: 'llm' }
    } catch (err) {
      console.warn('[AI ShopPay] LLM 调用失败，已自动降级到本地智能匹配引擎:', err)
    }
  }
  return localAnswer(text)
}