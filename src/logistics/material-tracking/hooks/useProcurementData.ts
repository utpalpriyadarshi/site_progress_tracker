/**
 * useProcurementData Hook
 *
 * Manages procurement suggestions and supplier quotes
 */

import { useState, useEffect } from 'react';
import MaterialModel from '../../../models/MaterialModel';
import BomItemModel from '../../../models/BomItemModel';
import MaterialProcurementService, {
  PurchaseSuggestion,
  SupplierQuote,
} from '../../services/MaterialProcurementService';
import mockSuppliers from '../../data/mockSuppliers';
import { logger } from '../../services/LoggingService';

export const useProcurementData = (
  materials: MaterialModel[],
  bomItems: BomItemModel[]
) => {
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialModel | null>(null);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProcurementData();
  }, [materials, bomItems]);

  const loadProcurementData = () => {
    if (materials.length > 0 && bomItems.length > 0) {
      try {
        setLoading(true);
        // Generate purchase suggestions
        const suggestions = MaterialProcurementService.generatePurchaseSuggestions(
          materials,
          bomItems,
          mockSuppliers
        );
        setPurchaseSuggestions(suggestions);
        logger.debug('[useProcurementData] Generated suggestions:', suggestions.length);
      } catch (error) {
        logger.error('[useProcurementData] Error loading procurement data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadSupplierQuotes = (material: MaterialModel) => {
    try {
      setSelectedMaterial(material);

      // Calculate quantity needed
      const shortage = Math.max(0, material.quantityRequired - material.quantityAvailable);
      const quantity = shortage > 0 ? shortage * 1.2 : 100; // Default order qty

      // Generate quotes
      const quotes = MaterialProcurementService.generateSupplierQuotes(
        material,
        quantity,
        mockSuppliers
      );

      setSupplierQuotes(quotes);
      logger.debug('[useProcurementData] Generated quotes:', quotes.length);

      return quotes;
    } catch (error) {
      logger.error('[useProcurementData] Error loading supplier quotes:', error);
      return [];
    }
  };

  const refresh = () => {
    loadProcurementData();
  };

  return {
    purchaseSuggestions,
    selectedMaterial,
    supplierQuotes,
    loading,
    loadSupplierQuotes,
    refresh,
  };
};
