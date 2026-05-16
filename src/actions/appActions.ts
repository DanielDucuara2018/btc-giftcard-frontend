import {
    PurchaseOrderItem,
    FiatCurrency,
    CreateCardResponse,
    Card,
    CardBalance,
    RedeemCardResponse,
} from '../types';

// ============================================================================
// Action type constants
// ============================================================================

export const SET_ORDER_ITEM = 'SET_ORDER_ITEM';
export const REMOVE_ORDER_ITEM = 'REMOVE_ORDER_ITEM';
export const CLEAR_ORDER = 'CLEAR_ORDER';
export const SET_FIAT_CURRENCY = 'SET_FIAT_CURRENCY';
export const SET_PURCHASE_EMAIL = 'SET_PURCHASE_EMAIL';
export const SET_LAST_PURCHASE = 'SET_LAST_PURCHASE';
export const SET_CARD_LOOKUP = 'SET_CARD_LOOKUP';
export const SET_CARD_BALANCE = 'SET_CARD_BALANCE';
export const SET_REDEEM_RESULT = 'SET_REDEEM_RESULT';
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const SET_LOADING = 'SET_LOADING';

// ============================================================================
// Action creators
// ============================================================================

export const setOrderItem = (item: PurchaseOrderItem) => ({
    type: SET_ORDER_ITEM as typeof SET_ORDER_ITEM,
    payload: item,
});

export const removeOrderItem = (fiatAmountCents: number) => ({
    type: REMOVE_ORDER_ITEM as typeof REMOVE_ORDER_ITEM,
    payload: fiatAmountCents,
});

export const clearOrder = () => ({
    type: CLEAR_ORDER as typeof CLEAR_ORDER,
});

export const setFiatCurrency = (currency: FiatCurrency) => ({
    type: SET_FIAT_CURRENCY as typeof SET_FIAT_CURRENCY,
    payload: currency,
});

export const setPurchaseEmail = (email: string) => ({
    type: SET_PURCHASE_EMAIL as typeof SET_PURCHASE_EMAIL,
    payload: email,
});

export const setLastPurchase = (purchase: CreateCardResponse | null) => ({
    type: SET_LAST_PURCHASE as typeof SET_LAST_PURCHASE,
    payload: purchase,
});

export const setCardLookup = (card: Card | null) => ({
    type: SET_CARD_LOOKUP as typeof SET_CARD_LOOKUP,
    payload: card,
});

export const setCardBalance = (balance: CardBalance | null) => ({
    type: SET_CARD_BALANCE as typeof SET_CARD_BALANCE,
    payload: balance,
});

export const setRedeemResult = (result: RedeemCardResponse | null) => ({
    type: SET_REDEEM_RESULT as typeof SET_REDEEM_RESULT,
    payload: result,
});

export const setError = (error: string | null) => ({
    type: SET_ERROR as typeof SET_ERROR,
    payload: error,
});

export const clearError = () => ({
    type: CLEAR_ERROR as typeof CLEAR_ERROR,
});

export const setLoading = (loading: boolean) => ({
    type: SET_LOADING as typeof SET_LOADING,
    payload: loading,
});
