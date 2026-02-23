"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.comparePassword = exports.hashPassword = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign(user, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateToken = generateToken;
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcrypt_1.default.genSalt(10);
    return bcrypt_1.default.hash(password, salt);
});
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return bcrypt_1.default.compare(password, hash);
});
exports.comparePassword = comparePassword;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader); // Debug log
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted token:', token); // Debug log
    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required' });
    }
    try {
        const user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('Verified user:', user); // Debug log
        req.user = user;
        next();
    }
    catch (err) {
        console.error('Token verification error:', err); // Debug log
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
