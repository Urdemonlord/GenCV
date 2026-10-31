// Copied from github.com/Urdemonlord/payments-panel sdk/js (v0.1.0). Update by copying again; do not edit here.
// MeowPay client for JavaScript: QRIS orders through a MeowPay panel, and its signed webhooks.
//
// One file, no dependencies: fetch + WebCrypto, so it runs on Node 18+, Bun, Deno, Cloudflare Workers
// and Vercel Edge. Copy it into your project (types in meowpay.d.ts) or install from the repo.
//
//   import { MeowPay, verifyWebhook } from './meowpay.mjs'
//   const pay = new MeowPay({ host: 'https://panel.example.com', apiKey: 'mpk_...' })
//   const order = await pay.createOrderUnique(99_000, { customerRef: 'user:42' })
//   // show order.qr_string as a QR code, ask for exactly order.amount
//
//   // webhook route, with the RAW body text:
//   const event = await verifyWebhook(rawBody, req.headers['x-panel-timestamp'], req.headers['x-panel-signature'], SECRET)
//
// Read sdk/README.md for the rules that keep money from being miscredited.

export const VERSION = '0.1.0'
export const EVENTS = ['payment.paid', 'payment.expired', 'payment.reversed', 'webhook.test']
const DEFAULT_TTL_MS = 15 * 60 * 1000
const SIGNATURE_MAX_AGE_MS = 10 * 60 * 1000

export class MeowPayError extends Error {
  constructor(status, body = {}) {
    super(`${status}: ${body.error || 'unknown error'}`)
    this.name = 'MeowPayError'
    this.status = status
    this.code = body.code ?? null
    this.body = body
  }
}

/** 409: this customerRef already has an unpaid order at this amount. Pay or cancel that one first. */
export class CustomerAlreadyPaying extends MeowPayError { constructor(b) { super(409, b); this.name = 'CustomerAlreadyPaying' } }

/** 429: the panel's cap of unpaid orders at this amount is reached (another customer is paying it). */
export class AmountBusy extends MeowPayError { constructor(b) { super(429, b); this.name = 'AmountBusy' } }

async function parse(r) {
  let body = {}
  try { body = await r.json() } catch { /* empty or not JSON */ }
  if (r.status === 200 || r.status === 201) return body
  if (r.status === 409) throw new CustomerAlreadyPaying(body)
  if (r.status === 429) throw new AmountBusy(body)
  throw new MeowPayError(r.status, body)
}

/** At most 1% of the price and never more than Rp 999: Rp 99.000 -> 990, Rp 5.000 -> 50, Rp 1.000 -> 10. */
export function defaultMaxDiscount(base) {
  return Math.min(999, Math.max(1, Math.floor(base / 100)))
}

function randomBelow(n) {
  const a = new Uint32Array(1)
  globalThis.crypto.getRandomValues(a)
  return a[0] % n
}

export class MeowPay {
  /**
   * @param {{host: string, apiKey: string, fetch?: typeof fetch}} opts
   */
  constructor({ host, apiKey, fetch: f } = {}) {
    if (!host || !apiKey) {
      throw new Error('host and apiKey are required (your panel URL, and a key from Integrations > API Keys)')
    }
    this.host = host.replace(/\/+$/, '')
    this.headers = { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }
    this.fetch = f || globalThis.fetch.bind(globalThis)
  }

  /** One order for exactly `amount` rupiah. Throws CustomerAlreadyPaying (409) or AmountBusy (429). */
  async createOrder(amount, { customerRef, ttlMs = DEFAULT_TTL_MS } = {}) {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('amount must be a positive whole number of rupiah')
    const body = { amount }
    if (customerRef != null) body.customer_ref = customerRef
    if (ttlMs != null) body.ttl_ms = ttlMs
    const r = await this.fetch(`${this.host}/api/v1/orders`, { method: 'POST', headers: this.headers, body: JSON.stringify(body) })
    return parse(r)
  }

