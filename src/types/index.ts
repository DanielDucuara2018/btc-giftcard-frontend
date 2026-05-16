// ============================================================================
// Card types
// ============================================================================

export type CardStatus = 'created' | 'funding' | 'active' | 'redeemed' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type FiatCurrency = 'EUR' | 'USD';
export type RedeemMethod = 'lightning';

export interface Card {
    id: string;
    code: string;
    status: CardStatus;
    payment_status: PaymentStatus;
    btc_amount_sats: number;
    fiat_amount_cents: number;
    fiat_currency: FiatCurrency;
    purchase_email: string;
    owner_email: string;
    payment_method: string;
    stripe_checkout_url?: string;
    sepa_reference?: string;
    service_fee_cents: number;
    processor_fee_cents: number;
    total_fee_cents: number;
    btc_price_eur_cents: number;
    created_at: string;
    funded_at?: string;
    redeemed_at?: string;
    payment_expires_at?: string;
}

// ============================================================================
// Purchase / create card types
// ============================================================================

export interface OrderItem {
    fiat_amount_cents: number;
    quantity: number;
}

export interface CreateCardRequest {
    items: OrderItem[];
    fiat_currency: FiatCurrency;
    purchase_email: string;
    user_id?: string;
}

export interface CreatedCard {
    card_id: string;
    code: string;
}

export interface CreateCardResponse {
    cards: CreatedCard[];
    checkout_url: string;
    session_id: string;
    expires_at: string;
}

// ============================================================================
// Redeem types
// ============================================================================

export interface RedeemCardRequest {
    method: RedeemMethod;
    amount_sats: number;
    invoice: string;
}

export interface RedeemCardResponse {
    transaction_id: string;
    method: string;
    tx_hash?: string;
    payment_hash?: string;
    btc_amount_sats: number;
    remaining_balance_sats: number;
    status: string;
}

// ============================================================================
// Balance types
// ============================================================================

export interface CardBalance {
    btc_amount_sats: number;
    btc_amount: string;
}

export interface CardValidation {
    valid: boolean;
    status: CardStatus | '';
}

export interface TreasuryBalance {
    available_sats: number;
    available_btc: string;
}

// ============================================================================
// App state types
// ============================================================================

export interface PurchaseOrderItem {
    fiat_amount_cents: number;
    quantity: number;
    label: string;
}

export interface AppState {
    purchaseOrder: PurchaseOrderItem[];
    fiatCurrency: FiatCurrency;
    purchaseEmail: string;
    lastPurchase: CreateCardResponse | null;
    cardLookup: Card | null;
    cardBalance: CardBalance | null;
    redeemResult: RedeemCardResponse | null;
    error: string | null;
    loading: boolean;
}
