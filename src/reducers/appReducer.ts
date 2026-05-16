import { UnknownAction } from 'redux';
import { AppState } from '../types';
import {
    SET_ORDER_ITEM,
    REMOVE_ORDER_ITEM,
    CLEAR_ORDER,
    SET_FIAT_CURRENCY,
    SET_PURCHASE_EMAIL,
    SET_LAST_PURCHASE,
    SET_CARD_LOOKUP,
    SET_CARD_BALANCE,
    SET_REDEEM_RESULT,
    SET_ERROR,
    CLEAR_ERROR,
    SET_LOADING,
} from '../actions/appActions';

interface AppAction extends UnknownAction {
    type: string;
    payload?: any;
}

const initialState: AppState = {
    purchaseOrder: [],
    fiatCurrency: 'EUR',
    purchaseEmail: '',
    lastPurchase: null,
    cardLookup: null,
    cardBalance: null,
    redeemResult: null,
    error: null,
    loading: false,
};

const appReducer = (state: AppState = initialState, action: AppAction): AppState => {
    switch (action.type) {
        case SET_ORDER_ITEM: {
            const item = action.payload;
            const existing = state.purchaseOrder.find(
                (i) => i.fiat_amount_cents === item.fiat_amount_cents,
            );
            if (existing) {
                return {
                    ...state,
                    purchaseOrder: state.purchaseOrder.map((i) =>
                        i.fiat_amount_cents === item.fiat_amount_cents ? item : i,
                    ),
                };
            }
            return { ...state, purchaseOrder: [...state.purchaseOrder, item] };
        }

        case REMOVE_ORDER_ITEM:
            return {
                ...state,
                purchaseOrder: state.purchaseOrder.filter(
                    (i) => i.fiat_amount_cents !== action.payload,
                ),
            };

        case CLEAR_ORDER:
            return { ...state, purchaseOrder: [] };

        case SET_FIAT_CURRENCY:
            return { ...state, fiatCurrency: action.payload };

        case SET_PURCHASE_EMAIL:
            return { ...state, purchaseEmail: action.payload };

        case SET_LAST_PURCHASE:
            return { ...state, lastPurchase: action.payload };

        case SET_CARD_LOOKUP:
            return { ...state, cardLookup: action.payload };

        case SET_CARD_BALANCE:
            return { ...state, cardBalance: action.payload };

        case SET_REDEEM_RESULT:
            return { ...state, redeemResult: action.payload };

        case SET_ERROR:
            return { ...state, error: action.payload };

        case CLEAR_ERROR:
            return { ...state, error: null };

        case SET_LOADING:
            return { ...state, loading: action.payload };

        default:
            return state;
    }
};

export default appReducer;
