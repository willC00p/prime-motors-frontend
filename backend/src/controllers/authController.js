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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_1 = require("../utils/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
function isValidUserRole(role) {
    return ['gm', 'ceo', 'nsm', 'purchasing', 'accounting', 'finance', 'audit', 'branch'].includes(role);
}
exports.authController = {
    login: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { username, password } = req.body;
            const user = yield prisma_1.default.users.findUnique({
                where: { username }
            });
            if (!user) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is disabled' });
            }
            const isValidPassword = yield (0, auth_1.comparePassword)(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            // Validate user role
            if (!isValidUserRole(user.role)) {
                return res.status(500).json({ message: 'Invalid user role in database' });
            }
            // Create token payload without sensitive data
            const userWithoutPassword = {
                id: user.id,
                username: user.username,
                role: user.role, // Now safe to cast after validation
                branchId: user.branchId,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
            const token = (0, auth_1.generateToken)(userWithoutPassword);
            res.json({
                user: userWithoutPassword,
                token
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    logout: (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        // Since we're using JWT, we don't need to do anything server-side
        // The client will remove the token
        res.json({ message: 'Logged out successfully' });
    }),
    getCurrentUser: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return res.status(401).json({ message: 'Not authenticated' });
            }
            const user = yield prisma_1.default.users.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is disabled' });
            }
            // Validate user role
            if (!isValidUserRole(user.role)) {
                return res.status(500).json({ message: 'Invalid user role in database' });
            }
            // Remove password and cast role
            const { password: _ } = user, rest = __rest(user, ["password"]);
            const userWithoutPassword = Object.assign(Object.assign({}, rest), { role: user.role // Safe to cast after validation
             });
            res.json(userWithoutPassword);
        }
        catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    })
};
