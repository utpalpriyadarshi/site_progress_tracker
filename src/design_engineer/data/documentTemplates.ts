import { DocumentType } from '../types/DesignDocumentTypes';

export const DOCUMENT_TYPE_PREFIXES: Record<string, string> = {
  simulation_study: 'SIM',
  installation: 'INS',
  product_equipment: 'PRD',
  as_built: 'ABD',
};

export interface TemplateDocument {
  title: string;
  documentType: DocumentType;
  weightage: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documents: TemplateDocument[];
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // ══════════════════════════════════════════════════════════════════
  // TRACTION SUBSTATION (TSS)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'mre_tss_studies',
    name: 'MRE TSS — Studies',
    description:
      'Analytical and calculation-based study documents for a 25 kV AC Metro Traction Substation — system-level electrical studies and TSS-specific design calculations.',
    documents: [
      // ── System-Level Electrical Studies ──
      { title: 'Design Basis Report (DBR)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Load Flow Study (Normal & Degraded Mode)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Short Circuit Study (Max/Min Fault Level)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Protection Coordination Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Relay Setting Calculations', documentType: 'simulation_study', weightage: 3 },
      { title: 'Insulation Coordination Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'Harmonic Analysis Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'Voltage Drop Calculations', documentType: 'simulation_study', weightage: 3 },
      { title: 'System Loss Calculation', documentType: 'simulation_study', weightage: 2 },
      { title: 'EMC/EMI Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'Rolling Stock Interface Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'SCADA Communication Load Study', documentType: 'simulation_study', weightage: 2 },

      // ── TSS-Specific Calculations ──
      { title: 'Transformer Rating Calculation', documentType: 'simulation_study', weightage: 4 },
      { title: 'Rectifier Capacity Calculation', documentType: 'simulation_study', weightage: 4 },
      { title: 'Auxiliary Transformer Sizing', documentType: 'simulation_study', weightage: 3 },
      { title: 'Busbar Sizing Calculation', documentType: 'simulation_study', weightage: 3 },
      { title: 'Earthing Grid Design Calculation', documentType: 'simulation_study', weightage: 3 },
      { title: 'Step & Touch Potential Calculation', documentType: 'simulation_study', weightage: 3 },
      { title: 'Lightning Protection Risk Assessment', documentType: 'simulation_study', weightage: 2 },
    ],
  },
  {
    id: 'mre_tss_installation',
    name: 'MRE TSS — Installation',
    description:
      'Execution-oriented drawings and documents for Traction Substation construction — electrical schematics, layout plans, earthing, and protection relay installation.',
    documents: [
      // ── Electrical Drawings ──
      { title: 'Single Line Diagram (SLD)', documentType: 'installation', weightage: 5 },
      { title: 'AC & DC Schematic Diagrams', documentType: 'installation', weightage: 4 },
      { title: 'Protection Wiring Diagram', documentType: 'installation', weightage: 4 },
      { title: 'Interlocking Logic Diagram', documentType: 'installation', weightage: 3 },
      { title: 'SCADA I/O List', documentType: 'installation', weightage: 3 },
      { title: 'Cable Schedule', documentType: 'installation', weightage: 3 },

      // ── Layout & Arrangement ──
      { title: 'General Arrangement (GA) Drawing', documentType: 'installation', weightage: 5 },
      { title: 'Equipment Layout Plan', documentType: 'installation', weightage: 4 },
      { title: 'Cable Trench Layout', documentType: 'installation', weightage: 3 },
      { title: 'Earthing Layout Plan', documentType: 'installation', weightage: 4 },
      { title: 'Cable Routing Drawing', documentType: 'installation', weightage: 3 },
      { title: 'Control Panel Layout', documentType: 'installation', weightage: 3 },
      { title: 'Lightning Protection Layout', documentType: 'installation', weightage: 3 },

      // ── Earthing & Bonding ──
      { title: 'Earth Pit Location Drawing', documentType: 'installation', weightage: 3 },
      { title: 'Earth Grid Layout', documentType: 'installation', weightage: 3 },
      { title: 'Rail Bonding Drawing', documentType: 'installation', weightage: 3 },
      { title: 'Cross Bonding Layout', documentType: 'installation', weightage: 3 },
      { title: 'Impedance Bond Location Drawing', documentType: 'installation', weightage: 2 },

      // ── Protection Relays ──
      { title: 'Relay Logic Diagram', documentType: 'installation', weightage: 3 },
      { title: 'Setting Sheet', documentType: 'installation', weightage: 3 },
      { title: 'Communication Protocol Configuration', documentType: 'installation', weightage: 2 },
    ],
  },
  {
    id: 'mre_tss_product',
    name: 'MRE TSS — Product',
    description:
      'Manufacturer/vendor detailed engineering documents for TSS equipment — transformers, circuit breakers, SCADA, control panels, and factory acceptance testing.',
    documents: [
      // ── Transformers ──
      { title: 'Transformer Detail Design Report', documentType: 'product_equipment', weightage: 4 },
      { title: 'Transformer GA Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Bushing Arrangement Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Terminal Plan', documentType: 'product_equipment', weightage: 2 },
      { title: 'Foundation Bolt Plan', documentType: 'product_equipment', weightage: 2 },
      { title: 'Loss Calculation Sheet', documentType: 'product_equipment', weightage: 3 },

      // ── Circuit Breakers ──
      { title: 'Circuit Breaker Detail Design Report', documentType: 'product_equipment', weightage: 4 },
      { title: 'Circuit Breaker GA Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'CB Control Schematic', documentType: 'product_equipment', weightage: 3 },
      { title: 'Spring Charging Diagram', documentType: 'product_equipment', weightage: 2 },
      { title: 'Interlock Scheme', documentType: 'product_equipment', weightage: 3 },

      // ── SCADA System ──
      { title: 'SCADA System Detail Design', documentType: 'product_equipment', weightage: 4 },
      { title: 'SCADA Architecture Diagram', documentType: 'product_equipment', weightage: 3 },
      { title: 'Network Topology Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Communication Interface Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'RTU Configuration Sheet', documentType: 'product_equipment', weightage: 2 },

      // ── Panel & Control System ──
      { title: 'Panel GA Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Internal Wiring Diagram', documentType: 'product_equipment', weightage: 3 },
      { title: 'Terminal Block Layout', documentType: 'product_equipment', weightage: 2 },
      { title: 'Bill of Material (BOM)', documentType: 'product_equipment', weightage: 2 },
      { title: 'Heat Dissipation Calculation', documentType: 'product_equipment', weightage: 2 },

      // ── Product Testing ──
      { title: 'Type Test Certificates', documentType: 'product_equipment', weightage: 3 },
      { title: 'Routine Test Reports', documentType: 'product_equipment', weightage: 3 },
      { title: 'Factory Acceptance Test (FAT) Report', documentType: 'product_equipment', weightage: 4 },
      { title: 'Compliance Matrix vs Specification', documentType: 'product_equipment', weightage: 3 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // OVERHEAD CATENARY SYSTEM / OHE (OCS)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'mre_ocs_studies',
    name: 'MRE OCS — Studies',
    description:
      'Analytical and calculation-based study documents for the Overhead Catenary System / OHE — span-tension, dynamic interaction, sectioning, bonding, and stray current studies.',
    documents: [
      { title: 'OCS System Design Report', documentType: 'simulation_study', weightage: 6 },
      { title: 'OCS Span & Tension Calculation', documentType: 'simulation_study', weightage: 5 },
      { title: 'Sag-Tension Chart (Temperature-based)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Encumbrance & Clearance Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Pantograph-Catenary Dynamic Interaction Study', documentType: 'simulation_study', weightage: 6 },
      { title: 'Sectioning & Paralleling Study', documentType: 'simulation_study', weightage: 5 },
      { title: 'Neutral Section Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Bonding & Return Current Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Stray Current Analysis', documentType: 'simulation_study', weightage: 4 },
    ],
  },
  {
    id: 'mre_ocs_installation',
    name: 'MRE OCS — Installation',
    description:
      'Execution-oriented drawings for OCS/OHE construction — chainage-wise layout, profile, foundation, erection, sectioning, depot, and third rail system installation.',
    documents: [
      // ── OCS/OHE Installation ──
      { title: 'OCS Layout Plan (Chainage-wise)', documentType: 'installation', weightage: 6 },
      { title: 'OCS Profile Drawing', documentType: 'installation', weightage: 5 },
      { title: 'Cross-Section Drawing (CSD)', documentType: 'installation', weightage: 4 },
      { title: 'Foundation Drawing (Mast/Portal)', documentType: 'installation', weightage: 5 },
      { title: 'Structure Erection Drawing (SED)', documentType: 'installation', weightage: 5 },
      { title: 'Bracket Assembly Drawing', documentType: 'installation', weightage: 4 },
      { title: 'Registration Plan', documentType: 'installation', weightage: 4 },
      { title: 'Sectioning Diagram', documentType: 'installation', weightage: 4 },
      { title: 'Switching Station Layout', documentType: 'installation', weightage: 4 },
      { title: 'Feeder & Return Conductor Layout', documentType: 'installation', weightage: 4 },
      { title: 'Bonding Plan', documentType: 'installation', weightage: 3 },
      { title: 'Depot OCS Layout', documentType: 'installation', weightage: 4 },

      // ── Third Rail System ──
      { title: 'Third Rail Alignment Drawing', documentType: 'installation', weightage: 4 },
      { title: 'Support Bracket Installation Drawing', documentType: 'installation', weightage: 3 },
      { title: 'Expansion Joint Layout', documentType: 'installation', weightage: 3 },
      { title: 'Section Insulator Installation Detail', documentType: 'installation', weightage: 3 },
      { title: 'End Approach Ramp Drawing', documentType: 'installation', weightage: 3 },
    ],
  },
  {
    id: 'mre_ocs_product',
    name: 'MRE OCS — Product',
    description:
      'Manufacturer/vendor detailed engineering documents for OCS/OHE components — cantilever, dropper, insulators, auto-tensioning device, mast, portal, and fittings.',
    documents: [
      { title: 'Cantilever Assembly Drawing', documentType: 'product_equipment', weightage: 5 },
      { title: 'Dropper Design Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Insulator Detail Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Section Insulator Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Auto Tensioning Device Drawing', documentType: 'product_equipment', weightage: 5 },
      { title: 'Portal Boom Fabrication Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Mast Fabrication Drawing', documentType: 'product_equipment', weightage: 5 },
      { title: 'Clamp & Fitting Design Drawings', documentType: 'product_equipment', weightage: 4 },
    ],
  },
];
