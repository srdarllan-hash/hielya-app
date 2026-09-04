import type { MvpCatalogItem } from './mvp-local';

/**
 * Contract fixture for Gate validation only. It is not an operational catalog,
 * inventory source or Admin replacement; those must be persistent and editable.
 */
export const MVP_LOCAL_36_CONTRACT_FIXTURE: readonly MvpCatalogItem[] = [
  { sku: 'HYA-CER-001', category: 'Cervejas', kind: 'unit' }, { sku: 'HYA-CER-003', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CER-006', category: 'Cervejas', kind: 'unit' }, { sku: 'HYA-CER-009', category: 'Cervejas', kind: 'unit' },
  { sku: 'HYA-CMB-001', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-001': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-002', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-003': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-003', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-006': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-CMB-004', category: 'Cervejas', kind: 'composite', componentQuantities: { 'HYA-CER-009': 6, 'HYA-GEL-051': 1 } },
  { sku: 'HYA-REF-016', category: 'Refrigerantes', kind: 'unit' }, { sku: 'HYA-REF-017', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-018', category: 'Refrigerantes', kind: 'unit' }, { sku: 'HYA-REF-019', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-REF-020', category: 'Refrigerantes', kind: 'unit' }, { sku: 'HYA-REF-023', category: 'Refrigerantes', kind: 'unit' },
  { sku: 'HYA-ENE-026', category: 'Energéticos', kind: 'unit' }, { sku: 'HYA-ENE-027', category: 'Energéticos', kind: 'unit' }, { sku: 'HYA-ENE-029', category: 'Energéticos', kind: 'unit' },
  { sku: 'HYA-AGU-032', category: 'Águas', kind: 'unit' }, { sku: 'HYA-AGU-034', category: 'Águas', kind: 'unit' },
  { sku: 'HYA-DES-036', category: 'Destilados', kind: 'unit' }, { sku: 'HYA-DES-040', category: 'Destilados', kind: 'unit' }, { sku: 'HYA-DES-044', category: 'Destilados', kind: 'unit' },
  { sku: 'HYA-CMB-005', category: 'Destilados', kind: 'composite', componentQuantities: { 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 } },
  { sku: 'HYA-CMB-006', category: 'Destilados', kind: 'composite', componentQuantities: { 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 } },
  { sku: 'HYA-VIN-046', category: 'Vinhos e Espumantes', kind: 'unit' }, { sku: 'HYA-VIN-047', category: 'Vinhos e Espumantes', kind: 'unit' }, { sku: 'HYA-VIN-049', category: 'Vinhos e Espumantes', kind: 'unit' },
  { sku: 'HYA-GEL-051', category: 'Gelo', kind: 'unit' }, { sku: 'HYA-GEL-052', category: 'Gelo', kind: 'unit' },
  { sku: 'HYA-SNA-053', category: 'Snacks', kind: 'unit' }, { sku: 'HYA-SNA-054', category: 'Snacks', kind: 'unit' }, { sku: 'HYA-SNA-055', category: 'Snacks', kind: 'unit' }, { sku: 'HYA-SNA-056', category: 'Snacks', kind: 'unit' },
  { sku: 'HYA-CON-058', category: 'Conveniência', kind: 'unit' }, { sku: 'HYA-CON-059', category: 'Conveniência', kind: 'unit' }, { sku: 'HYA-CON-060', category: 'Conveniência', kind: 'unit' },
];