  /**
   * The list price when nobody else is paying it, otherwise a small random discount so the payment can still be
   * told apart: 1..maxDiscount rupiah, by default at most 1% of the price and never more than Rp 999
   * (defaultMaxDiscount). The customer never pays more than baseAmount. Adds base_amount
   * and discount to the order. Needs the panel's unpaid-orders-per-amount cap at 1 (MAX_PENDING_PER_AMOUNT=1).
   */
  async createOrderUnique(baseAmount, { customerRef, ttlMs = DEFAULT_TTL_MS, maxDiscount = defaultMaxDiscount(baseAmount), tries = 8 } = {}) {
    const tried = new Set()
    let amount = baseAmount
    for (let i = 0; i < tries; i++) {
      tried.add(amount)
      try {
        const order = await this.createOrder(amount, { customerRef, ttlMs })
        return { ...order, base_amount: baseAmount, discount: baseAmount - amount }
      } catch (err) {
        if (!(err instanceof AmountBusy)) throw err
        const options = []
        for (let d = 1; d <= maxDiscount; d++) if (baseAmount - d > 0 && !tried.has(baseAmount - d)) options.push(baseAmount - d)
        if (!options.length) break
        amount = options[randomBelow(options.length)]
      }
    }
    throw new AmountBusy({ error: `no free amount found near Rp ${baseAmount} after ${tries} tries` })
  }

  /** The order, or null if it does not exist (or belongs to another key). */
  async getOrder(id) {
    const r = await this.fetch(`${this.host}/api/v1/orders/${encodeURIComponent(id)}`, { headers: this.headers })
    if (r.status === 404) return null
    return parse(r)
  }

  async listOrders(limit = 50) {
    const r = await this.fetch(`${this.host}/api/v1/orders?limit=${limit}`, { headers: this.headers })
    return (await parse(r)).orders ?? []
  }

  /** Withdraw an unpaid order. null if it was not cancellable (missing, or no longer PENDING). */
  async cancelOrder(id) {
    const r = await this.fetch(`${this.host}/api/v1/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: this.headers })
    if (r.status === 404 || r.status === 409) return null
    return parse(r)
  }
}

// --- webhooks -------------------------------------------------------------------------------------------------

export class WebhookError extends Error {
  constructor(msg) { super(msg); this.name = 'WebhookError' }
}

const enc = new TextEncoder()
const toBytes = (b) => (typeof b === 'string' ? enc.encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b))

/** The panel's signature: hex HMAC-SHA512 of `<timestamp ms>.<raw body>`. Useful in your own tests. */
export async function sign(rawBody, timestamp, secret) {
  const key = await globalThis.crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const body = toBytes(rawBody)
  const prefix = enc.encode(`${timestamp}.`)
  const msg = new Uint8Array(prefix.length + body.length)
  msg.set(prefix)
  msg.set(body, prefix.length)
  const mac = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, msg))
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function equal(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Check a webhook and return its event {event, order_id, amount, tx_id, status, created_at}.
 * rawBody must be the exact body received (string or bytes), before any JSON parsing.
 * Throws WebhookError when the signature is wrong or the delivery is older than maxAgeMs (a replay).
 */
export async function verifyWebhook(rawBody, timestamp, signature, secret, { maxAgeMs = SIGNATURE_MAX_AGE_MS, nowMs = Date.now() } = {}) {
  if (!secret) throw new WebhookError('no webhook secret configured')
  if (!timestamp || !signature || !/^\d+$/.test(String(timestamp))) throw new WebhookError('missing x-panel-timestamp or x-panel-signature')
  if (Math.abs(nowMs - Number(timestamp)) > maxAgeMs) throw new WebhookError('stale delivery (possible replay)')
  if (!equal(await sign(rawBody, String(timestamp), secret), String(signature).trim().toLowerCase())) throw new WebhookError('bad signature')
  let event
  try { event = JSON.parse(typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(toBytes(rawBody))) } catch { throw new WebhookError('body is not JSON') }
  if (!event || typeof event !== 'object' || !event.event) throw new WebhookError('body is not a MeowPay event')
  return event
}
