/**
 * Predefined templates for DOORS packages by category
 */

export interface DoorsPackageTemplate {
  id: string;
  name: string;
  category: string;
  equipmentType: string;
  materialType?: string;
  totalRequirements: number;
  description: string;
}

const DOORS_PACKAGE_TEMPLATES: DoorsPackageTemplate[] = [
  // OHE
  {
    id: 'tpl-ohe-contact-wire',
    name: 'Contact Wire',
    category: 'OHE',
    equipmentType: 'Contact Wire Assembly',
    materialType: 'Cu-Mg / Cu-Sn',
    totalRequirements: 120,
    description: 'OHE contact wire with tensioning and dropper requirements',
  },
  {
    id: 'tpl-ohe-cantilever',
    name: 'Cantilever',
    category: 'OHE',
    equipmentType: 'Cantilever Assembly',
    materialType: 'Aluminium Alloy',
    totalRequirements: 85,
    description: 'Cantilever assembly with bracket and insulator requirements',
  },
  // TSS
  {
    id: 'tpl-tss-transformer',
    name: 'Transformer',
    category: 'TSS',
    equipmentType: 'Power Transformer',
    totalRequirements: 150,
    description: 'Traction substation power transformer requirements',
  },
  {
    id: 'tpl-tss-switchgear',
    name: 'Switchgear',
    category: 'TSS',
    equipmentType: 'HV Switchgear',
    totalRequirements: 130,
    description: 'High voltage switchgear panel requirements for TSS',
  },
  // SCADA
  {
    id: 'tpl-scada-rtu',
    name: 'SCADA RTU',
    category: 'SCADA',
    equipmentType: 'Remote Terminal Unit',
    totalRequirements: 100,
    description: 'SCADA RTU with communication and I/O requirements',
  },
  // Cables
  {
    id: 'tpl-cables-power',
    name: 'Power Cable',
    category: 'Cables',
    equipmentType: 'Power Cable',
    materialType: 'XLPE Insulated',
    totalRequirements: 80,
    description: 'HV/LV power cable with laying and termination requirements',
  },
  // Hardware
  {
    id: 'tpl-hw-fastener',
    name: 'Fastener Package',
    category: 'Hardware',
    equipmentType: 'Fasteners & Clamps',
    materialType: 'Stainless Steel / GI',
    totalRequirements: 60,
    description: 'Bolts, nuts, clamps, and fastener requirements',
  },
  // Consumables
  {
    id: 'tpl-cons-welding',
    name: 'Welding Consumables',
    category: 'Consumables',
    equipmentType: 'Welding Materials',
    materialType: 'Various',
    totalRequirements: 45,
    description: 'Welding rods, flux, and consumable requirements',
  },
];

/**
 * Get templates filtered by category
 */
export const getTemplatesByCategory = (category: string): DoorsPackageTemplate[] => {
  return DOORS_PACKAGE_TEMPLATES.filter((t) => t.category === category);
};

export default DOORS_PACKAGE_TEMPLATES;
