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
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
const users = [
    // Management Users
    {
        username: 'admin',
        password: 'password123',
        role: 'gm',
        name: 'System Administrator',
        email: 'admin@primemotors.com',
        branchId: null
    },
    {
        username: 'ceo',
        password: 'password123',
        role: 'ceo',
        name: 'Chief Executive Officer',
        email: 'ceo@primemotors.com',
        branchId: null
    },
    {
        username: 'gm',
        password: 'password123',
        role: 'gm',
        name: 'General Manager',
        email: 'gm@primemotors.com',
        branchId: null
    },
    {
        username: 'nsm',
        password: 'password123',
        role: 'nsm',
        name: 'National Sales Manager',
        email: 'nsm@primemotors.com',
        branchId: null
    },
    // Department Heads
    {
        username: 'purchasing',
        password: 'password123',
        role: 'purchasing',
        name: 'Purchasing Manager',
        email: 'purchasing@primemotors.com',
        branchId: null
    },
    {
        username: 'accounting',
        password: 'password123',
        role: 'accounting',
        name: 'Accounting Manager',
        email: 'accounting@primemotors.com',
        branchId: null
    },
    {
        username: 'finance',
        password: 'password123',
        role: 'finance',
        name: 'Finance Manager',
        email: 'finance@primemotors.com',
        branchId: null
    },
    {
        username: 'audit',
        password: 'password123',
        role: 'audit',
        name: 'Audit Manager',
        email: 'audit@primemotors.com',
        branchId: null
    },
    // Branch Users
    {
        username: 'branch1',
        password: 'password123',
        role: 'branch',
        name: 'Branch 1 Manager',
        email: 'branch1@primemotors.com',
        branchId: 1
    }
];
function setupUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // First, delete existing test users
            console.log('Cleaning up existing users...');
            yield prisma.users.deleteMany({
                where: {
                    username: {
                        in: users.map(u => u.username)
                    }
                }
            });
            // Create new users with hashed passwords
            console.log('Creating new users...');
            for (const user of users) {
                const hashedPassword = yield bcrypt_1.default.hash(user.password, SALT_ROUNDS);
                yield prisma.users.create({
                    data: {
                        username: user.username,
                        password: hashedPassword,
                        role: user.role,
                        name: user.name,
                        email: user.email,
                        branchId: user.branchId,
                        isActive: true
                    }
                });
                console.log(`Created user: ${user.username}`);
            }
            console.log('✅ Users setup completed successfully');
        }
        catch (error) {
            console.error('Error setting up users:', error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the setup
setupUsers().catch(console.error);
