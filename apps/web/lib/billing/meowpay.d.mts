// Copied from github.com/Urdemonlord/payments-panel sdk/js (v0.1.0). Update by copying again; do not edit here.
// Types for meowpay.mjs.

export declare const VERSION: string
export type EventName = 'payment.paid' | 'payment.expired' | 'payment.reversed' | 'webhook.test'
export declare const EVENTS: EventName[]

export type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'

export interface Order {
  id: string
  /** Rupiah. What the customer must pay, exactly. */
  amount: number
  status: OrderStatus
  customer_ref: string | null
  created_at: string | number
  expires_at: string | number
  /** Seconds the QR is still payable; 0 once it is not. Poll status rather than trusting this. */
  seconds_left: number
  /** The QRIS payload to render as a QR code (only on the create response). */
  qr_string?: string | null
}

export interface UniqueOrder extends Order {
  /** The list price asked for. */
  base_amount: number
  /** base_amount - amount: 0 normally, 1..maxDiscount (default: 1% of the price, at most 999) when the list price was busy. */
  discount: number
}

export interface WebhookEvent {
  event: EventName
  order_id: string | null
  amount: number | null
  tx_id: string | null
  status: OrderStatus | null
  created_at: string | number | null
}

export declare class MeowPayError extends Error {
  status: number
  code: string | null
  body: Record<string, unknown>
}
export declare class CustomerAlreadyPaying extends MeowPayError {}
export declare class AmountBusy extends MeowPayError {}
export declare class WebhookError extends Error {}

export interface OrderOptions { customerRef?: string; ttlMs?: number }

export declare class MeowPay {
  constructor(opts: { host: string; apiKey: string; fetch?: typeof fetch })
  createOrder(amount: number, opts?: OrderOptions): Promise<Order>
  createOrderUnique(baseAmount: number, opts?: OrderOptions & { maxDiscount?: number; tries?: number }): Promise<UniqueOrder>
  getOrder(id: string): Promise<Order | null>
  listOrders(limit?: number): Promise<Order[]>
  cancelOrder(id: string): Promise<Order | null>
}

/** At most 1% of the price and never more than Rp 999. */
export declare function defaultMaxDiscount(baseAmount: number): number
export declare function sign(rawBody: string | Uint8Array | ArrayBuffer, timestamp: string, secret: string): Promise<string>
export declare function verifyWebhook(
  rawBody: string | Uint8Array | ArrayBuffer,
  timestamp: string | null | undefined,
  signature: string | null | undefined,
  secret: string,
  opts?: { maxAgeMs?: number; nowMs?: number },
): Promise<WebhookEvent>
