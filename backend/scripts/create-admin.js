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
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
function createInitialAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if admin already exists
            const existingAdmin = yield prisma.users.findUnique({
                where: { username: 'admin' }
            });
            if (existingAdmin) {
                console.log('Admin user already exists');
                return;
            }
            // Hash the password
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash('admin123', salt);
            // Create admin user
            const admin = yield prisma.users.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    role: 'ceo',
                    name: 'System Administrator',
                    email: 'admin@primemotors.com',
                    isActive: true
                }
            });
            console.log('Admin user created successfully:', {
                id: admin.id,
                username: admin.username,
                role: admin.role
            });
        }
        catch (error) {
            console.error('Error creating admin user:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the script
createInitialAdmin();
