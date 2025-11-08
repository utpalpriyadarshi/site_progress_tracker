/**
 * Mock Supplier Data
 *
 * Provides sample supplier data for testing and development
 * In production, this would be replaced with database models
 */

import { Supplier } from '../services/MaterialProcurementService';

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup_001',
    name: 'BuildMart Supplies Ltd.',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@buildmart.com',
    phone: '+91-9876543210',
    address: 'Plot 45, Industrial Area, Sector 18, Gurugram, Haryana',
    rating: 4.5,
    reliability: 92,
    paymentTerms: 'Net 30',
    deliveryRadius: 50,
    specializations: ['Cement', 'Steel', 'Aggregates'],
    activeStatus: 'active',
  },
  {
    id: 'sup_002',
    name: 'Supreme Steel Industries',
    contactPerson: 'Amit Sharma',
    email: 'amit@supremesteel.com',
    phone: '+91-9876543211',
    address: '23, Steel Complex, NOIDA, Uttar Pradesh',
    rating: 4.8,
    reliability: 95,
    paymentTerms: 'Net 45',
    deliveryRadius: 100,
    specializations: ['Steel', 'TMT Bars', 'Structural Steel'],
    activeStatus: 'active',
  },
  {
    id: 'sup_003',
    name: 'UltraTech Cement Direct',
    contactPerson: 'Priya Singh',
    email: 'priya@ultratech-direct.com',
    phone: '+91-9876543212',
    address: 'Depot Road, Faridabad, Haryana',
    rating: 4.7,
    reliability: 94,
    paymentTerms: 'Net 30',
    deliveryRadius: 75,
    specializations: ['Cement', 'Ready Mix Concrete'],
    activeStatus: 'active',
  },
  {
    id: 'sup_004',
    name: 'Metro Hardware & Electricals',
    contactPerson: 'Sunil Mehta',
    email: 'sunil@metrohardware.com',
    phone: '+91-9876543213',
    address: '156, Hardware Market, Karol Bagh, New Delhi',
    rating: 4.2,
    reliability: 88,
    paymentTerms: 'COD',
    deliveryRadius: 30,
    specializations: ['Electrical', 'Plumbing', 'Hardware'],
    activeStatus: 'active',
  },
  {
    id: 'sup_005',
    name: 'Delhi Aggregates Co.',
    contactPerson: 'Vikram Patel',
    email: 'vikram@delhiaggregates.com',
    phone: '+91-9876543214',
    address: 'Crusher Plant, NH-8, Manesar, Haryana',
    rating: 4.0,
    reliability: 85,
    paymentTerms: 'Net 15',
    deliveryRadius: 60,
    specializations: ['Sand', 'Gravel', 'Crushed Stone', 'Aggregates'],
    activeStatus: 'active',
  },
  {
    id: 'sup_006',
    name: 'Premier Paints & Coatings',
    contactPerson: 'Neha Gupta',
    email: 'neha@premierpaints.com',
    phone: '+91-9876543215',
    address: '78, Paint Market, Okhla, New Delhi',
    rating: 4.6,
    reliability: 91,
    paymentTerms: 'Net 30',
    deliveryRadius: 40,
    specializations: ['Paints', 'Primers', 'Waterproofing'],
    activeStatus: 'active',
  },
  {
    id: 'sup_007',
    name: 'Woodcraft Timber Merchants',
    contactPerson: 'Ramesh Verma',
    email: 'ramesh@woodcraft.com',
    phone: '+91-9876543216',
    address: 'Timber Market, Mayapuri, New Delhi',
    rating: 4.3,
    reliability: 87,
    paymentTerms: 'Net 30',
    deliveryRadius: 35,
    specializations: ['Timber', 'Plywood', 'Lumber'],
    activeStatus: 'active',
  },
  {
    id: 'sup_008',
    name: 'Quality Tiles & Sanitary',
    contactPerson: 'Anjali Reddy',
    email: 'anjali@qualitytiles.com',
    phone: '+91-9876543217',
    address: '234, Tile Market, Kirti Nagar, New Delhi',
    rating: 4.4,
    reliability: 89,
    paymentTerms: 'Net 45',
    deliveryRadius: 45,
    specializations: ['Tiles', 'Sanitary Ware', 'Fittings'],
    activeStatus: 'active',
  },
  {
    id: 'sup_009',
    name: 'Brick & Block Industries',
    contactPerson: 'Sanjay Joshi',
    email: 'sanjay@brickblock.com',
    phone: '+91-9876543218',
    address: 'Brick Kiln, Rohtak Road, Bahadurgarh, Haryana',
    rating: 3.9,
    reliability: 82,
    paymentTerms: 'COD',
    deliveryRadius: 55,
    specializations: ['Bricks', 'AAC Blocks', 'Fly Ash Bricks'],
    activeStatus: 'active',
  },
  {
    id: 'sup_010',
    name: 'Modern Scaffolding Services',
    contactPerson: 'Karan Singh',
    email: 'karan@modernscaffolding.com',
    phone: '+91-9876543219',
    address: '45, Industrial Estate, Ghaziabad, Uttar Pradesh',
    rating: 4.1,
    reliability: 86,
    paymentTerms: 'Net 15',
    deliveryRadius: 70,
    specializations: ['Scaffolding', 'Formwork', 'Shoring'],
    activeStatus: 'active',
  },
  {
    id: 'sup_011',
    name: 'Safety First Equipment',
    contactPerson: 'Deepak Agarwal',
    email: 'deepak@safetyfirst.com',
    phone: '+91-9876543220',
    address: '67, Safety Equipment Market, Connaught Place, New Delhi',
    rating: 4.7,
    reliability: 93,
    paymentTerms: 'Net 30',
    deliveryRadius: 50,
    specializations: ['Safety Equipment', 'PPE', 'Fire Safety'],
    activeStatus: 'active',
  },
  {
    id: 'sup_012',
    name: 'Budget Building Supplies',
    contactPerson: 'Mohan Lal',
    email: 'mohan@budgetbuilding.com',
    phone: '+91-9876543221',
    address: '89, Wholesale Market, Naraina, New Delhi',
    rating: 3.5,
    reliability: 75,
    paymentTerms: 'COD',
    deliveryRadius: 25,
    specializations: ['General Supplies', 'Miscellaneous'],
    activeStatus: 'active',
  },
];

