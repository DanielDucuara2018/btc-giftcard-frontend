import { Link } from 'react-router-dom';
import BitcoinGiftCard from '../components/BitcoinGiftCard';

const features = [
    {
        icon: '⚡',
        title: 'Lightning Fast Redemption',
        desc: 'Redeem your BTC in seconds via the Lightning Network. No wallet setup required.',
    },
    {
        icon: '🔒',
        title: 'Secure Custody',
        desc: 'Your BTC is held in a secure Lightning node. Redeem anytime before the card expires.',
    },
    {
        icon: '🎁',
        title: 'The Perfect Gift',
        desc: 'No Bitcoin knowledge required to give. Just share the card code after purchase.',
    },
    {
        icon: '💳',
        title: 'Pay with Card',
        desc: 'Purchase with any Visa or Mastercard. Instant BTC allocation via our treasury.',
    },
];

const HomePage = () => {
    return (
        <div className="flex flex-col">

            {/* ── Hero ── */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-5xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Left: copy + CTAs */}
                    <div className="flex-1 text-center lg:text-left animate-slide-up">
                        <div className="inline-flex items-center gap-2 bg-btc-orange/10 border border-btc-orange/20 rounded-full px-4 py-1.5 mb-6 text-btc-orange text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-btc-orange animate-pulse-slow" />
                            Running on Bitcoin Testnet
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                            The Bitcoin<br />
                            <span className="text-btc-orange">Gift Card</span>
                        </h1>

                        <p className="text-xl text-gray-500 mb-10 max-w-md mx-auto lg:mx-0">
                            Buy with euros. The recipient redeems real BTC via Lightning Network —
                            instantly, no wallet required.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            <Link
                                to="/buy"
                                className="btn-primary text-lg px-8 py-4 shadow-lg shadow-btc-orange/20"
                            >
                                Buy a Gift Card
                            </Link>
                            <Link to="/card" className="btn-secondary text-lg px-8 py-4">
                                Check My Card
                            </Link>
                        </div>
                    </div>

                    {/* Right: 3D gift card */}
                    <div className="flex-1 flex justify-center items-center">
                        <BitcoinGiftCard size="lg" interactive />
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="py-20 px-4 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How it works</h2>
                    <div className="grid sm:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Purchase',
                                desc: 'Choose an amount and pay securely with your card via Stripe.',
                            },
                            {
                                step: '2',
                                title: 'Receive Code',
                                desc: 'Get a unique gift card code. Share it as a gift or keep it for yourself.',
                            },
                            {
                                step: '3',
                                title: 'Redeem BTC',
                                desc: 'Enter the code and a Lightning invoice. BTC is sent directly to your wallet.',
                            },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-btc-orange/10 border border-btc-orange/30 flex items-center justify-center text-btc-orange font-bold text-xl mb-4">
                                    {step}
                                </div>
                                <h3 className="text-gray-900 font-semibold text-lg mb-2">{title}</h3>
                                <p className="text-gray-500 text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Gifter?</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {features.map(({ icon, title, desc }) => (
                            <div key={title} className="card-panel flex gap-4">
                                <span className="text-3xl">{icon}</span>
                                <div>
                                    <h3 className="text-gray-900 font-semibold mb-1">{title}</h3>
                                    <p className="text-gray-500 text-sm">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-4 bg-gray-50 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to send some sats?</h2>
                    <p className="text-gray-500 mb-8">Takes less than 2 minutes to purchase a gift card.</p>
                    <Link
                        to="/buy"
                        className="btn-primary text-lg px-10 py-4 shadow-lg shadow-btc-orange/20"
                    >
                        Get Started
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
