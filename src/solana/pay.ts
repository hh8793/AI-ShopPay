// Solana Pay 支付工具链：
// 1) createPaymentIntent —— 编码标准 solana: 支付 URL（官方 Solana Pay 协议，含 recipient/amount/reference/label/message/memo）
// 2) buildTransferTransaction —— 构建链上转账交易（标准系统转账指令，无自定义合约）
// 3) confirmSignature —— 轮询链上确认状态
// 4) solscanTxUrl —— 生成 Solscan 链上溯源凭证链接

import { encodeURL, type Recipient, type References } from '@solana/pay'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { Product } from '../types'
import { MERCHANT_ADDRESS } from '../config'

export interface PaymentIntent {
  payUrl: string
  reference: PublicKey
  recipient: PublicKey
}

/** 生成一次支付会话：标准 Solana Pay URL + 随机 reference（用于商户侧识别这笔付款） */
export function createPaymentIntent(product: Product): PaymentIntent {
  const recipient = new PublicKey(MERCHANT_ADDRESS)
  const reference = Keypair.generate().publicKey
  const url = encodeURL({
    recipient: recipient.toBase58() as Recipient,
    amount: product.priceLamports,
    reference: reference.toBase58() as References,
    label: 'AI ShopPay Demo Store',
    message: `购买 ${product.name}（${product.priceSol} SOL）`,
    memo: `ai-shoppay:${product.id}`,
  })
  return { payUrl: url.toString(), reference, recipient }
}

/** 构建标准 SOL 转账交易（Solana Pay 规范等价指令集），由钱包签名后广播 */
export async function buildTransferTransaction(
  connection: Connection,
  sender: PublicKey,
  intent: PaymentIntent,
  product: Product,
): Promise<Transaction> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: sender, recentBlockhash: blockhash })
  tx.add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: intent.recipient,
      lamports: product.priceLamports,
    }),
  )
  return tx
}

export const CONFIRM_TIMEOUT_MS = 45000

/** 轮询等待交易上链（confirmed 即可展示凭证；超时给出可追溯的引导提示） */
export async function confirmSignature(
  connection: Connection,
  signature: string,
  timeoutMs = CONFIRM_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const response = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      })
      const status = response?.value
      if (status) {
        if (status.err) {
          throw new Error(`链上交易失败: ${JSON.stringify(status.err)}`)
        }
        const level = status.confirmationStatus
        if (level === 'confirmed' || level === 'finalized' || status.slot > 0) {
          return
        }
      }
    } catch (e) {
      lastErr = e
      if (e instanceof Error && e.message.includes('链上交易失败')) throw e
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  if (lastErr) console.warn('[AI ShopPay] 确认轮询最后错误:', lastErr)
  throw new Error(
    `等待链上确认超时（${Math.round(timeoutMs / 1000)}s），可稍后在钱包或 Solscan 中查看交易状态`,
  )
}

/** Solscan Devnet 链上溯源凭证 */
export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=devnet`
}