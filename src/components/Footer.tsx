const Footer = () => (
    <footer className="border-t border-gray-200 mt-auto py-8 text-center text-gray-400 text-sm">
        <p>
            &copy; {new Date().getFullYear()} Gifter &mdash; Bitcoin Gift Cards powered by{' '}
            <span className="text-btc-orange">Lightning Network</span>
        </p>
        <p className="mt-1">Testnet — not real money</p>
    </footer>
);

export default Footer;
