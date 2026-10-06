// 支付面板：生成 Solana Pay 支付链接与二维码 → 钱包签名上链 → 链上确认 → 展示 TxHash 与 Solscan 存证
import { useEffect, useRef, useState } from 'react'
import { createQR } from '@solana/pay'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  buildTransferTransaction,
  confirmSignature,
  createPaymentIntent,
  solscanTxUrl,
  type PaymentIntent,
} from '../solana/pay'
import type { Product } from '../types'

type Phase = 'preparing' | 'ready' | 'signing' | 'confirming' | 'success' | 'error'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          /* 剪贴板不可用时静默降级 */
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
    >
      {copied ? '已复制 ✓' : '复制'}
    </button>
  )
}

export default function PaySheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [phase, setPhase] = useState<Phase>('preparing')
  const [payUrl, setPayUrl] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [elapsedMs, setElapsedMs] = useState(0)
  const qrHostRef = useRef<HTMLDivElement>(null)
  const intentRef = useRef<PaymentIntent | null>(null)
  const startedAtRef = useRef(0)

  // 商品切换时重新生成一次支付会话（新 reference + 新二维码）
  useEffect(() => {
    if (!product) return
    const intent = createPaymentIntent(product)
    intentRef.current = intent
    setPayUrl(intent.payUrl)
    setSignature('')
    setError('')
    setPhase('preparing')

    if (qrHostRef.current) {
      qrHostRef.current.innerHTML = ''
      const qr = createQR(intent.payUrl, 240, '#ffffff', '#122046')
      qr.append(qrHostRef.current)
    }
    setPhase('ready')
  }, [product])

  if (!product) return null

  async function payWithWallet() {
    const intent = intentRef.current
    if (!product || !intent) return
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError('请先连接 Phantom 钱包，或使用手机 Phantom 扫描二维码支付')
      setPhase('error')
      return
    }
    try {
      setError('')
      setPhase('signing')
      startedAtRef.current = Date.now()
      const tx = await buildTransferTransaction(connection, wallet.publicKey, intent, product)
      const sig = await wallet.sendTransaction(tx, connection)
      setSignature(sig)
      setPhase('confirming')
      await confirmSignature(connection, sig)
      setElapsedMs(Date.now() - startedAtRef.current)
      setPhase('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }

  const shortSig = signature ? `${signature.slice(0, 10)}…${signature.slice(-8)}` : ''

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>

        {phase === 'success' && signature ? (
          /* ---------- 支付成功 · 链上存证 ---------- */
          <div className="success">
            <div className="success-check">✓</div>
            <h2>支付成功！</h2>
            <p className="success-sub">交易已上链，链上凭证永久可溯</p>
            <div className="receipt">
              <div className="receipt-row">
                <span>商品</span>
                <strong>
                  {product.icon} {product.name}
                </strong>
              </div>
              <div className="receipt-row">
                <span>实付金额</span>
                <strong>{product.priceSol} SOL</strong>
              </div>
              <div className="receipt-row">
                <span>上链耗时</span>
                <strong>{(elapsedMs / 1000).toFixed(1)}s</strong>
              </div>
              <div className="receipt-row">
                <span>TxHash</span>
                <span className="mono">{shortSig}</span>
              </div>
            </div>
            <div className="tx-actions">
              <CopyButton text={signature} />
              <a
                className="solscan-link"
                href={solscanTxUrl(signature)}
                target="_blank"
                rel="noreferrer"
              >
                在 Solscan 查看链上凭证 ↗
              </a>
            </div>
            <button className="done-btn" onClick={onClose}>
              完成
            </button>
          </div>
        ) : (
          /* ---------- 支付中 ---------- */
          <div className="pay-flow">
            <div className="sheet-head">
              <span className="sheet-icon">{product.icon}</span>
              <div>
                <h2>{product.name}</h2>
                <p className="sheet-price">
                  {product.priceSol} <span>SOL</span>
                </p>
              </div>
            </div>

            {(phase === 'preparing' || phase === 'ready') && (
              <>
                <div className="pay-qr" ref={qrHostRef} />
                <p className="qr-hint">① 使用 Phantom 钱包扫码，或② 在钱包内打开下方支付链接</p>
                <div className="pay-url">
                  <input readOnly value={payUrl} onFocus={(e) => e.target.select()} />
                  <CopyButton text={payUrl} />
                </div>
                <div className="pay-actions">
                  {wallet.publicKey ? (
                    <button className="primary-btn" onClick={payWithWallet}>
                      在 Phantom 中确认支付
                    </button>
                  ) : (
                    <>
                      <WalletMultiButton className="connect-btn" />
                      <p className="connect-hint">连接钱包后可一键发起支付，或直接扫码支付</p>
                    </>
                  )}
                </div>
              </>
            )}

            {(phase === 'signing' || phase === 'confirming') && (
              <div className="waiting">
                <div className="spinner" />
                <p>{phase === 'signing' ? '等待钱包确认交易…' : '交易已广播，等待链上确认…'}</p>
                {signature && <p className="mono small">{shortSig}</p>}
              </div>
            )}

            {phase === 'error' && (
              <div className="error-box">
                <p className="error-text">{error}</p>
                <div className="pay-actions">
                  <button className="primary-btn" onClick={() => setPhase('ready')}>
                    重试
                  </button>
                  {!wallet.publicKey && <WalletMultiButton className="connect-btn" />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}