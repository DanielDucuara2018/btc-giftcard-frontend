import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BuyPage from './pages/BuyPage';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import CardPage from './pages/CardPage';
import RedeemPage from './pages/RedeemPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
    return (
        <Router>
            <div className="min-h-screen flex flex-col bg-white">
                <Header />
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/buy" element={<BuyPage />} />
                        <Route path="/success" element={<SuccessPage />} />
                        <Route path="/cancel" element={<CancelPage />} />
                        <Route path="/card" element={<CardPage />} />
                        <Route path="/card/redeem" element={<RedeemPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;
