## Core Data Models

Your Golang structs should map to the JSON representations expected by the frontend:

### 1. AppUser

```go
type Address struct {
    Street    string `json:"street"`
    City      string `json:"city"`
    State     string `json:"state"`
    Country   string `json:"country"`
    PostalCode string `json:"postalCode"`
    IsDefault bool   `json:"isDefault,omitempty"`
}

type AppUser struct {
    UserID    string    `json:"userId"`
    Email     string    `json:"email"`
    FirstName string    `json:"firstName"`
    LastName  string    `json:"lastName"`
    Phone     *string   `json:"phone"`     // nullable
    PhotoURL  *string   `json:"photoURL"`  // nullable
    Role      *string   `json:"role"`      // nullable
    IsAdmin   bool      `json:"isAdmin"`
    Picture   *string   `json:"picture"`   // nullable
    Addresses []Address `json:"addresses"`
    CreatedAt string    `json:"createdAt,omitempty"`
}
```

### 2. Product

```go
type Product struct {
    ID          string  `json:"id" bson:"_id"` // Matches MongoDB Hex String
    Name        string  `json:"name"`
    Description string  `json:"description"`
    Price       float64 `json:"price"`
    ImageUrl    string  `json:"imageUrl"`
    Category    string  `json:"category"` // "laddu" | "pickle"
    Available   bool    `json:"available"`
}
```

### 3. Review

```go
type Review struct {
    ID        string    `json:"_id"`
    ProductID string    `json:"productId"`
    UserID    string    `json:"userId"`
    UserName  string    `json:"userName"`
    Rating    int       `json:"rating"`
    Comment   string    `json:"comment"`
    Pinned    bool      `json:"pinned"`
    CreatedAt string    `json:"createdAt"`
    UpdatedAt string    `json:"updatedAt"`
}
```

### 4. Order

```go
type OrderItem struct {
    ID       string  `json:"id"`
    Name     string  `json:"name"`
    Quantity int     `json:"quantity"`
    Price    float64 `json:"price"`
}

type ShippingDetails struct {
    Name       string `json:"name"`
    Email      string `json:"email"`
    Phone      string `json:"phone"`
    Street     string `json:"street"`
    City       string `json:"city"`
    State      string `json:"state"`
    PostalCode string `json:"postalCode"`
    Country    string `json:"country"`
}

type Order struct {
    ID              string          `json:"_id"`
    ShippingDetails ShippingDetails `json:"shippingDetails"`
    Items           []OrderItem     `json:"items"`
    TotalAmount     float64         `json:"totalAmount"`
    PaymentStatus   string          `json:"paymentStatus"` // "pending" | "completed" | "paid" | "failed"
    PaymentMethod   string          `json:"paymentMethod"` // "cod" | "card" | "upi" | "cash"
    OrderStatus     string          `json:"orderStatus"`   // "processing" | "shipped" | "delivered" | "cancelled"
    CreatedAt       string          `json:"createdAt"`
}
```

---

## 📡 REST API Endpoint Contracts

### 1. Authentication & Profile

#### `POST /login`

Authenticates a user.

- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "token": "JWT_TOKEN_STRING",
    "user": { ...AppUser... }
  }
  ```

#### `POST /signup`

Registers a new user.

- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response Structure (201 Created)**:
  ```json
  {
    "token": "JWT_TOKEN_STRING",
    "user": { ...AppUser... },
    "message": "User registered successfully"
  }
  ```

#### `GET /user`

Retrieves currently authenticated user state from token context.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "user": { ...AppUser... }
  }
  ```

#### `POST /update-profile`

Updates user profile fields (e.g. phone number).

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true,
    "user": { ...AppUser... }
  }
  ```

#### `POST /change-password`

Changes account password.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

---

### 2. Wishlist

#### `GET /wishlist/:userId`

Fetch a user's wishlist items.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "wishlist": [ ...Product... ]
  }
  ```

#### `PUT /wishlist/:userId`

Save/replace wishlist state.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "items": [ ...Product... ]
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

---

### 3. Shopping Cart

#### `GET /cart/:userId`

Retrieves items in the user's cart.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "prod123",
        "name": "Special Laddu",
        "price": 450.0,
        "imageUrl": "/images/laddu.png",
        "category": "laddu",
        "quantity": 2
      }
    ]
  }
  ```

#### `PUT /cart/:userId`

Saves updated cart items.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "prod123",
        "quantity": 2
      }
    ]
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

---

### 4. Products

#### `GET /add-product`

Gets list of all products.

- **Response Structure (200 OK)**:
  ```json
  {
    "products": [ ...Product... ]
  }
  ```

#### `GET /products/:productId`

Gets details of a single product.

- **Response Structure (200 OK)**:
  ```json
  {
    "product": { ...Product... }
  }
  ```

#### `POST /add-product` (Admin Only)

Adds a new product to the database.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Dry Fruits Laddu",
    "price": 600.0,
    "category": "laddu",
    "description": "Rich dry fruit laddus sweetened naturally.",
    "imageUrl": "https://bucket-name.s3.amazonaws.com/products/image.jpg"
  }
  ```
