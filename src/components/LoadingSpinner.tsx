interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
}

const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
};

const LoadingSpinner = ({ size = 'md', label }: LoadingSpinnerProps) => (
    <div className="flex flex-col items-center justify-center gap-3">
        <div
            className={`${sizes[size]} rounded-full border-btc-orange border-t-transparent animate-spin`}
        />
        {label && <p className="text-gray-500 text-sm">{label}</p>}
    </div>
);

export default LoadingSpinner;
