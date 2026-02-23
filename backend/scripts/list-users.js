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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
function listUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        try {
            const result = yield client.query(`
      SELECT id, username, role, name, email, "isActive"
      FROM users
      ORDER BY id;
    `);
            console.log('Users in the database:');
            console.table(result.rows);
        }
        catch (error) {
            console.error('Error listing users:', error);
        }
        finally {
            client.release();
            yield pool.end();
        }
    });
}
listUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
