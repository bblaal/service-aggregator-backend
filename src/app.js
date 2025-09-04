const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { globalLimiter } = require("./middleware/rateLimit");
const { errorHandler } = require("./middleware/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use(helmet());
app.use(express.json());
// app.use(globalLimiter);

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api", adminRoutes);
app.use("/api/delivery", deliveryRoutes);

app.use(errorHandler);

module.exports = app;
