import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface OfficerStats {
  amount: number;
  count: number;
}

interface OfficerStatsMap {
  [key: string]: OfficerStats;
}

interface SalesDataPoint {
  month: string;
  amount?: number;
  forecast?: number;
  target: number;
  isTarget?: boolean;
  projectedGrowth?: number;
}

// Helper: normalize strings for matching
function normalizeAddress(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\bsta\b|\bsta\.|\bsan\./g, 'santa') // expand Sta./San.
    .replace(/\bsto\b|\bsto\./g, 'santo') // expand Sto.
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to extract city/municipality from address across PH
function extractAreaFromAddress(address: string): string {
  const addr = normalizeAddress(address);

  // Canonical area dictionary with common variants per locality (focus on our provinces + NCR)
  const AREA_PATTERNS: Record<string, string[]> = {
    // NCR
    'Quezon City': ['quezon city', 'qc'],
    'Manila': ['manila', 'city of manila'],
    'Makati': ['makati'],
    'Taguig': ['taguig'],
    'Pasig': ['pasig'],
    'Mandaluyong': ['mandaluyong'],
    'San Juan': ['san juan'],
    'Pasay': ['pasay'],
    'Paranaque': ['paranaque', 'parañaque'],
    'Las Pinas': ['las pinas', 'las piñas'],
    'Muntinlupa': ['muntinlupa'],
    'Caloocan': ['caloocan'],
    'Marikina': ['marikina'],
    'Valenzuela': ['valenzuela'],
    'Navotas': ['navotas'],
    'Malabon': ['malabon'],
    'Pateros': ['pateros'],

    // Cagayan
    'Tuguegarao': ['tuguegarao', 'tug city', 'tug cagayan', 'tug'],
    'Solana': ['solana'],
    'Iguig': ['iguig'],
    'Amulung': ['amulung'],
    'Penablanca': ['penablanca', 'penablanca', 'peñablanca'],
    'Lal-lo': ['lal lo', 'lallo', 'lal-lo'],
    'Tuao': ['tuao'],
    'Aparri': ['aparri'],
    'Ballesteros': ['ballesteros'],
    'Sanchez Mira': ['sanchez mira'],
    'Claveria': ['claveria'],
    'Sta. Ana': ['santa ana', 'sta ana'],
    'Gonzaga': ['gonzaga'],
    'Alcala': ['alcala'],
    'Camalaniugan': ['camalaniugan'],
    'Enrile': ['enrile'],
    'Piat': ['piat'],

    // Isabela
    'Ilagan': ['ilagan', 'city of ilagan'],
    'Cauayan': ['cauayan', 'cauayan city'],
    'Roxas': ['roxas isabela'],
    'Aurora': ['aurora isabela'],
    'San Mateo': ['san mateo isabela'],
    'Tumauini': ['tumauini'],
    'Cabatuan': ['cabatuan'],
    'San Manuel': ['san manuel isabela'],
    'San Mariano': ['san mariano'],
    'Gamu': ['gamu'],
    'Reina Mercedes': ['reina mercedes'],
    'Echague': ['echague', 'echague isabela'],
    'San Isidro': ['san isidro isabela'],
    'Cordon': ['cordon'],
    'Alicia': ['alicia isabela'],
    'Angadanan': ['angadanan'],
    'Ramon': ['ramon isabela'],
    'Naguilian': ['naguilian'],
    'Benito Soliven': ['benito soliven'],
    'Luna': ['luna isabela'],
    'Burgos': ['burgos isabela'],
    'Sto. Tomas': ['santo tomas isabela', 'sto tomas isabela', 'santo tomas'],
    'San Pablo': ['san pablo isabela'],
    'San Agustin': ['san agustin isabela'],
    'San Guillermo': ['san guillermo isabela'],
    'Santa Maria': ['santa maria isabela'],

    // Others commonly appearing in data
    'San Jose': ['san jose'],
    'Santa Rosa': ['santa rosa'],
  };

  // Try area pattern matching (prefer longer names first)
  const entries = Object.entries(AREA_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [canonical, patterns] of entries) {
    for (const p of patterns) {
      const pat = normalizeAddress(p);
      if (pat && addr.includes(pat)) return canonical;
    }
  }

  // Fallbacks based on province mention
  if (addr.includes('cagayan')) return 'Cagayan (unspecified)';
  if (addr.includes('isabela')) return 'Isabela (unspecified)';
  if (addr.includes('metro manila') || addr.includes('ncr')) return 'Metro Manila (unspecified)';

  return 'Other Areas';
}

