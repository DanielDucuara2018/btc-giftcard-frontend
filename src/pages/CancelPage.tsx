import { Link } from 'react-router-dom';

const CancelPage = () => (
    <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment cancelled</h1>
        <p className="text-gray-500 mb-8">
            You cancelled the checkout. No charge was made. Your cart has been saved — you can
            try again whenever you're ready.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
            <Link to="/buy" className="btn-primary">
                Back to Cart
            </Link>
            <Link to="/" className="btn-secondary">
                Go Home
            </Link>
        </div>
    </div>
);

export default CancelPage;
