# Wallet Service API

## Overview
This project implements a wallet service API built with Hapi.js, using Knex.js for database interactions, Redis for caching, RabbitMQ for asynchronous processing, and Faux token-based authentication.

## Features
- User Registration & Authentication (Custom token-based authentication)
- Wallet Funding & Withdrawals
- Transfers Between Users
- Caching with Redis
- Transaction Processing via RabbitMQ
- API Documentation with Swagger
- Security with Helmet.js
- Rate Limiting

---

## Technologies Used
- Hapi.js - Backend framework
- Knex.js - SQL Query Builder
- MySQL - Relational Database
- Redis - Caching Layer
- RabbitMQ - Message Queue for async operations
- Joi - Request validation
- Swagger - API Documentation
- Helmet.js - Security middleware
- Rate Limiting - Preventing excessive requests
- Objection.js - ORM

---

## Installation & Setup

### Prerequisites
Ensure you have the following installed:
- Node.js (>=14.x)
- MySQL Database
- Redis
- RabbitMQ

### Steps to Set Up
1. Clone the repository:
   ```sh
   git clone git@github.com:anjorintosin/Lendsqr-test.git
   cd lendsqr-test
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the following:
     ```sh
     PORT=3000
     SECRET_KEY=your-secret-key
     DATABASE_URL=mysql://user:password@localhost:3306/dbname
     REDIS_URL=redis://localhost:6379
     AMQP_URL=amqps://your-rabbitmq-url
     ```
4. Run database migrations:
   ```sh
   npm run migrate
   ```
5. Start the server:
   ```sh
   npm run build
   npm run dev
   ```

---

## API Documentation
Swagger API documentation is available at:
```
http://localhost:3000/documentation
```
### Authentication
The system uses Faux token-based authentication:
- The token is a Base64-encoded string of `userId:SECRET_KEY`.
- Include it in headers:
  ```sh
  Authorization: <Base64EncodedToken>
  ```

---

## Key Modules

### Authentication
`utils/auth.ts`
```ts
export const generateAuthToken = (userId: string): string => {
    const token = Buffer.from(`${userId}:${process.env.SECRET_KEY}`).toString("base64");
    return token;
};
```

### Wallet Operations
`walletUtils.ts`
```ts
export const creditPersonWallet = async (personId: string, amount: number) => { ... };
export const debitPersonWallet = async (personId: string, amount: number) => { ... };
export const processTransfer = async (senderId: string, recipientId: string, amount: number) => { ... };
```

### Caching with Redis
`utils/cache.ts`
```ts
export const setCache = async (key: string, value: any, ttl = 3600) => { ... };
export const getCache = async (key: string) => { ... };
export const deleteCache = async (key: string) => { ... };
```

### Messaging Queue (RabbitMQ)
Producer (`utils/queue.ts`)
```ts
const amqpUrl = process.env.AMQP_URL;
async function producer(message) { ... }
export { producer };
```

Consumer (`utils/subscriber.ts`)
```ts
async function subscriber() { ... }
export { subscriber };
```

---

## Entity-Relationship Diagram
![E-R Diagram](erd-diagram.png)

---

## Running Tests
Run unit tests with:
```sh
npm test
```

---


