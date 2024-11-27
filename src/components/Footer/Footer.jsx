import React from "react";
import "./style.css";
import { Col, Container, Row } from "react-bootstrap";

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row className="footer-row">
          <Col md={3} sm={5} className="box">
            <div className="logo">
              <ion-icon name="bag"></ion-icon>
              <h1>Laddu Zabardast</h1>
            </div>
            <p>
              Laddu Zabardast brings you the finest blend of tradition and taste. Each laddu is crafted with premium ingredients, delivering a burst of authentic flavors. From festive celebrations to everyday indulgences, experience the magic of our irresistible sweets.
            </p>
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>About Us</h2>
            <ul>
              <li>Careers</li>
              <li>Our Stores</li>
              <li>Our Cares</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>Customer Care</h2>
            <ul>
              <li>Help Center</li>
              <li>How to Buy</li>
              <li>Track Your Order</li>
              <li>Corporate & Bulk Purchasing</li>
              <li>Returns & Refunds</li>
            </ul>
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>Contact Us</h2>
            <ul>
              <li>
                SNAP Technotrade Solutions 1101, Pacific, Urbtech Xaviers, Plot no. Gh-01/B, Sector 168 NOIDA (GBN)
              </li>
              <li>Email: snaptechnotrade@gmail.com</li>
              <li>Phone: +91 81785 10740</li>
            </ul>
            <div className="social-icons">
              <a href="https://www.linkedin.com/in/laddu-zabardast-neetu-singh-a293622a7/" target="_blank" rel="noopener noreferrer">
                <ion-icon name="logo-linkedin"></ion-icon>
              </a>
              <a href="https://www.instagram.com/laddu_zabardast/" target="_blank" rel="noopener noreferrer">
                <ion-icon name="logo-instagram"></ion-icon>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
