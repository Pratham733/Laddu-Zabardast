import { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import "./navbar.css";
import logo from "./logo.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const NavBar = ({ isAuthenticated, onLogout }) => {
  const { cartList } = useSelector((state) => state.cart);
  const [expand, setExpand] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const navigate = useNavigate();

  // Fixed Header logic
  useEffect(() => {
    const scrollHandler = () => {
      if (window.scrollY >= 100) {
        setIsFixed(true);
      } else if (window.scrollY <= 50) {
        setIsFixed(false);
      }
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  return (
    <Navbar
      fixed="top"
      expand="md"
      className={isFixed ? "navbar fixed" : "navbar"}
    >
      <Container className="navbar-container">
        <Navbar.Brand to="/">
          <img
            src={logo}
            alt="Laddu Zabardast Logo"
            className="navbar-logo"
          />
          <h1 className="logo">LADDU ZABARDAST</h1>
        </Navbar.Brand>

        {/* Media cart and toggle */}
        <div className="d-flex">
          <div className="media-cart">
            <Link
              aria-label="Go to Cart Page"
              to="/cart"
              className="cart"
              data-num={cartList.length}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="black"
                className="nav-icon"
              >
                <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              </svg>
            </Link>
          </div>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={() => {
              setExpand(expand ? false : "expanded");
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </Navbar.Toggle>
        </div>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="justify-content-end flex-grow-1 pe-3">
            {/* Home, Shop, Cart Links */}
            <Nav.Item>
              <Link
                aria-label="Go to Home Page"
                className="navbar-link"
                to="/"
                onClick={() => setExpand(false)}
              >
                <span className="nav-link-label">Home</span>
              </Link>
            </Nav.Item>

            <Nav.Item>
              <Link
                aria-label="Go to Shop Page"
                className="navbar-link"
                to="/shop"
                onClick={() => setExpand(false)}
              >
                <span className="nav-link-label">Shop</span>
              </Link>
            </Nav.Item>

            <Nav.Item>
              <Link
                aria-label="Go to Cart Page"
                className="navbar-link"
                to="/cart"
                onClick={() => setExpand(false)}
              >
                <span className="nav-link-label">Cart</span>
              </Link>
            </Nav.Item>

            {/* Login, Signup or Logout Button */}
            {isAuthenticated ? (
              <Nav.Item>
                <button
                  className="logout-btn"
                  onClick={() => {
                    onLogout();
                    navigate("/login"); // Redirect to login page after logout
                  }}
                >
                  <span className="logout-btn-text">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="logout-icon"
                    >
                      <path d="M12 8v4m0 0v4m0-4h4l-6 6-6-6h4zm9 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Logout
                  </span>
                </button>
              </Nav.Item>
            ) : (
              <>
                <Nav.Item>
                  <Link
                    aria-label="Go to Login Page"
                    className="navbar-link"
                    to="/login"
                    onClick={() => setExpand(false)}
                  >
                    <span className="nav-link-label">Login</span>
                  </Link>
                </Nav.Item>

                <Nav.Item>
                  <Link
                    aria-label="Go to Signup Page"
                    className="navbar-link"
                    to="/signup"
                    onClick={() => setExpand(false)}
                  >
                    <span className="nav-link-label">Signup</span>
                  </Link>
                </Nav.Item>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
