#!/usr/bin/env ts-node
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const fileArg = process.argv[2];
        if (!fileArg) {
            console.error('Usage: ts-node scripts/apply-sql.ts <path-to-sql>');
            process.exit(2);
        }
        const filePath = path_1.default.isAbsolute(fileArg) ? fileArg : path_1.default.join(__dirname, '..', fileArg);
        if (!fs_1.default.existsSync(filePath)) {
            console.error('SQL file not found:', filePath);
            process.exit(2);
        }
        const sql = fs_1.default.readFileSync(filePath, 'utf8');
        const url = process.env.DATABASE_URL;
        if (!url) {
            console.error('DATABASE_URL not set. Please set it in backend/.env');
            process.exit(2);
        }
        const client = new pg_1.Client({ connectionString: url });
        try {
            yield client.connect();
            console.log('[apply-sql] Applying:', filePath);
            yield client.query('BEGIN');
            yield client.query(sql);
            yield client.query('COMMIT');
            console.log('[apply-sql] Done.');
        }
        catch (e) {
            try {
                yield client.query('ROLLBACK');
            }
            catch (_a) { }
            console.error('[apply-sql] Failed:', (e === null || e === void 0 ? void 0 : e.message) || e);
            process.exit(1);
        }
        finally {
            yield client.end();
        }
    });
}
main();
