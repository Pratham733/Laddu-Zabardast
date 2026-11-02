const jwt = require('jsonwebtoken');

// Get JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not defined');
    process.exit(1);
}

// Example user data
const user = {
    userId: '12345',    // Replace with the actual user ID from your DB
    email: 'spratham388@gmail.com'  // Replace with the actual user's email
};

// Sign the JWT with your secret key and set an expiration time (e.g., 1 hour)
// Set a very long expiry (1 year)
const token = jwt.sign(user, JWT_SECRET, { expiresIn: '365d' });

console.log('Generated JWT Token:', token);
