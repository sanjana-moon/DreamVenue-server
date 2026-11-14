import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { initializeDatabase } from "./config/db.js";

// Import Routes
import venueRoutes from "./routes/venue.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

app.use(cors({
    origin: config.clientUrl,
    credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.send('DreamVenue server is running!');
});

// Use Routes
app.use("/api", venueRoutes);
app.use("/api", vendorRoutes);
app.use("/api", bookingRoutes);
app.use("/api", userRoutes);
app.use("/api", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Start Server
const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(config.port, () => {
            console.log(`DreamVenue app listening on port ${config.port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();