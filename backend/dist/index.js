"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const users_route_1 = __importDefault(require("./routes/users.route"));
const services_route_1 = __importDefault(require("./routes/services.route"));
const bookings_route_1 = __importDefault(require("./routes/bookings.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const category_route_1 = __importDefault(require("./routes/category.route"));
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./sockets/socket");
const prisma_1 = require("./lib/prisma");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
socket_1.app.use(express_1.default.json());
socket_1.app.use((0, cookie_parser_1.default)());
socket_1.app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
socket_1.app.use("/api/auth", auth_route_1.default);
socket_1.app.use("/api/users", users_route_1.default);
socket_1.app.use("/api/services", services_route_1.default);
socket_1.app.use("/api/bookings", bookings_route_1.default);
socket_1.app.use("/api/chat", chat_route_1.default);
socket_1.app.use("/api/categories", category_route_1.default);
socket_1.server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    prisma_1.prisma
        .$connect()
        .then(() => {
        console.log("Connected to database successfully");
    })
        .catch((error) => {
        console.error("Error connecting to the database", error);
    });
});
