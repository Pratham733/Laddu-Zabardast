import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Loader2 } from 'lucide-react';

// Import all page components
import Home from './pages/home-page';
import ShopPage from './pages/shop-page';
import CartPage from './pages/cart-page';
import CheckoutPage from './pages/checkout-page';
import LoginPage from './pages/login-page';
import SignupPage from './pages/signup-page';
import ProfilePage from './pages/profile-page';
import OrdersPage from './pages/order-page';
import OrderConfirmationPage from './pages/order-confirmation-page';
import AdminPage from './pages/admin-page';
import ProductPage from './pages/product-page';
import SearchPage from './pages/search-page';
import PrivacyPolicyPage from './pages/privacy-policy-page';
import TermsOfServicePage from './pages/terms-of-service-page';
import WishlistPage from './pages/wishlist-page';

import { ClientLayout } from './components/layout/client-layout';

// Wrapper for dynamic product page to pass params
function ProductPageWrapper() {
  const params = useParams<{ productId: string }>();
  return <ProductPage params={{ productId: params.productId || '' }} />;
}

// Guard to require user authentication before landing
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Guard to redirect authenticated users away from login/signup to home page
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ClientLayout>
        <Routes>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/shop" element={<RequireAuth><ShopPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
          <Route path="/signup" element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/order-confirmation" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="/product/:productId" element={<RequireAuth><ProductPageWrapper /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
          <Route path="/privacy-policy" element={<RequireAuth><PrivacyPolicyPage /></RequireAuth>} />
          <Route path="/terms-of-service" element={<RequireAuth><TermsOfServicePage /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClientLayout>
    </BrowserRouter>
  );
}
