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
exports.listInventory = listInventory;
exports.updateInventory = updateInventory;
exports.deleteInventory = deleteInventory;
exports.createInventory = createInventory;
exports.listTransferred = listTransferred;
exports.transferUnit = transferUnit;
const prisma_1 = __importDefault(require("../lib/prisma"));
function listInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get current inventory with engine/chassis numbers
            // Fetch inventory (include units). We'll filter transferred units in JS before sending to frontend
            const inventory = yield prisma_1.default.inventory_movements.findMany({
                include: {
                    items: true,
                    branches: true,
                    suppliers: true,
                    vehicle_units: {
                        orderBy: {
                            unit_number: 'asc'
                        }
                    }
                },
                orderBy: { id: 'desc' }
            });
            // Normalize vehicle units to match dashboard logic: exclude transferred units, keep status
            const current = inventory.map((item) => {
                const hasTransferred = (item.vehicle_units || []).some((u) => (u === null || u === void 0 ? void 0 : u.transferred) === true);
                return Object.assign(Object.assign({}, item), { has_transferred: hasTransferred, vehicle_units: (item.vehicle_units || [])
                        .filter((u) => (u === null || u === void 0 ? void 0 : u.transferred) !== true)
                        .map((u) => ({
                        id: u.id,
                        unit_number: u.unit_number,
                        chassis_no: u.chassis_no || '',
                        engine_no: u.engine_no || '',
                        status: u.status || 'available',
                    })) });
            });
            // Get all PO items with delivery_status 'pending'
            const pendingPOItems = yield prisma_1.default.purchase_order_items.findMany({
                where: {
                    delivery_status: 'pending'
                },
                include: {
                    items: true,
                    purchase_orders: {
                        include: {
                            branches: true,
                            suppliers: true
                        }
                    }
                }
            });
            // Transform pending PO items into a similar format as inventory items
            const pendingItems = pendingPOItems.map((item) => {
                var _a;
                const po = item.purchase_orders;
                return {
                    id: `pending-${item.purchase_order_id}-${item.id}`,
                    item_id: item.item_id,
                    branch_id: po === null || po === void 0 ? void 0 : po.branch_id,
                    supplier_id: po === null || po === void 0 ? void 0 : po.supplier_id,
                    po_number: po === null || po === void 0 ? void 0 : po.po_number,
                    date_issued: po === null || po === void 0 ? void 0 : po.date_issued,
                    status: 'pending',
                    cost: Number(item.unit_price),
                    srp: (_a = item.items) === null || _a === void 0 ? void 0 : _a.srp,
                    purchased_qty: item.quantity,
                    items: item.items,
                    branches: po === null || po === void 0 ? void 0 : po.branches,
                    suppliers: po === null || po === void 0 ? void 0 : po.suppliers,
                    prepared_by: po === null || po === void 0 ? void 0 : po.prepared_by,
                    checked_by: po === null || po === void 0 ? void 0 : po.checked_by
                };
            });
            // Send both current inventory and pending items
            res.json({
                current,
                pending: pendingItems
            });
        }
        catch (error) {
            console.error('Error fetching inventory:', error);
            res.status(500).json({ error: 'Failed to fetch inventory data' });
        }
    });
}
function updateInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'Invalid inventory ID' });
                return;
            }
            const input = req.body;
            const { color, engine_no, chassis_no, vehicle_units = [], units = [] } = input, validInput = __rest(input, ["color", "engine_no", "chassis_no", "vehicle_units", "units"]);
            if (typeof color !== 'string' || !color) {
                return res.status(400).json({ error: 'Color is required and must be a string' });
            }
            const actualUnits = Array.isArray(vehicle_units) && vehicle_units.length > 0 ? vehicle_units : units;
            let data = {
                branch_id: validInput.branch_id ? Number(validInput.branch_id) : undefined,
                supplier_id: validInput.supplier_id ? Number(validInput.supplier_id) : undefined,
                cost: validInput.cost ? Number(validInput.cost) : undefined,
                srp: validInput.srp ? Number(validInput.srp) : undefined,
                purchased_qty: validInput.purchased_qty ? Number(validInput.purchased_qty) : undefined,
                beginning_qty: validInput.beginning_qty ? Number(validInput.beginning_qty) : undefined,
                transferred_qty: validInput.transferred_qty ? Number(validInput.transferred_qty) : undefined,
                sold_qty: validInput.sold_qty ? Number(validInput.sold_qty) : undefined,
                date_received: validInput.date_received ? new Date(validInput.date_received) : undefined,
                dr_no: validInput.dr_no,
                si_no: validInput.si_no,
                remarks: validInput.remarks,
                color: color,
            };
            Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
            // Update inventory record
            const record = yield prisma_1.default.inventory_movements.update({
                where: { id },
                data: Object.assign(Object.assign({}, data), { color: color }),
                include: {
                    items: true,
                    branches: true,
                    suppliers: true,
                }
            });
            // Only delete vehicle units that are available (never delete sold or reserved) and never delete units already transferred
            const allUnits = yield prisma_1.default.vehicle_units.findMany({ where: { inventory_id: id } });
            // Find units to delete: present in DB but not in new list, and status is 'available' and not transferred
            const newUnitIds = Array.isArray(actualUnits) ? actualUnits.filter((u) => u.id).map((u) => u.id) : [];
            const toDelete = allUnits.filter((u) => !newUnitIds.includes(u.id) && (u.status === 'available' || !u.status) && u.transferred !== true);
            if (toDelete.length > 0) {
                yield prisma_1.default.vehicle_units.deleteMany({
                    where: {
                        id: { in: toDelete.map((u) => u.id) },
                        status: { in: ['available'] },
                    },
                });
            }
            // Add or update units (do not touch sold or reserved units)
            if (Array.isArray(actualUnits) && actualUnits.length > 0) {
                let unitNumber = 1;
                for (const unit of actualUnits) {
                    // Try to find an existing unit with same chassis/engine
                    const existing = allUnits.find((u) => (u.chassis_no === unit.chassis_no && u.engine_no === unit.engine_no));
                    if (!existing) {
                        yield prisma_1.default.vehicle_units.create({
                            data: {
                                inventory_id: id,
                                unit_number: unitNumber,
                                chassis_no: unit.chassis_no,
                                engine_no: unit.engine_no
                            }
                        });
                    }
                    unitNumber++;
                }
            }
            // Return updated record with units
            const updatedRecord = yield prisma_1.default.inventory_movements.findUnique({
                where: { id },
                include: {
                    items: true,
                    branches: true,
                    suppliers: true,
                    vehicle_units: true
                }
            });
            res.json(updatedRecord);
        }
        catch (e) {
            console.error('Error updating inventory:', e);
            res.status(500).json({ error: e.message });
        }
    });
}
// Delete inventory endpoint
function deleteInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid inventory ID' });
            }
            // Force delete: delete all vehicle units and the inventory record, regardless of status or sales
            yield prisma_1.default.vehicle_units.deleteMany({ where: { inventory_id: id } });
            yield prisma_1.default.inventory_movements.delete({ where: { id } });
            res.json({ success: true });
        }
        catch (e) {
            console.error('Error deleting inventory:', e);
            res.status(500).json({ error: e.message });
        }
    });
}
function createInventory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Received create payload:', req.body); // Debug log
            const input = req.body;
            // Accept vehicle_units from frontend, fallback to units for backward compatibility
            const { color, // now belongs to inventory_movements
            vehicle_units = [], units = [] } = input, // prefer vehicle_units
            validInput = __rest(input, ["color", "vehicle_units", "units"]);
            // Ensure color is properly handled
            if (typeof color !== 'string' || !color) {
                return res.status(400).json({ error: 'Color is required and must be a string' });
            }
            const actualUnits = Array.isArray(vehicle_units) && vehicle_units.length > 0 ? vehicle_units : units;
            // Convert string fields to numbers and date to Date object
            let data = {
                branch_id: validInput.branch_id ? Number(validInput.branch_id) : undefined,
                item_id: validInput.item_id ? Number(validInput.item_id) : undefined,
                supplier_id: validInput.supplier_id ? Number(validInput.supplier_id) : undefined,
                cost: validInput.cost ? Number(validInput.cost) : undefined,
                purchased_qty: validInput.purchased_qty ? Number(validInput.purchased_qty) : undefined,
                beginning_qty: validInput.beginning_qty ? Number(validInput.beginning_qty) : undefined,
                transferred_qty: validInput.transferred_qty ? Number(validInput.transferred_qty) : undefined,
                sold_qty: validInput.sold_qty ? Number(validInput.sold_qty) : undefined,
                date_received: validInput.date_received ? new Date(validInput.date_received) : undefined,
                dr_no: validInput.dr_no,
                si_no: validInput.si_no,
                remarks: validInput.remarks,
                color: color !== null && color !== void 0 ? color : null,
            };
            // Remove undefined fields
            Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
            // Debug log before Prisma create
            console.log('Creating inventory with data:', JSON.stringify(data, null, 2));
            console.log('Final create data:', Object.assign(Object.assign({}, data), { color })); // Debug log
            // Create inventory movement record with vehicle units
            const record = yield prisma_1.default.inventory_movements.create({
                data: Object.assign(Object.assign({}, data), { color, vehicle_units: actualUnits.length > 0 ? {
                        create: actualUnits.map((unit, index) => ({
                            unit_number: index + 1,
                            chassis_no: unit.chassis_no,
                            engine_no: unit.engine_no
                        }))
                    } : undefined }),
                include: {
                    items: true,
                    branches: true,
                    suppliers: true,
                    vehicle_units: true
                }
            });
            // Debug log after creation
            console.log('Created inventory record:', JSON.stringify(record, null, 2));
            res.status(201).json(record);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    });
}
// List transferred vehicle units (for Transferred tab)
function listTransferred(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // First, fetch entries from transferred_history
            const thRows = yield prisma_1.default.transferred_history.findMany({ orderBy: { id: 'desc' } });
            // Fetch helper maps for branches, items and suppliers to attach names
            const [branchesList, itemsList, suppliersList] = yield Promise.all([
                prisma_1.default.branches.findMany(),
                prisma_1.default.items.findMany(),
                prisma_1.default.suppliers.findMany()
            ]);
            const branchById = new Map(branchesList.map((b) => [b.id, b]));
            const itemById = new Map(itemsList.map((it) => [it.id, it]));
            const supplierById = new Map(suppliersList.map((s) => [s.id, s]));
            // Group transferred_history rows by engine|chassis key
            const thGroups = new Map();
            for (const r of thRows) {
                const key = `${r.engine_no || ''}|${r.chassis_no || ''}`;
                if (!thGroups.has(key))
                    thGroups.set(key, []);
                thGroups.get(key).push(r);
            }
            const results = [];
            thGroups.forEach((arr) => {
                // For each entry in the group, produce a result with counterparts
                arr.forEach((r) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    const others = arr.filter((x) => x.id !== r.id);
                    results.push({
                        id: r.id,
                        engine_no: r.engine_no,
                        chassis_no: r.chassis_no,
                        branch: ((_a = branchById.get(r.branch_id)) === null || _a === void 0 ? void 0 : _a.name) || null,
                        branch_id: r.branch_id,
                        transferred: true,
                        item: itemById.get(r.item_id) || null,
                        inventory_id: r.original_inventory_id || null,
                        // include transferred_history specific fields (mirror schema)
                        date_received: r.date_received || null,
                        supplier_id: (_b = r.supplier_id) !== null && _b !== void 0 ? _b : null,
                        supplier_name: ((_c = supplierById.get(r.supplier_id || -1)) === null || _c === void 0 ? void 0 : _c.name) || null,
                        dr_no: r.dr_no || null,
                        si_no: r.si_no || null,
                        cost: (_d = r.cost) !== null && _d !== void 0 ? _d : null,
                        beginning_qty: (_e = r.beginning_qty) !== null && _e !== void 0 ? _e : null,
                        purchased_qty: (_f = r.purchased_qty) !== null && _f !== void 0 ? _f : null,
                        transferred_qty: (_g = r.transferred_qty) !== null && _g !== void 0 ? _g : null,
                        sold_qty: (_h = r.sold_qty) !== null && _h !== void 0 ? _h : null,
                        ending_qty: (_j = r.ending_qty) !== null && _j !== void 0 ? _j : null,
                        created_at: r.created_at || null,
                        srp: (_k = r.srp) !== null && _k !== void 0 ? _k : null,
                        margin: (_l = r.margin) !== null && _l !== void 0 ? _l : null,
                        color: r.color || null,
                        status: r.status || null,
                        remarks: r.remarks || null,
                        unit_number: (_m = r.unit_number) !== null && _m !== void 0 ? _m : null,
                        unit_created_at: r.unit_created_at || null,
                        unit_status: r.unit_status || null,
                        original_vehicle_unit_id: (_o = r.original_vehicle_unit_id) !== null && _o !== void 0 ? _o : null,
                        counterparts: others.map((d) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                            return ({
                                id: d.id,
                                branch: ((_a = branchById.get(d.branch_id)) === null || _a === void 0 ? void 0 : _a.name) || null,
                                branch_id: d.branch_id,
                                inventory_id: d.original_inventory_id || null,
                                supplier_id: (_b = d.supplier_id) !== null && _b !== void 0 ? _b : null,
                                supplier_name: ((_c = supplierById.get(d.supplier_id || -1)) === null || _c === void 0 ? void 0 : _c.name) || null,
                                engine_no: d.engine_no,
                                chassis_no: d.chassis_no,
                                transferred: true,
                                date_received: d.date_received || null,
                                dr_no: d.dr_no || null,
                                si_no: d.si_no || null,
                                cost: (_d = d.cost) !== null && _d !== void 0 ? _d : null,
                                beginning_qty: (_e = d.beginning_qty) !== null && _e !== void 0 ? _e : null,
                                purchased_qty: (_f = d.purchased_qty) !== null && _f !== void 0 ? _f : null,
                                transferred_qty: (_g = d.transferred_qty) !== null && _g !== void 0 ? _g : null,
                                sold_qty: (_h = d.sold_qty) !== null && _h !== void 0 ? _h : null,
                                ending_qty: (_j = d.ending_qty) !== null && _j !== void 0 ? _j : null,
                                created_at: d.created_at || null,
                                srp: (_k = d.srp) !== null && _k !== void 0 ? _k : null,
                                margin: (_l = d.margin) !== null && _l !== void 0 ? _l : null,
                                color: d.color || null,
                                status: d.status || null,
                                remarks: d.remarks || null,
                                unit_number: (_m = d.unit_number) !== null && _m !== void 0 ? _m : null,
                                unit_created_at: d.unit_created_at || null,
                                unit_status: (_o = d.unit_status) !== null && _o !== void 0 ? _o : null,
                                original_vehicle_unit_id: (_p = d.original_vehicle_unit_id) !== null && _p !== void 0 ? _p : null
                            });
                        })
                    });
                });
            });
            // Additionally, include cross-branch vehicle_units as before (in case some transfers are represented there)
            const units = yield prisma_1.default.vehicle_units.findMany({
                where: {
                    OR: [
                        { engine_no: { not: null } },
                        { chassis_no: { not: null } }
                    ]
                },
                include: {
                    inventory: { include: { branches: true, items: true } }
                }
            });
            const vuGroups = new Map();
            for (const u of units) {
                const key = `${u.engine_no || ''}|${u.chassis_no || ''}`;
                if (!vuGroups.has(key))
                    vuGroups.set(key, []);
                vuGroups.get(key).push(u);
            }
            vuGroups.forEach((arr) => {
                const branchesSet = new Set(arr.map((x) => { var _a; return (_a = x.inventory) === null || _a === void 0 ? void 0 : _a.branch_id; }));
                if (branchesSet.size > 1) {
                    arr.forEach((u) => {
                        var _a, _b, _c, _d;
                        const others = arr.filter((x) => x.id !== u.id);
                        results.push({
                            id: u.id,
                            engine_no: u.engine_no,
                            chassis_no: u.chassis_no,
                            branch: ((_b = (_a = u.inventory) === null || _a === void 0 ? void 0 : _a.branches) === null || _b === void 0 ? void 0 : _b.name) || null,
                            branch_id: (_c = u.inventory) === null || _c === void 0 ? void 0 : _c.branch_id,
                            transferred: u.transferred === true,
                            item: ((_d = u.inventory) === null || _d === void 0 ? void 0 : _d.items) || null,
                            inventory_id: u.inventory_id,
                            counterparts: others.map((d) => {
                                var _a, _b, _c;
                                return ({
                                    id: d.id,
                                    branch: ((_b = (_a = d.inventory) === null || _a === void 0 ? void 0 : _a.branches) === null || _b === void 0 ? void 0 : _b.name) || null,
                                    branch_id: (_c = d.inventory) === null || _c === void 0 ? void 0 : _c.branch_id,
                                    inventory_id: d.inventory_id,
                                    engine_no: d.engine_no,
                                    chassis_no: d.chassis_no,
                                    transferred: d.transferred === true
                                });
                            })
                        });
                    });
                }
            });
            // Deduplicate results by key (engine|chassis|branch|inventory_id) to avoid double entries
            const seen = new Set();
            const deduped = [];
            for (const r of results) {
                const key = `${r.engine_no || ''}|${r.chassis_no || ''}|${r.branch_id || ''}|${r.inventory_id || ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    deduped.push(r);
                }
            }
            res.json(deduped);
        }
        catch (e) {
            console.error('Error listing transferred units:', e);
            res.status(500).json({ error: e.message });
        }
    });
}
// Transfer a single vehicle unit to another branch
function transferUnit(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        try {
            const { unit_id, to_branch_id, remarks } = req.body;
            if (!unit_id || !to_branch_id)
                return res.status(400).json({ error: 'unit_id and to_branch_id are required' });
            const unit = yield prisma_1.default.vehicle_units.findUnique({
                where: { id: Number(unit_id) },
                include: { inventory: { include: { branches: true, items: true } } }
            });
            if (!unit)
                return res.status(404).json({ error: 'Unit not found' });
            if (unit.transferred === true)
                return res.status(400).json({ error: 'Unit already transferred' });
            // Mark original unit as transferred
            yield prisma_1.default.vehicle_units.update({ where: { id: unit.id }, data: { transferred: true } });
            // Increment transferred_qty on original inventory record and append remark
            const fromBranchName = ((_b = (_a = unit.inventory) === null || _a === void 0 ? void 0 : _a.branches) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown';
            const toBranch = yield prisma_1.default.branches.findUnique({ where: { id: Number(to_branch_id) } });
            const toBranchName = (toBranch === null || toBranch === void 0 ? void 0 : toBranch.name) || `Branch ${to_branch_id}`;
            const remarkLine = `Transferred from ${fromBranchName} to ${toBranchName} (engine: ${unit.engine_no || '-'}, chassis: ${unit.chassis_no || '-'})`;
            const originalRemarks = ((_c = unit.inventory) === null || _c === void 0 ? void 0 : _c.remarks) || '';
            const newRemarks = [originalRemarks, remarks || '', remarkLine].filter(Boolean).join('\n');
            yield prisma_1.default.inventory_movements.update({ where: { id: unit.inventory_id }, data: { transferred_qty: { increment: 1 }, remarks: newRemarks } });
            // Create a transferred_history record for the origin branch so we keep a history of the unit
            try {
                yield prisma_1.default.transferred_history.create({
                    data: {
                        branch_id: ((_d = unit.inventory) === null || _d === void 0 ? void 0 : _d.branch_id) || null,
                        item_id: ((_e = unit.inventory) === null || _e === void 0 ? void 0 : _e.item_id) || null,
                        date_received: ((_f = unit.inventory) === null || _f === void 0 ? void 0 : _f.date_received) ? new Date(unit.inventory.date_received) : new Date(),
                        supplier_id: ((_g = unit.inventory) === null || _g === void 0 ? void 0 : _g.supplier_id) || null,
                        dr_no: ((_h = unit.inventory) === null || _h === void 0 ? void 0 : _h.dr_no) || null,
                        si_no: ((_j = unit.inventory) === null || _j === void 0 ? void 0 : _j.si_no) || null,
                        cost: (_l = (_k = unit.inventory) === null || _k === void 0 ? void 0 : _k.cost) !== null && _l !== void 0 ? _l : 0,
                        beginning_qty: (_o = (_m = unit.inventory) === null || _m === void 0 ? void 0 : _m.beginning_qty) !== null && _o !== void 0 ? _o : null,
                        purchased_qty: 1,
                        transferred_qty: 1,
                        sold_qty: 0,
                        ending_qty: (_q = (_p = unit.inventory) === null || _p === void 0 ? void 0 : _p.ending_qty) !== null && _q !== void 0 ? _q : null,
                        remarks: newRemarks || null,
                        srp: (_s = (_r = unit.inventory) === null || _r === void 0 ? void 0 : _r.srp) !== null && _s !== void 0 ? _s : null,
                        margin: (_u = (_t = unit.inventory) === null || _t === void 0 ? void 0 : _t.margin) !== null && _u !== void 0 ? _u : null,
                        color: (_w = (_v = unit.inventory) === null || _v === void 0 ? void 0 : _v.color) !== null && _w !== void 0 ? _w : null,
                        status: 'transferred',
                        chassis_no: unit.chassis_no || null,
                        engine_no: unit.engine_no || null,
                        unit_number: (_x = unit.unit_number) !== null && _x !== void 0 ? _x : null,
                        unit_created_at: unit.created_at || null,
                        unit_status: unit.status || null,
                        original_inventory_id: unit.inventory_id || null,
                        original_vehicle_unit_id: unit.id || null,
                    }
                });
            }
            catch (thErr) {
                console.error('Failed to create transferred_history record:', thErr);
                // Do not block transfer if history insert fails; continue
            }
            // Create a new inventory_movements record in destination branch and add the unit there
            const newInv = yield prisma_1.default.inventory_movements.create({
                data: {
                    branch_id: Number(to_branch_id),
                    item_id: unit.inventory.item_id,
                    date_received: new Date(),
                    cost: unit.inventory.cost,
                    srp: unit.inventory.srp,
                    purchased_qty: 1,
                    color: unit.inventory.color,
                    remarks: `Received by transfer from ${fromBranchName}. ${remarks || ''}`,
                    vehicle_units: {
                        create: {
                            unit_number: 1,
                            chassis_no: unit.chassis_no,
                            engine_no: unit.engine_no,
                            status: unit.status || 'available'
                        }
                    }
                },
                include: { branches: true, items: true, vehicle_units: true }
            });
            res.json({ success: true, original_unit_id: unit.id, new_inventory: newInv });
        }
        catch (e) {
            console.error('Error transferring unit:', e);
            res.status(500).json({ error: e.message });
        }
    });
}
