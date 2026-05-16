import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_BTC_GIFTCARD_API_URL_ENV || 'http://localhost:3202';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (import.meta.env.DEV) {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        if (status === 400) {
            error.message = (error.response?.data as any)?.error || 'Invalid request.';
        } else if (status === 404) {
            error.message = 'Card not found.';
        } else if (status === 409) {
            error.message = 'Card is already being processed.';
        } else if (status === 429) {
            error.message = 'Too many requests. Please wait a moment.';
        } else if (status === 500) {
            error.message = 'Server error. Please try again later.';
        } else if (error.code === 'ECONNABORTED') {
            error.message = 'Request timeout. Please try again.';
        } else if (!error.response) {
            error.message = 'Network error. Please check your connection.';
        }
        return Promise.reject(error);
    },
);

export default api;
