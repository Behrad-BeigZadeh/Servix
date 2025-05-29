"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/app.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const users_route_1 = __importDefault(require("./routes/users.route"));
const services_route_1 = __importDefault(require("./routes/services.route"));
const bookings_route_1 = __importDefault(require("./routes/bookings.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const category_route_1 = __importDefault(require("./routes/category.route"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
app.use("/api/auth", auth_route_1.default);
app.use("/api/users", users_route_1.default);
app.use("/api/services", services_route_1.default);
app.use("/api/bookings", bookings_route_1.default);
app.use("/api/chat", chat_route_1.default);
app.use("/api/categories", category_route_1.default);
exports.default = app;
