'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface PrintPaymentInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDetails: {
    payment_account_name: string;
    payment_sort_code?: string;
    payment_account_number: string;
    payment_iban?: string;
    payment_swift_bic?: string;
    payment_bank_address?: string;
    payment_reference_code: string;
    base_currency: string;
  };
  clientName?: string;
  amountDue?: number;
}

export function PrintPaymentInstructions({
  open,
  onOpenChange,
  paymentDetails,
  clientName,
  amountDue,
}: PrintPaymentInstructionsProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('payment-instructions-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Instructions</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 40px;
              line-height: 1.6;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .section {
              margin: 20px 0;
            }
            .label {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .value {
              margin-left: 20px;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .important {
              border: 2px solid #000;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #000;
              font-size: 12px;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const content = `
KUMBRA CAPITAL LIMITED
PAYMENT INSTRUCTIONS
=====================================

Date: ${new Date().toLocaleDateString('en-GB')}
${clientName ? `Client: ${clientName}` : ''}
${amountDue ? `Amount Due: ${paymentDetails.base_currency} ${amountDue.toFixed(2)}` : ''}

BANK ACCOUNT DETAILS
-------------------------------------
Account Name: ${paymentDetails.payment_account_name}
${paymentDetails.payment_sort_code ? `Sort Code: ${paymentDetails.payment_sort_code}` : ''}
Account Number: ${paymentDetails.payment_account_number}
${paymentDetails.payment_iban ? `IBAN: ${paymentDetails.payment_iban}` : ''}
${paymentDetails.payment_swift_bic ? `SWIFT/BIC: ${paymentDetails.payment_swift_bic}` : ''}
${paymentDetails.payment_bank_address ? `Bank Address: ${paymentDetails.payment_bank_address}` : ''}

PAYMENT REFERENCE (REQUIRED)
-------------------------------------
${paymentDetails.payment_reference_code}

*** IMPORTANT INSTRUCTIONS ***
-------------------------------------
1. Please include the payment reference code above
   when making your transfer.

2. This reference code is unique to your account
   and ensures your payment is credited correctly.

3. You can transfer the exact amount due or add
   additional funds to your cash balance for
   future investments.

4. UK bank transfers (Faster Payments) typically
   arrive within hours. SEPA transfers may take
   1-2 business days.

5. Your account will be updated once we receive
   and process your payment.

CONTACT INFORMATION
-------------------------------------
If you have any questions about this payment,
please contact your advisor or our support team.

=====================================
This is a computer-generated document.
Please retain for your records.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-instructions-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Payment Instructions</DialogTitle>
          <DialogDescription>
            Print or download these instructions to take to your bank
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id="payment-instructions-print"
            className="bg-white p-8 border-2 border-border rounded-lg font-mono text-sm"
          >
            <div className="header text-center mb-6 pb-4 border-b-2 border-black">
              <h2 className="text-xl font-bold mb-2">KUMBRA CAPITAL LIMITED</h2>
              <h3 className="text-lg">PAYMENT INSTRUCTIONS</h3>
              <p className="text-xs mt-2">Date: {new Date().toLocaleDateString('en-GB')}</p>
              {clientName && <p className="text-xs">Client: {clientName}</p>}
              {amountDue && (
                <p className="text-xs font-bold mt-2">
                  Amount Due: {paymentDetails.base_currency} {amountDue.toFixed(2)}
                </p>
              )}
            </div>

            <div className="section mb-6">
              <h4 className="font-bold mb-3">BANK ACCOUNT DETAILS</h4>
              <div className="ml-4 space-y-2">
                <div>
                  <div className="font-bold">Account Name:</div>
                  <div className="ml-4">{paymentDetails.payment_account_name}</div>
                </div>
                {paymentDetails.payment_sort_code && (
                  <div>
                    <div className="font-bold">Sort Code:</div>
                    <div className="ml-4">{paymentDetails.payment_sort_code}</div>
                  </div>
                )}
                <div>
                  <div className="font-bold">Account Number:</div>
                  <div className="ml-4">{paymentDetails.payment_account_number}</div>
                </div>
                {paymentDetails.payment_iban && (
                  <div>
                    <div className="font-bold">IBAN:</div>
                    <div className="ml-4">{paymentDetails.payment_iban}</div>
                  </div>
                )}
                {paymentDetails.payment_swift_bic && (
                  <div>
                    <div className="font-bold">SWIFT/BIC:</div>
                    <div className="ml-4">{paymentDetails.payment_swift_bic}</div>
                  </div>
                )}
                {paymentDetails.payment_bank_address && (
                  <div>
                    <div className="font-bold">Bank Address:</div>
                    <div className="ml-4">{paymentDetails.payment_bank_address}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="important border-2 border-black p-4 mb-6">
              <h4 className="font-bold mb-2">PAYMENT REFERENCE (REQUIRED)</h4>
              <div className="text-center text-xl font-bold my-4">
                {paymentDetails.payment_reference_code}
              </div>
            </div>

            <div className="section mb-6">
              <h4 className="font-bold mb-3">*** IMPORTANT INSTRUCTIONS ***</h4>
              <div className="ml-4 space-y-2 text-xs">
                <p>1. Please include the payment reference code above when making your transfer.</p>
                <p>2. This reference code is unique to your account and ensures your payment is credited correctly.</p>
                <p>3. You can transfer the exact amount due or add additional funds to your cash balance for future investments.</p>
                <p>4. UK bank transfers (Faster Payments) typically arrive within hours. SEPA transfers may take 1-2 business days.</p>
                <p>5. Your account will be updated once we receive and process your payment.</p>
              </div>
            </div>

            <div className="footer text-xs text-center pt-4 border-t border-black mt-6">
              <p>If you have any questions, please contact your advisor or our support team.</p>
              <p className="mt-2">This is a computer-generated document. Please retain for your records.</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download as Text
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Instructions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