- **Response Structure (201 Created)**:
  ```json
  {
    "products": [ ...Product... ] // Returns complete updated product list
  }
  ```

#### `PUT /add-product?id=:id` (Admin Only)

Updates product details.

- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `id` (product ID)
- **Request Body**:
  ```json
  {
    "name": "Updated Laddu Name",
    "price": 620.0,
    "category": "laddu",
    "description": "Updated description...",
    "imageUrl": "https://bucket-name.s3.amazonaws.com/products/image.jpg"
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "products": [ ...Product... ] // Returns complete updated product list
  }
  ```

#### `DELETE /add-product?id=:id` (Admin Only)

Deletes product from the store.

- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `id`
- **Response Structure (200 OK)**:
  ```json
  {
    "products": [ ...Product... ] // Returns complete updated product list
  }
  ```

#### `POST /upload-product-image` (Admin Only)

Uploads image binary data and returns access URL.

- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**: Form Data with file field `file`
- **Response Structure (200 OK)**:
  ```json
  {
    "url": "https://stored-image-url.com/image.jpg"
  }
  ```

---

### 5. Shipping Addresses

#### `GET /addresses`

Retrieves user addresses.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "addresses": [ ...Address... ]
  }
  ```

#### `POST /addresses`

Adds a new address.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ ...Address... }`
- **Response Structure (200 OK)**:
  ```json
  {
    "addresses": [ ...Address... ] // Updated address array
  }
  ```

#### `PUT /addresses`

Updates address configuration (e.g. setting as default).

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ ...Address... }`
- **Response Structure (200 OK)**:
  ```json
  {
    "addresses": [ ...Address... ] // Updated address array
  }
  ```

#### `DELETE /addresses/:idx`

Removes an address at an index location.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "addresses": [ ...Address... ] // Updated address array
  }
  ```

---

### 6. Orders

#### `GET /orders`

Retrieves order history. Admin gets all orders. Users get only their filtered orders.

- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `email` (optional, for filtering regular user history)
- **Response Structure (200 OK)**:
  ```json
  {
    "orders": [ ...Order... ]
  }
  ```

#### `GET /orders/:orderId`

Retrieves a specific order.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "order": { ...Order... }
  }
  ```

#### `POST /create-order`

Submits a checkout order.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "shippingDetails": { ...ShippingDetails... },
    "items": [ ...OrderItem... ],
    "totalAmount": 1350.00,
    "paymentStatus": "pending",
    "paymentMethod": "upi",
    "orderStatus": "Processing"
  }
  ```
- **Response Structure (201 Created)**:
  ```json
  {
    "orderId": "ORD_GENERATED_ID"
  }
  ```

#### `PATCH /orders` (Admin Only)

Updates order or payment state.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "orderId": "ORD_GENERATED_ID",
    "status": "shipped", // Optional
    "paymentStatus": "completed" // Optional
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

#### `GET /generate-invoice`

Generates and downloads PDF invoice for an order.

- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `orderId`
- **Response Status**: `200 OK`
- **Response Content-Type**: `application/pdf`
- **Response Body**: Binary PDF stream.

---

### 7. Product Reviews

#### `GET /products/:productId/reviews`

List reviews for a product.

- **Response Structure (200 OK)**:
  ```json
  {
    "reviews": [ ...Review... ]
  }
  ```

#### `POST /products/:productId/reviews`

Submit a new review.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Delicious laddus! Fresh and high quality."
  }
  ```
- **Response Structure (201 Created)**:
  ```json
  {
    "review": { ...Review... }
  }
  ```

#### `PUT /products/:productId/reviews/:reviewId`

Modify review comment or rating.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "rating": 4,
    "comment": "Still good, just a tiny bit sweet."
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "review": { ...Review... }
  }
  ```

#### `DELETE /reviews/:reviewId` (Admin or Review Owner)

Removes a review.

- **Headers**: `Authorization: Bearer <token>`
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

#### `PATCH /reviews/:reviewId` (Admin Only)

Pins/unpins review to top of page.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "pinned": true
  }
  ```
- **Response Structure (200 OK)**:
  ```json
  {
    "success": true
  }
  ```
