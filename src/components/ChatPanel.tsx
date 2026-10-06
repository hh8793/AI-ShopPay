// AI 导购对话面板：聊天式交互 + 商品推荐结果 + 一键支付入口
import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Product } from '../types'
import { getShopAnswer } from '../engine/shopAssistant'
import { LLM_ENABLED } from '../config'

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: '你好！我是 AI ShopPay 导购助手 🛍️ 用一句话告诉我你想买什么，我会自动匹配商品并生成 Solana Pay 支付。比如：「我想买一张数字 NFT 会员卡」。',
  engine: 'local',
}

const SUGGESTIONS = [
  '我想买一张数字 NFT 会员卡',
  '来一杯咖啡',
  '有什么推荐的吗？',
  '支持一下创作者',
]

function EngineBadge({ engine }: { engine?: 'llm' | 'local' }) {
  if (!engine) return null
  return (
    <span className={`engine-badge ${engine}`}>
      {engine === 'llm' ? 'AI LLM 引擎' : '本地智能引擎'}
    </span>
  )
}

export default function ChatPanel({ onBuy }: { onBuy: (p: Product) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setMessages((m) => [...m, { id: `m${++idRef.current}`, role: 'user', text: t }])
    setBusy(true)
    try {
      const result = await getShopAnswer(t, messages)
      setMessages((m) => [
        ...m,
        { id: `m${++idRef.current}`, role: 'assistant', text: result.reply, engine: result.engine, products: result.products },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `m${++idRef.current}`,
          role: 'assistant',
          text: '抱歉，刚才我走神了，换个说法再试试？比如「来一杯咖啡」或「帮我推荐一下」。',
          engine: 'local',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat">
      <div className="panel-head">
        <div>
          <h2>AI 导购</h2>
          <p className="panel-sub">
            {LLM_ENABLED ? '已接入大模型引擎，支持复杂意图理解' : '本地智能引擎运行中 · 路演零故障'}
          </p>
        </div>
        {LLM_ENABLED && <span className="dot-online" title="LLM 已启用" />}
      </div>

      <div className="messages" ref={listRef}>
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="msg user">
              <div className="bubble">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="msg ai">
              <div className="bubble">
                <EngineBadge engine={m.engine} />
                <p>{m.text}</p>
                {m.products && m.products.length > 0 && (
                  <div className="mini-products">
                    {m.products.map((p) => (
                      <div key={p.id} className="mini-card">
                        <span className="mini-icon">{p.icon}</span>
                        <div className="mini-info">
                          <strong>{p.name}</strong>
                          <span>{p.priceSol} SOL</span>
                        </div>
                        <button className="mini-buy" onClick={() => onBuy(p)}>
                          购买
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="msg ai">
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="input-row">
        <input
          value={input}
          placeholder="输入你想买的东西，比如：请创作者喝咖啡"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="send-btn" onClick={() => send(input)} disabled={busy || !input.trim()}>
          发送
        </button>
      </div>
    </div>
  )
}