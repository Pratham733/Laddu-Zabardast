import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { NativeGoogleReturn } from '@/mobile/native-google-return';
import { NativeNavigation } from '@/mobile/native-navigation';
import { Loader2 } from 'lucide-react';

// Import all page components
import Home from './pages/home-page';
import ShopPage from './pages/shop-page';
import CartPage from './pages/cart-page';
import BuildABoxPage from './pages/build-a-box-page';
import LoginPage from './pages/login-page';
import SignupPage from './pages/signup-page';
import ProfilePage from './pages/profile-page';
import OrdersPage from './pages/order-page';
import OrderConfirmationPage from './pages/order-confirmation-page';
import ProductPage from './pages/product-page';
import SearchPage from './pages/search-page';
import PrivacyPolicyPage from './pages/privacy-policy-page';
import TermsOfServicePage from './pages/terms-of-service-page';
import WishlistPage from './pages/wishlist-page';
import { safeReturnTo } from '@/lib/navigation';
import { LoadingState } from '@/components/store-feedback';
import { RouteBoundary } from '@/components/route-boundary';
const PasswordResetPage = lazy(() => import('./pages/password-reset-page'));
const GoogleReturnPage = lazy(() => import('./pages/google-return-page'));
const AdminPage = lazy(() => import('./pages/admin-page'));
const CheckoutPage = lazy(() => import('./pages/checkout-page'));

import { ClientLayout } from './components/layout/client-layout';

// Wrapper for dynamic product page to pass params
function ProductPageWrapper() {
  const params = useParams<{ productId: string }>();
  return <ProductPage params={{ productId: params.productId || '' }} />;
}

// Guard to require user authentication before landing
function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />;
  }
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Guard to redirect authenticated users away from login/signup to home page
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) {
    return <Navigate to={safeReturnTo(params.get('redirect') || params.get('callbackUrl'))} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NativeNavigation />
      <ClientLayout>
        <NativeGoogleReturn />
        <RouteBoundary><Suspense fallback={<LoadingState label="Opening page…" />}><Routes>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/shop" element={<RequireAuth><ShopPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/build-a-box" element={<RequireAuth><BuildABoxPage /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/google-sign-in" element={<GoogleReturnPage />} />
          <Route path="/forgot-password" element={<PasswordResetPage key="forgot" />} />
          <Route path="/reset-password" element={<PasswordResetPage key="reset" reset />} />
          <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
          <Route path="/signup" element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/order-confirmation" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
          <Route path="/product/:productId" element={<RequireAuth><ProductPageWrapper /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
          <Route path="/privacy-policy" element={<RequireAuth><PrivacyPolicyPage /></RequireAuth>} />
          <Route path="/terms-of-service" element={<RequireAuth><TermsOfServicePage /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense></RouteBoundary>
      </ClientLayout>
    </BrowserRouter>
  );
}
