import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';

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

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ClientLayout>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/product/:productId" element={<ProductPageWrapper />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Routes>
      </ClientLayout>
    </BrowserRouter>
  );
}
