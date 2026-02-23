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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("../src/lib/prisma"));
const readline_1 = __importDefault(require("readline"));
// Load env from backend/.env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '..', '.env') });
const PRESERVE = ['users', 'branches', '_prisma_migrations', 'prisma_migrations'];
function ask(question) {
    return __awaiter(this, void 0, void 0, function* () {
        const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => rl.question(question, ans => {
            rl.close();
            resolve(ans.trim());
        }));
    });
}
function backupPreserved(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs_1.default.promises.mkdir(dir, { recursive: true });
        console.log('Backing up preserved tables to', dir);
        const users = yield prisma_1.default.users.findMany();
        yield fs_1.default.promises.writeFile(path_1.default.join(dir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
        const branches = yield prisma_1.default.branches.findMany();
        yield fs_1.default.promises.writeFile(path_1.default.join(dir, 'branches.json'), JSON.stringify(branches, null, 2), 'utf8');
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            console.log('Purge runner starting. .env DATABASE_URL used:', !!process.env.DATABASE_URL);
            const autoConfirm = process.env.CONFIRM === 'yes' || process.argv.includes('--yes');
            if (!autoConfirm) {
                const answer = yield ask('This will DELETE ALL DATA except users and branches. Type YES to continue: ');
                if (answer !== 'YES') {
                    console.log('Aborting. No changes made.');
                    process.exit(0);
                }
            }
            const doBackup = process.argv.includes('--backup');
            const backupDir = path_1.default.resolve(__dirname, '..', 'db', 'backups', `${Date.now()}`);
            if (doBackup) {
                console.log('Creating JSON backups for preserved tables...');
                yield backupPreserved(backupDir);
            }
            // Get list of tables to truncate
            const excludeList = PRESERVE.map(n => `'${n}'`).join(', ');
            const rows = yield prisma_1.default.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (${excludeList}) ORDER BY tablename`);
            if (!rows || rows.length === 0) {
                console.log('No tables found to truncate (after exclusions). Nothing to do.');
                return;
            }
            const tableNames = rows.map(r => r.tablename).filter(n => n && n.length > 0);
            console.log('Tables to truncate:', tableNames.join(', '));
            // Double-check counts before truncation
            console.log('Row counts (before):');
            for (const t of tableNames.slice(0, 30)) {
                try {
                    // Use format to avoid quoting issues
                    const res = yield prisma_1.default.$queryRawUnsafe(`SELECT count(*)::text as count FROM "${t}"`);
                    console.log(`  ${t}: ${(_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : '0'}`);
                }
                catch (err) {
                    console.log(`  ${t}: (count failed)`, err.message);
                }
            }
            // Perform truncation
            const quoted = tableNames.map(n => `"${n.replace(/"/g, '""')}"`).join(', ');
            console.log('Executing TRUNCATE...');
            yield prisma_1.default.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
            console.log('Truncation complete. Row counts (after):');
            const preservedCountsUsers = yield prisma_1.default.$queryRawUnsafe('SELECT count(*)::text as count FROM "users"');
            const preservedCountsBranches = yield prisma_1.default.$queryRawUnsafe('SELECT count(*)::text as count FROM "branches"');
            console.log(`  users: ${(_d = (_c = preservedCountsUsers[0]) === null || _c === void 0 ? void 0 : _c.count) !== null && _d !== void 0 ? _d : '0'}`);
            console.log(`  branches: ${(_f = (_e = preservedCountsBranches[0]) === null || _e === void 0 ? void 0 : _e.count) !== null && _f !== void 0 ? _f : '0'}`);
            if (doBackup)
                console.log('Backups are in', backupDir);
            console.log('Purge finished successfully.');
        }
        catch (err) {
            console.error('Purge failed:', err);
            process.exitCode = 1;
        }
        finally {
            yield prisma_1.default.$disconnect();
        }
    });
}
main();
