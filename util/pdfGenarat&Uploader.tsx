// util/pdfUploader.ts
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import uploadToCloudinary from './UploadCloudinary';

export const generateAndUploadPDF = async (saleData: any) => {
  try {
    // Format date and time
    const now = new Date();
    const billDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    const billTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Calculate totals
    const subtotal = saleData.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = saleData.invoiceNumber || `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getTime().toString().slice(-6)}`;

    // Create HTML template optimized for 58mm thermal printer
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=58mm, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Invoice #${invoiceNumber}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', 'Lucida Console', monospace;
              width: 58mm;
              margin: 0 auto;
              padding: 5px 0;
              background: white;
              color: black;
              font-size: 10px;
              line-height: 1.3;
            }
            .receipt {
              width: 100%;
              padding: 0 3px;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
              border-bottom: 1px dashed #333;
              padding-bottom: 8px;
            }
            .header h1 {
              font-size: 18px;
              font-weight: bold;
              margin: 2px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .header .slogan {
              font-size: 8px;
              color: #555;
              margin: 2px 0;
            }
            .divider {
              border-top: 1px dashed #333;
              margin: 6px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .info-label {
              font-weight: bold;
            }
            .invoice-details {
              margin: 6px 0;
              padding: 4px 0;
              border-bottom: 1px dashed #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            th {
              text-align: left;
              border-bottom: 1px solid #333;
              padding: 4px 0;
              font-size: 9px;
            }
            td {
              padding: 3px 0;
            }
            .item-name {
              max-width: 120px;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .amount-section {
              margin: 8px 0;
              border-top: 1px dashed #333;
              border-bottom: 1px dashed #333;
              padding: 6px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .total-row {
              font-size: 12px;
              font-weight: bold;
              border-top: 1px solid #333;
              margin-top: 4px;
              padding-top: 4px;
            }
            .payment-info {
              margin: 8px 0;
              padding: 4px 0;
            }
            .payment-badge {
              background: ${saleData.dueAmount > 0 ? '#fef3c7' : '#d1fae5'};
              color: ${saleData.dueAmount > 0 ? '#92400e' : '#065f46'};
              padding: 4px;
              text-align: center;
              font-weight: bold;
              font-size: 10px;
              border-radius: 3px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 6px;
              border-top: 1px dashed #333;
              font-size: 8px;
            }
            .footer .developed {
              margin-top: 4px;
              color: #888;
              font-style: italic;
            }
            .qr-placeholder {
              text-align: center;
              margin: 6px 0;
              font-size: 8px;
            }
            .thank-you {
              font-weight: bold;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Header -->
            <div class="header">
              <h1>MYBIZ</h1>
              <div class="slogan">One app. Every Business.</div>
            </div>

            <!-- Invoice Info -->
            <div class="invoice-details">
              <div class="info-row">
                <span class="info-label">Invoice #:</span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span>${billDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span>${billTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cashier:</span>
                <span>${saleData.cashierName || 'Cashier'}</span>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="invoice-details">
              <div class="info-row">
                <span class="info-label">Customer:</span>
                <span>${saleData.customerName || 'Walk-in Customer'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span>${saleData.customerPhone || 'N/A'}</span>
              </div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${saleData.items.map((item: any) => `
                  <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${item.price.toFixed(0)}</td>
                    <td class="text-right">${(item.price * item.quantity).toFixed(0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Amount Summary -->
            <div class="amount-section">
              <div class="amount-row">
                <span>Subtotal:</span>
                <span>Rs ${subtotal.toFixed(0)}</span>
              </div>
              <div class="amount-row">
                <span>Tax (5%):</span>
                <span>Rs ${tax.toFixed(0)}</span>
              </div>
              <div class="amount-row total-row">
                <span>TOTAL:</span>
                <span>Rs ${total.toFixed(0)}</span>
              </div>
            </div>

            <!-- Payment Info -->
            <div class="payment-info">
              <div class="payment-badge">
                ${saleData.paymentMethod === 'cash' ? 'PAID - CASH' : 
                  saleData.paymentMethod === 'credit' ? 'CREDIT SALE' : 
                  saleData.paymentMethod === 'mixed' ? 'PARTIAL PAYMENT' : 'PENDING'}
              </div>
              <div class="amount-row" style="margin-top: 4px;">
                <span>Paid Amount:</span>
                <span>Rs ${saleData.paidAmount ? saleData.paidAmount.toFixed(0) : total.toFixed(0)}</span>
              </div>
              ${saleData.dueAmount > 0 ? `
                <div class="amount-row" style="color: #dc2626;">
                  <span>Due Amount:</span>
                  <span>Rs ${saleData.dueAmount.toFixed(0)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Divider -->
            <div class="divider"></div>

            <!-- Footer -->
            <div class="footer">
              <div class="thank-you">THANK YOU!</div>
              <div>Visit us again</div>
              <div class="qr-placeholder">[ SCAN FOR FEEDBACK ]</div>
              <div class="developed">Developed by Dinuka Dev</div>
              <div style="margin-top: 4px; font-size: 7px;">Terms & conditions apply</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF file with custom dimensions
    const { uri } = await Print.printToFileAsync({ 
      html,
      width: 210, // 58mm ≈ 210 points (1mm = 3.78 points, 58mm × 3.78 ≈ 219, using 210 for safety)
      height: 842, // Auto height
    });
    
    console.log('PDF generated at:', uri);

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(uri);
    
    console.log('Uploaded to Cloudinary:', cloudinaryResult.secure_url);

    // Clean up local file
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        console.log('Local file cleaned up');
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up local file:', cleanupError);
    }

    return {
      success: true,
      localUri: uri,
      cloudinaryUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      invoiceNumber: invoiceNumber
    };

  } catch (error: any) {
    console.error('PDF generation/upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};