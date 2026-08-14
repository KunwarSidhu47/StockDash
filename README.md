# StockDash

A modern, full-stack stock market analytics dashboard built with the **MERN** stack (MongoDB, Express, React, Node.js). StockDash provides real-time market data, interactive charting, analyst ratings, and a seamless portfolio tracking experience.

This project was built to demonstrate proficiency in building scalable web applications, integrating third-party financial APIs, and creating responsive, data-rich user interfaces.

---

## 🌟 Key Features

- **Secure Authentication:** Protected routes with JSON Web Token (JWT) authentication.
- **Interactive Price Charts:** Historical stock data visualization using `Recharts` with custom tooltips and dynamic time intervals (1D, 1W, 1M, 6M, 1Y).
- **Stock Comparison Tool:** Dynamically overlay two different stocks on the same chart. The app automatically normalizes prices into a Percentage Change (%) format for accurate visual comparison.
- **Real-Time Market Data:** Live quotes, trending market tickers, and day highs/lows powered by the Yahoo Finance API.
- **Advanced Financial Insights:** View the latest related news headlines and Wall Street analyst consensus (Strong Buy/Buy/Hold/Sell) for any ticker.
- **Persistent Watchlist:** Save and manage favorite stocks using a MongoDB database.
- **Modern UI/UX:** Built from scratch using raw CSS featuring a sleek dark mode, glassmorphism design elements, and micro-animations.

---

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- CSS3 (Custom Glassmorphism Design System)
- Recharts (Data Visualization)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT) for Authentication
- `yahoo-finance2` for reliable market data extraction

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js (v16 or higher)
- A MongoDB cluster (e.g., MongoDB Atlas free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KunwarSidhu47/StockDash.git
   cd StockDash
   ```

2. **Install dependencies**
   ```bash
   npm run postinstall
   ```
   *(This custom script installs both the client and server dependencies)*

3. **Set up Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Run the Application**
   ```bash
   # In terminal 1 (Start the Backend)
   cd server
   npm start

   # In terminal 2 (Start the Frontend)
   cd client
   npm run dev
   ```

5. **Login**
   - Open your browser to `http://localhost:5173`
   - Use the default credentials: **`admin123` / `admin123`**

---

## ☁️ Deployment

StockDash is configured for 1-click deployment on platforms like Render or Heroku.

1. Connect your repository to Render.
2. Set the Build Command to `npm run build`.
3. Set the Start Command to `npm start`.
4. Add your `MONGO_URI` and `JWT_SECRET` as environment variables.
5. Deploy!

---

*Designed and engineered with passion.*
