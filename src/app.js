const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { globalLimiter } = require("./middleware/rateLimit");
const { errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const agentRoutes = require("./routes/agentRoutes");
const servicesRoutes = require("./routes/servicesRoutes");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use(helmet());
app.use(express.json());
// app.use(globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api", adminRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/services", servicesRoutes);

app.use(errorHandler);

module.exports = app;
