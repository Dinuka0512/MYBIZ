// util/pdfUploader.ts
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import uploadToCloudinary from './UploadCloudinary';

export const generateAndUploadPDF = async (saleData: any) => {
  try {
    // Format date
    const billDate = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    const billTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate totals
    const subtotal = saleData.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    // Create HTML template
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${saleData.invoiceNumber || Date.now()}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: #fff;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              padding: 30px;
              border: 1px solid #eee;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              color: #333;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #333;
              color: white;
              padding: 12px;
              text-align: left;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }
            .text-right {
              text-align: right;
            }
            .grand-total {
              font-size: 22px;
              font-weight: bold;
              color: #000;
              border-top: 2px solid #333;
              margin-top: 10px;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <h1>INVOICE</h1>
              <p>Your Business Name</p>
              <p>Tel: (555) 111-222-33</p>
            </div>

            <div style="margin-bottom: 20px;">
              <p><strong>Invoice #:</strong> ${saleData.invoiceNumber || 'INV-' + Date.now().toString().slice(-8)}</p>
              <p><strong>Date:</strong> ${billDate} ${billTime}</p>
              <p><strong>Cashier:</strong> ${saleData.cashierName || 'John Smith'}</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3>Bill To:</h3>
              <p><strong>Name:</strong> ${saleData.customerName || 'Walk-in Customer'}</p>
              <p><strong>Phone:</strong> ${saleData.customerPhone || 'N/A'}</p>
            </div>

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
                    <td>${item.name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">Rs ${item.price.toFixed(2)}</td>
                    <td class="text-right">Rs ${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px;">
                  <p><strong>Subtotal:</strong> Rs ${subtotal.toFixed(2)}</p>
                  <p><strong>Tax (5%):</strong> Rs ${tax.toFixed(2)}</p>
                  <p class="grand-total"><strong>Total:</strong> Rs ${total.toFixed(2)}</p>
                  <p><strong>Payment:</strong> ${saleData.paymentMethod}</p>
                  ${saleData.dueAmount ? `<p style="color: #dc2626;"><strong>Due:</strong> Rs ${saleData.dueAmount.toFixed(2)}</p>` : ''}
                </div>
              </div>
            </div>

            <div style="margin-top: 40px; text-align: center;">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({ html });
    
    console.log('PDF generated at:', uri);

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(uri);
    
    console.log('Uploaded to Cloudinary:', cloudinaryResult.secure_url);

    // Clean up local file using the new API
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
      publicId: cloudinaryResult.public_id
    };

  } catch (error:any) {
    console.error('PDF generation/upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};