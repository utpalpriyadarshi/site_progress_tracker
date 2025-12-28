/**
 * Invoice Form Validation
 * Reusable validation functions for invoice forms
 */

export interface InvoiceFormData {
  invoiceNumber: string;
  poId: string;
  vendorName: string;
  amount: string;
  invoiceDate: Date;
  paymentStatus: string;
  paymentDate?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateInvoiceNumber = (invoiceNumber: string): ValidationResult => {
  if (!invoiceNumber.trim()) {
    return { isValid: false, error: 'Please enter an invoice number' };
  }
  return { isValid: true };
};

export const validatePoId = (poId: string): ValidationResult => {
  if (!poId.trim()) {
    return { isValid: false, error: 'Please enter a PO number' };
  }
  return { isValid: true };
};

export const validateVendorName = (vendorName: string): ValidationResult => {
  if (!vendorName.trim()) {
    return { isValid: false, error: 'Please enter a vendor name' };
  }
  return { isValid: true };
};

export const validateAmount = (amount: string): ValidationResult => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  return { isValid: true };
};

export const validateInvoiceForm = (formData: InvoiceFormData): ValidationResult => {
  const invoiceNumberResult = validateInvoiceNumber(formData.invoiceNumber);
  if (!invoiceNumberResult.isValid) return invoiceNumberResult;

  const poIdResult = validatePoId(formData.poId);
  if (!poIdResult.isValid) return poIdResult;

  const vendorNameResult = validateVendorName(formData.vendorName);
  if (!vendorNameResult.isValid) return vendorNameResult;

  const amountResult = validateAmount(formData.amount);
  if (!amountResult.isValid) return amountResult;

  return { isValid: true };
};
