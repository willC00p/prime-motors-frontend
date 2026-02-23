import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function listInventory(req: Request, res: Response) {
  try {
    // Get current inventory with engine/chassis numbers
    // Fetch inventory (include units). We'll filter transferred units in JS before sending to frontend
    const inventory = await prisma.inventory_movements.findMany({
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
    const current = inventory.map((item: any) => {
      const hasTransferred = (item.vehicle_units || []).some((u: any) => u?.transferred === true);
      return {
        ...item,
        has_transferred: hasTransferred,
        vehicle_units: (item.vehicle_units || [])
          .filter((u: any) => u?.transferred !== true)
          .map((u: any) => ({
            id: u.id,
            unit_number: u.unit_number,
            chassis_no: u.chassis_no || '',
            engine_no: u.engine_no || '',
            status: u.status || 'available',
          }))
      };
    });

    // Get all PO items with delivery_status 'pending'
    const pendingPOItems = await prisma.purchase_order_items.findMany({
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
    const pendingItems = pendingPOItems.map((item: any) => {
      const po = item.purchase_orders;
      return {
        id: `pending-${item.purchase_order_id}-${item.id}`,
        item_id: item.item_id,
        branch_id: po?.branch_id,
        supplier_id: po?.supplier_id,
        po_number: po?.po_number,
        date_issued: po?.date_issued,
        status: 'pending',
        cost: Number(item.unit_price),
        srp: item.items?.srp,
        purchased_qty: item.quantity,
        items: item.items,
        branches: po?.branches,
        suppliers: po?.suppliers,
        prepared_by: po?.prepared_by,
        checked_by: po?.checked_by
      };
    });

    // Send both current inventory and pending items
    res.json({
      current,
      pending: pendingItems
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
}

export async function updateInventory(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid inventory ID' });
      return;
    }

    const input = req.body;
    const {
      color,
      engine_no, chassis_no, vehicle_units = [], units = [],
      ...validInput
    } = input;

    if (typeof color !== 'string' || !color) {
      return res.status(400).json({ error: 'Color is required and must be a string' });
    }

    const actualUnits = Array.isArray(vehicle_units) && vehicle_units.length > 0 ? vehicle_units : units;

    let data: any = {
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
    const record = await prisma.inventory_movements.update({
      where: { id },
      data: {
        ...data,
        color: color,
      },
      include: {
        items: true,
        branches: true,
        suppliers: true,
      }
    });

  // Only delete vehicle units that are available (never delete sold or reserved) and never delete units already transferred
  const allUnits = await prisma.vehicle_units.findMany({ where: { inventory_id: id } });
  // Find units to delete: present in DB but not in new list, and status is 'available' and not transferred
  const newUnitIds = Array.isArray(actualUnits) ? actualUnits.filter((u: any) => u.id).map((u: any) => u.id) : [];
  const toDelete = allUnits.filter((u: typeof allUnits[0]) => !newUnitIds.includes(u.id) && (u.status === 'available' || !u.status) && (u as any).transferred !== true);
    if (toDelete.length > 0) {
      await prisma.vehicle_units.deleteMany({
        where: {
          id: { in: toDelete.map((u: typeof allUnits[0]) => u.id) },
          status: { in: ['available'] },
        },
      });
    }
    // Add or update units (do not touch sold or reserved units)
    if (Array.isArray(actualUnits) && actualUnits.length > 0) {
      let unitNumber = 1;
      for (const unit of actualUnits) {
        // Try to find an existing unit with same chassis/engine
        const existing = allUnits.find((u: typeof allUnits[0]) => (u.chassis_no === unit.chassis_no && u.engine_no === unit.engine_no));
        if (!existing) {
          await prisma.vehicle_units.create({
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
    const updatedRecord = await prisma.inventory_movements.findUnique({
      where: { id },
      include: {
        items: true,
        branches: true,
        suppliers: true,
        vehicle_units: true
      }
    });
    res.json(updatedRecord);
  } catch (e) {
    console.error('Error updating inventory:', e);
    res.status(500).json({ error: (e as Error).message });
  }
}
// Delete inventory endpoint
export async function deleteInventory(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid inventory ID' });
    }
  // Force delete: delete all vehicle units and the inventory record, regardless of status or sales
  await prisma.vehicle_units.deleteMany({ where: { inventory_id: id } });
  await prisma.inventory_movements.delete({ where: { id } });
  res.json({ success: true });
  } catch (e) {
    console.error('Error deleting inventory:', e);
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function createInventory(req: Request, res: Response) {
  try {
    console.log('Received create payload:', req.body); // Debug log

    const input = req.body;
    // Accept vehicle_units from frontend, fallback to units for backward compatibility
    const {
      color, // now belongs to inventory_movements
      vehicle_units = [], units = [], // prefer vehicle_units
      ...validInput
    } = input;

    // Ensure color is properly handled
    if (typeof color !== 'string' || !color) {
      return res.status(400).json({ error: 'Color is required and must be a string' });
    }

    const actualUnits = Array.isArray(vehicle_units) && vehicle_units.length > 0 ? vehicle_units : units;

    // Convert string fields to numbers and date to Date object
    let data: any = {
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
      color: color ?? null,
    };

    // Handle SI photo if uploaded
    if ((req as any).file) {
      data.si_photo_key = (req as any).file.filename;
      data.si_photo_url = `/uploads/si_photos/${(req as any).file.filename}`;
    }

    // Remove undefined fields
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // Debug log before Prisma create
    console.log('Creating inventory with data:', JSON.stringify(data, null, 2));

    console.log('Final create data:', { ...data, color }); // Debug log

    // Create inventory movement record with vehicle units
    const record = await prisma.inventory_movements.create({
      data: {
        ...data,
        color, // Explicitly include color field
        vehicle_units: actualUnits.length > 0 ? {
          create: actualUnits.map((unit: { chassis_no?: string; engine_no?: string }, index: number) => ({
            unit_number: index + 1,
            chassis_no: unit.chassis_no,
            engine_no: unit.engine_no
          }))
        } : undefined
      },
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
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

// List transferred vehicle units (for Transferred tab)
export async function listTransferred(req: Request, res: Response) {
  try {
    // First, fetch entries from transferred_history
    const thRows = await (prisma as any).transferred_history.findMany({ orderBy: { id: 'desc' } });

    // Fetch helper maps for branches, items and suppliers to attach names
    const [branchesList, itemsList, suppliersList] = await Promise.all([
      prisma.branches.findMany(),
      prisma.items.findMany(),
      prisma.suppliers.findMany()
    ]);
    const branchById = new Map(branchesList.map((b: any) => [b.id, b]));
    const itemById = new Map(itemsList.map((it: any) => [it.id, it]));
    const supplierById = new Map(suppliersList.map((s: any) => [s.id, s]));

    // Group transferred_history rows by engine|chassis key
    const thGroups = new Map<string, any[]>();
    for (const r of thRows) {
      const key = `${r.engine_no || ''}|${r.chassis_no || ''}`;
      if (!thGroups.has(key)) thGroups.set(key, []);
      thGroups.get(key)!.push(r);
    }

    const results: any[] = [];
    thGroups.forEach((arr) => {
      // For each entry in the group, produce a result with counterparts
      arr.forEach((r: any) => {
        const others = arr.filter((x: any) => x.id !== r.id);
        results.push({
          id: r.id,
          engine_no: r.engine_no,
          chassis_no: r.chassis_no,
          branch: branchById.get(r.branch_id)?.name || null,
          branch_id: r.branch_id,
          transferred: true,
          item: itemById.get(r.item_id) || null,
          inventory_id: r.original_inventory_id || null,
          // include transferred_history specific fields (mirror schema)
          date_received: r.date_received || null,
          supplier_id: r.supplier_id ?? null,
          supplier_name: supplierById.get(r.supplier_id || -1)?.name || null,
          dr_no: r.dr_no || null,
          si_no: r.si_no || null,
          cost: r.cost ?? null,
          beginning_qty: r.beginning_qty ?? null,
          purchased_qty: r.purchased_qty ?? null,
          transferred_qty: r.transferred_qty ?? null,
          sold_qty: r.sold_qty ?? null,
          ending_qty: r.ending_qty ?? null,
          created_at: r.created_at || null,
          srp: r.srp ?? null,
          margin: r.margin ?? null,
          color: r.color || null,
          status: r.status || null,
          remarks: r.remarks || null,
          unit_number: r.unit_number ?? null,
          unit_created_at: r.unit_created_at || null,
          unit_status: r.unit_status || null,
          original_vehicle_unit_id: r.original_vehicle_unit_id ?? null,
          counterparts: others.map((d: any) => ({
            id: d.id,
            branch: branchById.get(d.branch_id)?.name || null,
            branch_id: d.branch_id,
            inventory_id: d.original_inventory_id || null,
            supplier_id: d.supplier_id ?? null,
            supplier_name: supplierById.get(d.supplier_id || -1)?.name || null,
            engine_no: d.engine_no,
            chassis_no: d.chassis_no,
            transferred: true,
            date_received: d.date_received || null,
            dr_no: d.dr_no || null,
            si_no: d.si_no || null,
            cost: d.cost ?? null,
            beginning_qty: d.beginning_qty ?? null,
            purchased_qty: d.purchased_qty ?? null,
            transferred_qty: d.transferred_qty ?? null,
            sold_qty: d.sold_qty ?? null,
            ending_qty: d.ending_qty ?? null,
            created_at: d.created_at || null,
            srp: d.srp ?? null,
            margin: d.margin ?? null,
            color: d.color || null,
            status: d.status || null,
            remarks: d.remarks || null,
            unit_number: d.unit_number ?? null,
            unit_created_at: d.unit_created_at || null,
            unit_status: d.unit_status ?? null,
            original_vehicle_unit_id: d.original_vehicle_unit_id ?? null
          }))
        });
      });
    });

    // Additionally, include cross-branch vehicle_units as before (in case some transfers are represented there)
    const units = await (prisma as any).vehicle_units.findMany({
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

    const vuGroups = new Map<string, any[]>();
    for (const u of units) {
      const key = `${u.engine_no || ''}|${u.chassis_no || ''}`;
      if (!vuGroups.has(key)) vuGroups.set(key, []);
      vuGroups.get(key)!.push(u);
    }
    vuGroups.forEach((arr) => {
      const branchesSet = new Set(arr.map((x: any) => x.inventory?.branch_id));
      if (branchesSet.size > 1) {
        arr.forEach((u: any) => {
          const others = arr.filter((x: any) => x.id !== u.id);
          results.push({
            id: u.id,
            engine_no: u.engine_no,
            chassis_no: u.chassis_no,
            branch: u.inventory?.branches?.name || null,
            branch_id: u.inventory?.branch_id,
            transferred: (u as any).transferred === true,
            item: u.inventory?.items || null,
            inventory_id: u.inventory_id,
            counterparts: others.map((d: any) => ({
              id: d.id,
              branch: d.inventory?.branches?.name || null,
              branch_id: d.inventory?.branch_id,
              inventory_id: d.inventory_id,
              engine_no: d.engine_no,
              chassis_no: d.chassis_no,
              transferred: (d as any).transferred === true
            }))
          });
        });
      }
    });

    // Deduplicate results by key (engine|chassis|branch|inventory_id) to avoid double entries
    const seen = new Set<string>();
    const deduped = [] as any[];
    for (const r of results) {
      const key = `${r.engine_no || ''}|${r.chassis_no || ''}|${r.branch_id || ''}|${r.inventory_id || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    res.json(deduped);
  } catch (e) {
    console.error('Error listing transferred units:', e);
    res.status(500).json({ error: (e as Error).message });
  }
}

// Transfer a single vehicle unit to another branch
export async function transferUnit(req: Request, res: Response) {
  try {
    const { unit_id, to_branch_id, remarks } = req.body;
    if (!unit_id || !to_branch_id) return res.status(400).json({ error: 'unit_id and to_branch_id are required' });

    const unit = await prisma.vehicle_units.findUnique({
      where: { id: Number(unit_id) },
      include: { inventory: { include: { branches: true, items: true } } }
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    if ((unit as any).transferred === true) return res.status(400).json({ error: 'Unit already transferred' });

    // Mark original unit as transferred
  await (prisma as any).vehicle_units.update({ where: { id: unit.id }, data: { transferred: true } });

    // Increment transferred_qty on original inventory record and append remark
    const fromBranchName = unit.inventory?.branches?.name || 'Unknown';
    const toBranch = await prisma.branches.findUnique({ where: { id: Number(to_branch_id) } });
    const toBranchName = toBranch?.name || `Branch ${to_branch_id}`;

    const remarkLine = `Transferred from ${fromBranchName} to ${toBranchName} (engine: ${unit.engine_no || '-'}, chassis: ${unit.chassis_no || '-'})`;
    const originalRemarks = unit.inventory?.remarks || '';
    const newRemarks = [originalRemarks, remarks || '', remarkLine].filter(Boolean).join('\n');

    await prisma.inventory_movements.update({ where: { id: unit.inventory_id }, data: { transferred_qty: { increment: 1 }, remarks: newRemarks } as any });

    // Create a transferred_history record for the origin branch so we keep a history of the unit
    try {
      await (prisma as any).transferred_history.create({
        data: {
          branch_id: unit.inventory?.branch_id || null,
          item_id: unit.inventory?.item_id || null,
          date_received: unit.inventory?.date_received ? new Date(unit.inventory.date_received) : new Date(),
          supplier_id: unit.inventory?.supplier_id || null,
          dr_no: unit.inventory?.dr_no || null,
          si_no: unit.inventory?.si_no || null,
          cost: unit.inventory?.cost ?? 0,
          beginning_qty: unit.inventory?.beginning_qty ?? null,
          purchased_qty: 1,
          transferred_qty: 1,
          sold_qty: 0,
          ending_qty: unit.inventory?.ending_qty ?? null,
          remarks: newRemarks || null,
          srp: unit.inventory?.srp ?? null,
          margin: unit.inventory?.margin ?? null,
          color: unit.inventory?.color ?? null,
          status: 'transferred',
          chassis_no: unit.chassis_no || null,
          engine_no: unit.engine_no || null,
          unit_number: unit.unit_number ?? null,
          unit_created_at: unit.created_at || null,
          unit_status: unit.status || null,
          original_inventory_id: unit.inventory_id || null,
          original_vehicle_unit_id: unit.id || null,
        }
      });
    } catch (thErr) {
      console.error('Failed to create transferred_history record:', thErr);
      // Do not block transfer if history insert fails; continue
    }

    // Create a new inventory_movements record in destination branch and add the unit there
    const newInv = await prisma.inventory_movements.create({
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
  } catch (e) {
    console.error('Error transferring unit:', e);
    res.status(500).json({ error: (e as Error).message });
  }
}

