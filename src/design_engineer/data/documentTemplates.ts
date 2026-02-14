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
  {
    id: 'mre_traction_substation',
    name: 'MRE Traction Substation',
    description: 'Core document set for a Metro Railway Electrification traction substation — covers system studies, TSS installation, equipment specs, and as-built records.',
    documents: [
      // ── Studies: System-Level (Project/Voltage Level) ──
      { title: 'Design Basis Report (DBR)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Load Flow Study (Normal & Degraded Mode)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Short Circuit Study (Max/Min Fault Level)', documentType: 'simulation_study', weightage: 5 },
      { title: 'Protection Coordination Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Relay Setting Calculations', documentType: 'simulation_study', weightage: 3 },
      { title: 'Insulation Coordination Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'Earthing Grid Design Calculation', documentType: 'simulation_study', weightage: 3 },
      { title: 'Step & Touch Potential Calculation', documentType: 'simulation_study', weightage: 3 },
      { title: 'Lightning Protection Risk Assessment', documentType: 'simulation_study', weightage: 2 },

      // ── Installation: TSS (Site Level) ──
      { title: 'General Arrangement (GA) Drawing', documentType: 'installation', weightage: 5 },
      { title: 'Equipment Layout Plan', documentType: 'installation', weightage: 4 },
      { title: 'Single Line Diagram (SLD)', documentType: 'installation', weightage: 5 },
      { title: 'Cable Schedule & Routing Drawing', documentType: 'installation', weightage: 4 },
      { title: 'Earthing Layout Plan', documentType: 'installation', weightage: 3 },
      { title: 'Lightning Protection Layout', documentType: 'installation', weightage: 3 },
      { title: 'Protection Wiring Diagram', documentType: 'installation', weightage: 3 },
      { title: 'SCADA I/O List', documentType: 'installation', weightage: 2 },
      { title: 'Control Panel Layout', documentType: 'installation', weightage: 2 },

      // ── Product: Equipment (Product Level) ──
      { title: 'Transformer GA Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Circuit Breaker GA & Control Schematic', documentType: 'product_equipment', weightage: 3 },
      { title: 'Protection Relay Logic & Setting Sheet', documentType: 'product_equipment', weightage: 3 },
      { title: 'SCADA Architecture & Network Topology', documentType: 'product_equipment', weightage: 2 },
      { title: 'Factory Acceptance Test (FAT) Report', documentType: 'product_equipment', weightage: 2 },

      // ── As-Built (Post-Construction) ──
      { title: 'As-Built TSS GA Drawing', documentType: 'as_built', weightage: 3 },
      { title: 'As-Built SLD', documentType: 'as_built', weightage: 3 },
      { title: 'As-Built Cable Routing Drawing', documentType: 'as_built', weightage: 2 },
      { title: 'As-Built Earthing & Bonding Layout', documentType: 'as_built', weightage: 2 },
      { title: 'Updated Protection Settings', documentType: 'as_built', weightage: 2 },
      { title: 'Energization Certificate', documentType: 'as_built', weightage: 2 },
      { title: 'Integrated Testing Report', documentType: 'as_built', weightage: 2 },
    ],
  },
  {
    id: 'mre_ocs_ohe',
    name: 'MRE OCS/OHE System',
    description: 'Document set for Overhead Catenary System / OHE — covers OCS studies, installation drawings, component specs, and as-built records.',
    documents: [
      // ── Studies: OCS/OHE (System Level) ──
      { title: 'OCS System Design Report', documentType: 'simulation_study', weightage: 6 },
      { title: 'OCS Span & Tension Calculation', documentType: 'simulation_study', weightage: 5 },
      { title: 'Sag-Tension Chart (Temperature-based)', documentType: 'simulation_study', weightage: 4 },
      { title: 'Pantograph-Catenary Dynamic Interaction Study', documentType: 'simulation_study', weightage: 5 },
      { title: 'Sectioning & Paralleling Study', documentType: 'simulation_study', weightage: 4 },
      { title: 'Bonding & Return Current Study', documentType: 'simulation_study', weightage: 3 },
      { title: 'Stray Current Analysis', documentType: 'simulation_study', weightage: 3 },

      // ── Installation: OCS (Site Level) ──
      { title: 'OCS Layout Plan (Chainage-wise)', documentType: 'installation', weightage: 6 },
      { title: 'OCS Profile Drawing', documentType: 'installation', weightage: 4 },
      { title: 'Foundation Drawing (Mast/Portal)', documentType: 'installation', weightage: 4 },
      { title: 'Structure Erection Drawing', documentType: 'installation', weightage: 4 },
      { title: 'Sectioning Diagram', documentType: 'installation', weightage: 3 },
      { title: 'Feeder & Return Conductor Layout', documentType: 'installation', weightage: 3 },
      { title: 'Bonding Plan', documentType: 'installation', weightage: 3 },

      // ── Product: OCS Components (Product Level) ──
      { title: 'Cantilever Assembly Drawing', documentType: 'product_equipment', weightage: 4 },
      { title: 'Section Insulator Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Auto Tensioning Device Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Mast Fabrication Drawing', documentType: 'product_equipment', weightage: 3 },
      { title: 'Clamp & Fitting Design Drawings', documentType: 'product_equipment', weightage: 2 },

      // ── As-Built ──
      { title: 'Final OCS Layout (Chainage-wise)', documentType: 'as_built', weightage: 5 },
      { title: 'Final Sectioning Diagram', documentType: 'as_built', weightage: 4 },
      { title: 'As-Built Bonding Layout', documentType: 'as_built', weightage: 3 },
      { title: 'Earth Resistance Test Results', documentType: 'as_built', weightage: 3 },
      { title: 'Cable Megger Test Results (Final)', documentType: 'as_built', weightage: 3 },
    ],
  },
];
