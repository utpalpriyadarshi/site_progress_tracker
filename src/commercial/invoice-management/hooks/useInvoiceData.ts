import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../../models/database';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';
import { isInvoiceOverdue } from '../utils';

export interface Invoice {
  id: string;
  projectId: string;
  poId: string;
  invoiceNumber: string;
  invoiceDate: number;
  dueDate?: number;
  amount: number;
  paymentStatus: string;
  paymentDate?: number;
  vendorId: string;
  vendorName?: string;
  createdBy: string;
  createdAt: number;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  amount: string;
  poId: string;
  vendorName: string;
  invoiceDate: Date;
  dueDate?: Date;
  paymentDate?: Date;
  paymentStatus: string;
}

export const useInvoiceData = (projectId: string | null, userId: string) => {
  const { show: showSnackbar } = useSnackbar();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Invoice] Loading invoices for project:', { projectId });

      const invoicesCollection = database.collections.get('invoices');
      const invoicesData = await invoicesCollection
        .query(Q.where('project_id', projectId), Q.sortBy('invoice_date', Q.desc))
        .fetch();

      // Map invoices with vendor names and overdue calculation
      const invoicesWithVendors = invoicesData.map((invoice: any) => {
        const isOverdue = isInvoiceOverdue(invoice.invoiceDate, invoice.paymentStatus, invoice.dueDate);

        return {
          id: invoice.id,
          projectId: invoice.projectId,
          poId: invoice.poId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          amount: invoice.amount,
          paymentStatus: isOverdue ? 'overdue' : invoice.paymentStatus,
          paymentDate: invoice.paymentDate,
          vendorId: invoice.vendorId,
          vendorName: invoice.vendorName || 'Unknown Vendor',
          createdBy: invoice.createdBy,
          createdAt: invoice.createdAt,
        };
      });

      logger.debug('[Invoice] Loaded invoices:', { value: invoicesWithVendors.length });
      setInvoices(invoicesWithVendors);
    } catch (error) {
      logger.error('[Invoice] Error loading invoices:', error as Error);
      showSnackbar('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [projectId, showSnackbar]);

  const createInvoice = async (formData: InvoiceFormData): Promise<boolean> => {
    try {
      const invoicesCollection = database.collections.get('invoices');
      const amount = parseFloat(formData.amount);

      await database.write(async () => {
        await invoicesCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = formData.poId.trim();
          record.invoiceNumber = formData.invoiceNumber.trim();
          record.invoiceDate = formData.invoiceDate.getTime();
          record.dueDate = formData.dueDate ? formData.dueDate.getTime() : null;
          record.amount = amount;
          record.paymentStatus = formData.paymentStatus;
          record.paymentDate = formData.paymentDate ? formData.paymentDate.getTime() : null;
          record.vendorId = '';
          record.vendorName = formData.vendorName.trim();
          record.createdBy = userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      showSnackbar('Invoice created successfully');
      await loadInvoices();
      return true;
    } catch (error) {
      logger.error('[Invoice] Error creating invoice:', error as Error);
      showSnackbar('Failed to create invoice');
      return false;
    }
  };

  const updateInvoice = async (invoiceId: string, formData: InvoiceFormData): Promise<boolean> => {
    try {
      const invoicesCollection = database.collections.get('invoices');
      const invoiceRecord = await invoicesCollection.find(invoiceId);
      const amount = parseFloat(formData.amount);

      await database.write(async () => {
        await invoiceRecord.update((record: any) => {
          record.poId = formData.poId.trim();
          record.invoiceNumber = formData.invoiceNumber.trim();
          record.invoiceDate = formData.invoiceDate.getTime();
          record.dueDate = formData.dueDate ? formData.dueDate.getTime() : null;
          record.amount = amount;
          record.paymentStatus = formData.paymentStatus;
          record.paymentDate = formData.paymentDate ? formData.paymentDate.getTime() : null;
          record.vendorId = '';
          record.vendorName = formData.vendorName.trim();
          record.appSyncStatus = 'pending';
        });
      });

      showSnackbar('Invoice updated successfully');
      await loadInvoices();
      return true;
    } catch (error) {
      logger.error('[Invoice] Error updating invoice:', error as Error);
      showSnackbar('Failed to update invoice');
      return false;
    }
  };

  const deleteInvoice = (invoice: Invoice): void => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const invoicesCollection = database.collections.get('invoices');
              const invoiceRecord = await invoicesCollection.find(invoice.id);

              await database.write(async () => {
                await invoiceRecord.markAsDeleted();
              });

              showSnackbar('Invoice deleted successfully');
              await loadInvoices();
            } catch (error) {
              logger.error('[Invoice] Error deleting invoice:', error as Error);
              showSnackbar('Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const markInvoiceAsPaid = (invoice: Invoice): void => {
    Alert.alert('Mark as Paid', `Mark invoice ${invoice.invoiceNumber} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            const invoicesCollection = database.collections.get('invoices');
            const invoiceRecord = await invoicesCollection.find(invoice.id);

            await database.write(async () => {
              await invoiceRecord.update((record: any) => {
                record.paymentStatus = 'paid';
                record.paymentDate = Date.now();
                record.appSyncStatus = 'pending';
              });
            });

            showSnackbar('Invoice marked as paid');
            await loadInvoices();
          } catch (error) {
            logger.error('[Invoice] Error marking invoice as paid:', error as Error);
            showSnackbar('Failed to mark invoice as paid');
          }
        },
      },
    ]);
  };

  return {
    invoices,
    loading,
    loadInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
  };
};