// Helper function to get age group
function getAgeGroup(age: number): string {
  if (!age) return 'Unknown';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
}

export async function getDashboardAnalytics(req: Request, res: Response) {
  try {
    // Fetch sales and inventory data with more details
    const sales = await prisma.sales.findMany({
      include: {
        branches: true,
        sales_items: {
          include: {
            items: true
          }
        }
      }
    });
    // Fetch inventory (include units). We'll filter transferred units in JS to avoid Prisma schema mismatches
    const inventory = await prisma.inventory_movements.findMany({
      include: {
        vehicle_units: true,
        items: true
      }
    });

  // Top agents and officers
    // Area analysis - group by city/area from address
    const areaStats: Record<string, { amount: number; count: number }> = {};
    const modelStats: Record<string, {
      totalAmount: number;
      count: number;
      byAge: Record<string, number>;
      byArea: Record<string, number>;
    }> = {};

  // Officer stats with amount tracking
  const agentStats: Record<string, { amount: number; areas: Record<string, number>; models: Record<string, number>; }> = {};
  // Agents by units (count of units sold)
  const agentUnitStats: Record<string, number> = {};
    const fmoStats: Record<string, { amount: number; count: number }> = {};
    const bmStats: Record<string, { amount: number; count: number }> = {};
    const mechanicStats: Record<string, { amount: number; count: number }> = {};
    const baoStats: Record<string, { amount: number; count: number }> = {};
  // Per-branch, per-month sales (amount) and units
  const branchMonthStats: Record<string, Record<string, number>> = {};
  const branchMonthUnitStats: Record<string, Record<string, number>> = {};
  const branchUnitTotals: Record<string, number> = {};
  // Source of sales stats
  const sourceStats: Record<string, { amount: number; count: number }> = {};

  sales.forEach((sale: any) => {
      // Extract city/area from address using simple parsing
      const address = (sale.address || '').trim();
      const area = extractAreaFromAddress(address);
      
      // Aggregate area stats
      if (area) {
        if (!areaStats[area]) {
          areaStats[area] = { amount: 0, count: 0 };
        }
        areaStats[area].amount += Number(sale.total_amount || 0);
        areaStats[area].count += 1;
      }

      // Source of sales stats
      const source = sale.source_of_sales || 'Unknown';
      if (!sourceStats[source]) {
        sourceStats[source] = { amount: 0, count: 0 };
      }
      sourceStats[source].amount += Number(sale.total_amount || 0);
      sourceStats[source].count += 1;

      // Agent stats with area and model breakdown
      if (sale.agent) {
        if (!agentStats[sale.agent]) {
          agentStats[sale.agent] = {
            amount: 0,
            areas: {},
            models: {}
          };
        }
        agentStats[sale.agent].amount += Number(sale.total_amount || 0);
        if (area) {
          agentStats[sale.agent].areas[area] = (agentStats[sale.agent].areas[area] || 0) + Number(sale.total_amount || 0);
        }
        // Units per agent: prefer distinct vehicle units if linked; otherwise fall back to sum of qty
        const itemUnits = (sale.sales_items || []);
        const distinctVehicleIds = new Set<number>();
        let qtySum = 0;
        for (const it of itemUnits) {
          if (it.vehicle_unit_id) distinctVehicleIds.add(Number(it.vehicle_unit_id));
          qtySum += Number(it.qty || 1);
        }
        const unitsForThisSale = distinctVehicleIds.size > 0 ? distinctVehicleIds.size : qtySum;
        agentUnitStats[sale.agent] = (agentUnitStats[sale.agent] || 0) + unitsForThisSale;
      }
      // FMO
      if (sale.fmo) {
        if (!fmoStats[sale.fmo]) {
          fmoStats[sale.fmo] = { amount: 0, count: 0 };
        }
        fmoStats[sale.fmo].amount += Number(sale.total_amount || 0);
        fmoStats[sale.fmo].count += 1;
      }
      // BM
      if (sale.bm) {
        if (!bmStats[sale.bm]) {
          bmStats[sale.bm] = { amount: 0, count: 0 };
        }
        bmStats[sale.bm].amount += Number(sale.total_amount || 0);
        bmStats[sale.bm].count += 1;
      }
      // Mechanic
      if (sale.mechanic) {
        if (!mechanicStats[sale.mechanic]) {
          mechanicStats[sale.mechanic] = { amount: 0, count: 0 };
        }
        mechanicStats[sale.mechanic].amount += Number(sale.total_amount || 0);
        mechanicStats[sale.mechanic].count += 1;
      }
      // BAO
      if (sale.bao) {
        if (!baoStats[sale.bao]) {
          baoStats[sale.bao] = { amount: 0, count: 0 };
        }
        baoStats[sale.bao].amount += Number(sale.total_amount || 0);
        baoStats[sale.bao].count += 1;
      }
  // Per-branch, per-month sales
      const branch = sale.branches?.name || String(sale.branch_id);
      const month = sale.date_sold ? new Date(sale.date_sold).toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
      if (!branchMonthStats[branch]) branchMonthStats[branch] = {};
      branchMonthStats[branch][month] = (branchMonthStats[branch][month] || 0) + Number(sale.total_amount || 0);

  // Per-branch, per-month units (sum of item qty)
  const unitsInSale = (sale.sales_items || []).reduce((sum: number, it: any) => sum + Number(it.qty || 1), 0) || 0;
  if (!branchMonthUnitStats[branch]) branchMonthUnitStats[branch] = {};
  branchMonthUnitStats[branch][month] = (branchMonthUnitStats[branch][month] || 0) + unitsInSale;
  branchUnitTotals[branch] = (branchUnitTotals[branch] || 0) + unitsInSale;

      // Model stats with age and area breakdown
      sale.sales_items?.forEach((item: any) => {
        const model = item.items?.model;
        if (model) {
          if (!modelStats[model]) {
            modelStats[model] = {
              totalAmount: 0,
              count: 0,
              byAge: {},
              byArea: {}
            };
          }
          modelStats[model].totalAmount += Number(item.amount || 0);
          // Count units sold per model: prefer distinct vehicle units; fallback to qty
          const unitIncrement = item.vehicle_unit_id ? 1 : Number(item.qty || 1);
          modelStats[model].count += unitIncrement;
          
          // Age group breakdown
          const ageGroup = getAgeGroup(sale.age);
          if (ageGroup) {
            modelStats[model].byAge[ageGroup] = (modelStats[model].byAge[ageGroup] || 0) + Number(item.amount || 0);
          }
          
          // Area breakdown
          if (area) {
            modelStats[model].byArea[area] = (modelStats[model].byArea[area] || 0) + Number(item.amount || 0);
          }
        }
      });
    });
    const topAgents = Object.entries(agentStats)
      .map(([agent, amount]) => ({ agent, amount }))
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    // Branch sales
    const branchStats: Record<string, number> = {};
    sales.forEach((sale: any) => {
      const branch = sale.branches?.name || String(sale.branch_id);
      branchStats[branch] = (branchStats[branch] || 0) + Number(sale.total_amount || 0);
    });
    const branchData = Object.entries(branchStats).map(([branch, amount]) => ({ branch, amount }));

    // Convert area stats to array
    const areaData = Object.entries(areaStats).map(([area, stats]) => ({
      area,
      amount: stats.amount,
      count: stats.count,
      average: stats.amount / stats.count
    })).sort((a, b) => b.amount - a.amount);

    // Convert model stats to array
    const modelData = Object.entries(modelStats).map(([model, stats]) => ({
      model,
      totalAmount: stats.totalAmount,
      count: stats.count,
      averagePrice: stats.totalAmount / stats.count,
      byAge: Object.entries(stats.byAge).map(([age, amount]) => ({ age, amount })),
      byArea: Object.entries(stats.byArea).map(([area, amount]) => ({ area, amount }))
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Age groups with enhanced analytics
    const ageGroups: Record<string, {amount: number; models: {model: string; amount: number}[]}> = {
      '18-24': {amount: 0, models: []},
      '25-34': {amount: 0, models: []},
      '35-44': {amount: 0, models: []},
      '45-54': {amount: 0, models: []},
      '55+': {amount: 0, models: []}
    };
    
    console.log('[Dashboard] sourceStats after aggregation:', JSON.stringify(sourceStats, null, 2));
    
    // Inventory status (exclude transferred vehicle units entirely)
    const [{ available } = { available: 0 }] = await prisma.$queryRawUnsafe<any>(
      "SELECT COUNT(*)::int AS available FROM vehicle_units WHERE COALESCE(transferred,false)=false AND status='available'"
    );
    const [{ sold } = { sold: 0 }] = await prisma.$queryRawUnsafe<any>(
      "SELECT COUNT(*)::int AS sold FROM vehicle_units WHERE COALESCE(transferred,false)=false AND status='sold'"
    );
    const inventoryStatus: Record<string, number> = { available, sold };
    const inventoryPie = [
      { status: 'available', value: available },
      { status: 'sold', value: sold }
    ];

    // Monthly sales & forecast calculation
    // Get average SRP from all items
    const itemsWithSRP = await prisma.items.findMany({
      where: {
        srp: {
          not: null
        }
      },
      select: {
        srp: true
      }
    });
    
    // Calculate average SRP
    const averageSRP = itemsWithSRP.length > 0 
      ? itemsWithSRP.reduce((sum, item) => sum + Number(item.srp || 0), 0) / itemsWithSRP.length 
      : 0;

    // Get number of active branches
    const branchCount = await prisma.branches.count();

    // Calculate target: 30 sales per branch at average SRP
    const monthlyTargetAmount = 30 * branchCount * averageSRP;

    // Get historical monthly sales data
    const monthlySales: Record<string, number> = {};
    sales.forEach((sale: any) => {
      if (sale.date_sold) {
        const saleDate = new Date(sale.date_sold);
        const month = saleDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        monthlySales[month] = (monthlySales[month] || 0) + Number(sale.total_amount || 0);
      }
    });
    
    // Convert to array and sort by date
    const monthlyData: SalesDataPoint[] = Object.entries(monthlySales)
      .map(([month, amount]) => ({ 
        month, 
        amount: Number(amount),
        target: monthlyTargetAmount
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // Initialize forecast data with historical data
    const forecastData = [...monthlyData];
    
    // Calculate moving average of last 3 months for trend
    const last3Months = monthlyData.slice(-3);
    const averageAmount = last3Months.length > 0
      ? last3Months.reduce((sum, item) => sum + (item.amount || 0), 0) / last3Months.length
      : monthlyTargetAmount;
    
    // Calculate trend percentage (how close to target we are)
    const trendPercentage = averageAmount / monthlyTargetAmount;
    
    // Add next month's forecast
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    
    // If we're below target, forecast should trend toward target
    // If we're above target, maintain the performance level
    const forecastAmount = trendPercentage < 1
      ? averageAmount * (1 + 0.1) // Trend up 10% if below target
      : averageAmount * (1 + 0.02); // Maintain with slight growth if above target
    
    forecastData.push({
      month: nextMonthStr + ' (F)',
      forecast: forecastAmount,
      target: monthlyTargetAmount
    });

    // Process detailed age group data with model preferences
    sales.forEach((sale: any) => {
      const ageGroup = getAgeGroup(sale.age);
      if (ageGroup && ageGroups[ageGroup]) {
        ageGroups[ageGroup].amount += Number(sale.total_amount || 0);
        
        // Track model preferences for each age group
        sale.sales_items?.forEach((item: any) => {
          const model = item.items?.model;
          if (model) {
            const existingModel = ageGroups[ageGroup].models.find(m => m.model === model);
            if (existingModel) {
              existingModel.amount += Number(item.amount || 0);
            } else {
              ageGroups[ageGroup].models.push({
                model,
                amount: Number(item.amount || 0)
              });
            }
          }
        });
      }
    });

    // Sort models within each age group
    Object.values(ageGroups).forEach(group => {
      group.models.sort((a, b) => b.amount - a.amount);
    });

    const ageData = Object.entries(ageGroups).map(([group, data]) => ({
      group,
      amount: data.amount,
      models: data.models.slice(0, 5) // Top 5 models per age group
    }));

    // Dealership sales: add 20% to each individual sale, then sum (per-sale rounding)
    const dealershipSales = sales.reduce((sum: number, s: any) => {
      const base = Number(s.total_amount || 0);
      const perSale = Number((base * 1.20).toFixed(2));
      return sum + perSale;
    }, 0);

    res.json({
      topAgents: Object.entries(agentStats)
        .map(([agent, stats]) => ({
          agent,
          amount: stats.amount
        }))
        .sort((a, b) => b.amount - a.amount),
      topAgentsUnits: Object.entries(agentUnitStats)
        .map(([agent, units]) => ({ agent, units }))
        .sort((a, b) => b.units - a.units),
      topFmo: Object.entries(fmoStats)
        .map(([fmo, stats]) => ({ fmo, amount: stats.amount, count: stats.count }))
        .sort((a, b) => b.amount - a.amount),
      topBm: Object.entries(bmStats)
        .map(([bm, stats]) => ({ bm, amount: stats.amount, count: stats.count }))
        .sort((a, b) => b.amount - a.amount),
      topMechanic: Object.entries(mechanicStats)
        .map(([mechanic, stats]) => ({ mechanic, amount: stats.amount, count: stats.count }))
        .sort((a, b) => b.amount - a.amount),
      topBao: Object.entries(baoStats)
        .map(([bao, stats]) => ({ bao, amount: stats.amount, count: stats.count }))
        .sort((a, b) => b.amount - a.amount),
      branchData,
  branchMonthStats,
  branchMonthUnitStats,
  branchUnitsData: Object.entries(branchUnitTotals).map(([branch, units]) => ({ branch, units })),
      ageData,
      areaData: Object.entries(areaStats)
        .map(([area, stats]) => ({
          area,
          amount: stats.amount
        }))
        .sort((a, b) => b.amount - a.amount),
      sourceData: Object.entries(sourceStats)
        .map(([source, stats]) => ({
          source,
          amount: stats.amount,
          count: stats.count
        }))
        .sort((a, b) => b.amount - a.amount),
      topModels: Object.entries(modelStats)
        .map(([model, stats]) => ({
          model,
          brand: model.split(' ')[0] || '',
          total: stats.totalAmount,
          units: stats.count,
          byAge: Object.entries(stats.byAge)
            .map(([group, amount]) => ({ group, amount })),
          byArea: Object.entries(stats.byArea)
            .map(([area, amount]) => ({ area, amount }))
        }))
        .sort((a, b) => b.total - a.total),
      inventoryPie,
      inventoryStatus,
      monthlyData,
      forecastData,
      totalSales: sales.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0),
  dealershipSales,
      // Exclude transferred vehicle units from total count
      totalInventoryUnits: (await prisma.$queryRawUnsafe<any>("SELECT COUNT(*)::int AS total FROM vehicle_units WHERE COALESCE(transferred,false)=false"))[0]?.total || 0
    });
  } catch (error) {
    console.error('[Dashboard Controller] Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
}
