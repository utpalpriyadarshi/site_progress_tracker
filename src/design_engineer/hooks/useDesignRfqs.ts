import { useState, useEffect } from 'react';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { DesignRfq, DoorsPackage } from '../types/DesignRfqTypes';
import DoorsPackageModel from '../../../models/DoorsPackageModel';
import RfqModel from '../../../models/RfqModel';

export const useDesignRfqs = (projectId: string, refreshTrigger: number, showSnackbar: (message: string) => void) => {
  const [rfqs, setRfqs] = useState<DesignRfq[]>([]);
  const [doorsPackages, setDoorsPackages] = useState<DoorsPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRfqs();
    loadDoorsPackages();
  }, [projectId, refreshTrigger]);

  const loadDoorsPackages = async () => {
    if (!projectId) return;

    try {
      const doorsCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const packagesData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const packagesList = packagesData.map((pkg: DoorsPackageModel) => ({
        id: pkg.id,
        doorsId: pkg.doorsId,
        equipmentType: pkg.equipmentType,
        category: pkg.category,
        totalRequirements: pkg.totalRequirements,
        siteName: '',
      }));

      setDoorsPackages(packagesList);
    } catch (error) {
      logger.error('[DesignRfq] Error loading DOORS packages:', error as Error);
    }
  };

  const loadRfqs = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('[DesignRfq] Loading Design RFQs for project:', { projectId });

      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const rfqsData = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

      const rfqsList = rfqsData.map((rfq: RfqModel) => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        doorsId: rfq.doorsId,
        doorsPackageId: rfq.doorsPackageId,
        projectId: rfq.projectId,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        rfqType: rfq.rfqType,
        issueDate: rfq.issueDate,
        closingDate: rfq.closingDate,
        evaluationDate: rfq.evaluationDate,
        awardDate: rfq.awardDate,
        expectedDeliveryDays: rfq.expectedDeliveryDays,
        totalVendorsInvited: rfq.totalVendorsInvited,
        totalQuotesReceived: rfq.totalQuotesReceived,
        winningVendorId: rfq.winningVendorId,
        awardedValue: rfq.awardedValue,
        createdById: rfq.createdById,
        createdAt: rfq.createdAt,
      }));

      logger.debug('[DesignRfq] Loaded RFQs:', { value: rfqsList.length });
      setRfqs(rfqsList);
    } catch (error) {
      logger.error('[DesignRfq] Error loading RFQs:', error as Error);
      showSnackbar('Failed to load Design RFQs');
    } finally {
      setLoading(false);
    }
  };

  const generateRfqNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DRFQ-${timestamp}`;
  };

  const createRfq = async (
    title: string,
    description: string,
    doorsPackageId: string,
    expectedDeliveryDays: string
  ) => {
    if (!title || !doorsPackageId) {
      showSnackbar('Please fill in all required fields');
      return false;
    }

    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const selectedPackage = doorsPackages.find((p) => p.id === doorsPackageId);

      if (!selectedPackage) {
        showSnackbar('Selected DOORS package not found');
        return false;
      }

      await database.write(async () => {
        await rfqCollection.create((record: any) => {
          record.rfqNumber = generateRfqNumber();
          record.doorsId = selectedPackage.doorsId;
          record.doorsPackageId = doorsPackageId;
          record.projectId = projectId;
          record.title = title;
          record.description = description || null;
          record.status = 'draft';
          record.rfqType = 'design';
          record.expectedDeliveryDays = parseInt(expectedDeliveryDays) || 30;
          record.totalVendorsInvited = 0;
          record.totalQuotesReceived = 0;
          record.createdById = '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      showSnackbar('Design RFQ created successfully');
      loadRfqs();
      return true;
    } catch (error) {
      logger.error('[DesignRfq] Error creating RFQ:', error as Error);
      showSnackbar('Failed to create Design RFQ');
      return false;
    }
  };

  const issueRfq = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'issued';
          record.issueDate = Date.now();
        });
      });

      showSnackbar('RFQ issued successfully');
      loadRfqs();
    } catch (error) {
      logger.error('[DesignRfq] Error issuing RFQ:', error as Error);
      showSnackbar('Failed to issue RFQ');
    }
  };

  const markQuotesReceived = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'quotes_received';
        });
      });

      showSnackbar('Marked as quotes received');
      loadRfqs();
    } catch (error) {
      logger.error('[DesignRfq] Error updating RFQ:', error as Error);
      showSnackbar('Failed to update RFQ');
    }
  };

  return {
    rfqs,
    doorsPackages,
    loading,
    createRfq,
    issueRfq,
    markQuotesReceived,
  };
};
