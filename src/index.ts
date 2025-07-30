import 'dotenv/config';
import express from "express";
import cors from "cors";
import ip from "ip"
import config from './config.js';
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import productRoutes from "./routes/product.routes.js"
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
    'https://auth-frontend-dun.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Authentication & Product App!"
    });
});

// Handle preflight requests
app.options('*', cors());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);



const port = Number(config.env.port) || 4000;

app.listen(config.env.port, () => {
    console.log(`Server running on http://${ip.address()}:${port}`);
});