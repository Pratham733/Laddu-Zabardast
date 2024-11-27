import { lazy, Suspense, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Loader from "./components/Loader/Loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Product = lazy(() => import("./pages/Product"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuthStatus, setLoadingAuthStatus] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const storedAuthStatus = localStorage.getItem("isAuthenticated");
    if (storedAuthStatus === "true") {
      setIsAuthenticated(true);
    }
    setLoadingAuthStatus(false); // Finish loading auth status
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  // Prevent rendering until authentication is checked
  if (loadingAuthStatus) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Router>
        <ToastContainer position="top-right" autoClose={1000} theme="light" />
        <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !isAuthenticated ? (
                <Signup />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Home />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/shop"
            element={
              isAuthenticated ? (
                <Shop />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/shop/:id"
            element={
              isAuthenticated ? (
                <Product />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/cart"
            element={
              isAuthenticated ? (
                <Cart />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </Suspense>
  );
}

export default App;
