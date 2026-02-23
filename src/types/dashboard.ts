export interface DashboardData {
  topAgents: Array<{agent: string; amount: number}>;
  topFmo: Array<{fmo: string; amount: number; count: number}>;
  topBm: Array<{bm: string; amount: number; count: number}>;
  topMechanic: Array<{mechanic: string; amount: number; count: number}>;
  topBao: Array<{bao: string; amount: number; count: number}>;
  branchData: Array<{branch: string; amount: number}>;
  branchMonthStats: Record<string, Record<string, number>>;
  branchMonthUnitStats?: Record<string, Record<string, number>>;
  branchUnitsData?: Array<{branch: string; units: number}>;
  ageData: Array<{group: string; amount: number}>;
  areaData: Array<{area: string; amount: number}>;
  topModels: Array<{
    model: string;
    brand: string;
    total: number;
    byAge: Array<{group: string; amount: number}>;
    byArea: Array<{area: string; amount: number}>;
  }>;
  inventoryPie: Array<{status: string; value: number}>;
  monthlyData: Array<{month: string; amount: number}>;
  forecastData: Array<{
    month: string;
    amount?: number;
    forecast?: number;
    target: number;
    isTarget?: boolean;
  }>;
  totalSales: number;
  totalInventoryUnits: number;
  inventoryStatus: {
    available: number;
    sold: number;
    reserved?: number;
  };
}
