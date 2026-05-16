import { Link, useLocation } from 'react-router-dom';

const BitcoinIcon = () => (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-btc-orange" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z" />
        <path fill="#fff" d="M17.197 10.431c.24-1.607-.984-2.47-2.66-3.047l.543-2.179-1.325-.33-.529 2.12c-.348-.087-.706-.169-1.062-.25l.533-2.136-1.325-.33-.544 2.178c-.288-.066-.571-.13-.845-.198l.002-.007-1.828-.456-.353 1.416s.984.225.963.239c.537.134.634.49.618.772l-.619 2.483c.037.009.085.023.138.044l-.14-.035-.867 3.476c-.066.163-.232.407-.607.314.013.02-.963-.24-.963-.24l-.658 1.519 1.723.43c.32.08.635.164.944.243l-.549 2.204 1.324.33.544-2.18c.362.098.713.188 1.057.274l-.542 2.174 1.325.33.549-2.2c2.263.428 3.966.255 4.682-1.792.578-1.65-.029-2.6-1.222-3.22.869-.2 1.523-.77 1.698-1.95zM14.7 15.41c-.41 1.65-3.19.758-4.09.534l.73-2.927c.9.225 3.786.67 3.36 2.393zm.41-4.003c-.375 1.5-2.687.738-3.439.551l.662-2.652c.752.187 3.172.538 2.777 2.101z" />
    </svg>
);

const Header = () => {
    const location = useLocation();

    const navLinks = [
        { to: '/buy', label: 'Buy a Card' },
        { to: '/card', label: 'Check Balance' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <BitcoinIcon />
                    <span className="text-xl font-bold text-gray-900 group-hover:text-btc-orange transition-colors">
                        Gifter
                    </span>
                </Link>

                <nav className="flex items-center gap-1">
                    {navLinks.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === to
                                ? 'bg-btc-orange/10 text-btc-orange'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default Header;
