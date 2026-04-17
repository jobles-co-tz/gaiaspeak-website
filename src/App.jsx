import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TokenCards } from './components/TokenCards';
import { HowItWorks } from './components/HowItWorks';
import { Distribution } from './components/Distribution';
import { WhiteSection } from './components/WhiteSection';
import { StageIndicator } from './components/StageIndicator';
import { PhysicalDeliveryPool } from './components/PhysicalDeliveryPool';
import { Footer } from './components/Footer';
import { PreOrderPage } from './pages/PreOrderPage';
import { AdminPage } from './pages/AdminPage';
import { WristbandPage } from './pages/WristbandPage';
import { SupplierSubmitPage } from './pages/SupplierSubmitPage';

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <div className="h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
        <TokenCards />
        <div className="h-px bg-linear-to-r from-transparent via-slate-600/30 to-transparent" />
  <PhysicalDeliveryPool />
        <div className="h-px bg-linear-to-r from-transparent via-slate-600/30 to-transparent" />
        <HowItWorks />
        <div className="h-px bg-linear-to-r from-transparent via-slate-600/30 to-transparent" />
        <Distribution />
        <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <WhiteSection />
        <div className="h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
        <StageIndicator />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/preorder" element={<PreOrderPage />} />
        <Route path="/wristband" element={<WristbandPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/suppliers/:supplierId/submit-prices" element={<SupplierSubmitPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