// Mock stock allocations for multi-location tracking
export interface MockStockAllocation {
  id: string;
  materialId: string;
  locationId: string;
  locationName: string;
  locationType: 'warehouse' | 'site_storage' | 'site_active';
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  lastUpdated: Date;
  reorderPoint: number;
  status: 'adequate' | 'low' | 'critical';
}

export const mockLocations = [
  {
    id: 'loc_001',
    name: 'Main Warehouse - Gurugram',
    type: 'warehouse' as const,
    address: 'Sector 18, Gurugram, Haryana',
    capacity: 10000,
    currentUtilization: 65,
  },
  {
    id: 'loc_002',
    name: 'Site Storage - Project Alpha',
    type: 'site_storage' as const,
    address: 'Project Alpha Site, Dwarka, Delhi',
    capacity: 2000,
    currentUtilization: 45,
  },
  {
    id: 'loc_003',
    name: 'Active Storage - Project Beta',
    type: 'site_active' as const,
    address: 'Project Beta Site, Noida, UP',
    capacity: 1500,
    currentUtilization: 80,
  },
  {
    id: 'loc_004',
    name: 'Regional Warehouse - Delhi',
    type: 'warehouse' as const,
    address: 'Okhla Industrial Area, Delhi',
    capacity: 8000,
    currentUtilization: 55,
  },
];

export function generateMockConsumptionHistory(days: number = 30): Array<{
  date: Date;
  consumption: number;
}> {
  const history: Array<{ date: Date; consumption: number }> = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate realistic consumption pattern
    // Higher on weekdays, lower on weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const baseConsumption = isWeekend ? 5 : 15;
    const variation = Math.random() * 10 - 5; // ±5 variation
    const consumption = Math.max(0, baseConsumption + variation);

    history.push({
      date,
      consumption,
    });
  }

  return history;
}

export default mockSuppliers;
