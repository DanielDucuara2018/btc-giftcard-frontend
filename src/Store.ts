import { createStore, combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import appReducer from './reducers/appReducer';

const persistConfig = {
    key: 'btc-giftcard',
    storage,
    whitelist: ['purchaseOrder', 'lastPurchase'],
};

const persistedReducer = persistReducer(persistConfig, appReducer);

const rootReducer = combineReducers({
    appRootReducer: persistedReducer,
});

const store = createStore(
    rootReducer,
    typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__
        ? (window as any).__REDUX_DEVTOOLS_EXTENSION__()
        : undefined,
);

const persistor = persistStore(store);

export { store, persistor };
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
