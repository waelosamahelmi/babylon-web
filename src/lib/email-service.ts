/**
 * Email Service for sending order confirmations and marketing emails
 * Uses Hostinger SMTP server
 *
 * Setup required:
 * 1. npm install nodemailer
 * 2. Set environment variables in .env:
 *    VITE_SMTP_HOST=smtp.hostinger.com
 *    VITE_SMTP_PORT=587
 *    VITE_SMTP_USER=no-reply@ravintolababylon.fi
 *    VITE_SMTP_PASS=your-password
 */

// Note: This is a client-side implementation template
// For production, you should create a backend API endpoint
// to handle email sending to avoid exposing SMTP credentials

export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    toppings?: string[];
  }>;
  subtotal: number;
  deliveryFee: number;
  smallOrderFee?: number;
  serviceFee?: number;
  totalAmount: number;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  deliveryAddress?: string;
  branchName?: string;
  branchPhone?: string;
  branchAddress?: string;
  specialInstructions?: string;
  paymentMethod: string;
}

export interface MarketingEmailData {
  recipients: string[];
  subject: string;
  htmlContent: string;
}

/**
 * Generate HTML email template for order confirmation
 */
export function generateOrderConfirmationHTML(data: OrderEmailData, language: 'fi' | 'en' = 'fi'): string {
  const t = {
    fi: {
      title: 'Tilausvahvistus',
      thanks: 'Kiitos tilauksestasi!',
      orderNumber: 'Tilausnumero',
      orderType: {
        delivery: 'Kotiinkuljetus',
        pickup: 'Nouto',
        'dine-in': 'Ravintolassa'
      },
      items: 'Tilauksen sisältö',
      quantity: 'Määrä',
      price: 'Hinta',
      subtotal: 'Välisumma',
      deliveryFee: 'Toimituskulut',
      smallOrderFee: 'Pienkäsittelymaksu',
      serviceFee: 'Palvelumaksu',
      total: 'Yhteensä',
      deliveryAddress: 'Toimitusosoite',
      branch: 'Ravintola',
      specialInstructions: 'Erityisohjeet',
      paymentMethod: 'Maksutapa',
      payment: {
        cash: 'Käteinen',
        card: 'Kortti',
        online: 'Verkkomaksu'
      },
      footer: 'Otathan yhteyttä, jos sinulla on kysyttävää tilauksestasi.',
      regards: 'Ystävällisin terveisin'
    },
    en: {
      title: 'Order Confirmation',
      thanks: 'Thank you for your order!',
      orderNumber: 'Order Number',
      orderType: {
        delivery: 'Delivery',
        pickup: 'Pickup',
        'dine-in': 'Dine-in'
      },
      items: 'Order Items',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      smallOrderFee: 'Small Order Fee',
      serviceFee: 'Service Fee',
      total: 'Total',
      deliveryAddress: 'Delivery Address',
      branch: 'Restaurant',
      specialInstructions: 'Special Instructions',
      paymentMethod: 'Payment Method',
      payment: {
        cash: 'Cash',
        card: 'Card',
        online: 'Online Payment'
      },
      footer: 'Please contact us if you have any questions about your order.',
      regards: 'Best regards'
    }
  };

  const text = t[language];
  const orderTypeText = text.orderType[data.orderType] || data.orderType;
  const paymentMethodText = text.payment[data.paymentMethod as keyof typeof text.payment] || data.paymentMethod;

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${text.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #8B4513 0%, #FF8C00 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .order-number {
      background: linear-gradient(135deg, #FF8C00 0%, #FF6347 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .info-section {
      margin: 25px 0;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
      border-left: 4px solid #FF8C00;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .info-value {
      color: #333;
      font-size: 16px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table th {
      background-color: #8B4513;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .toppings {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .summary-table {
      width: 100%;
      margin: 20px 0;
    }
    .summary-table td {
      padding: 8px 0;
    }
    .summary-table td:last-child {
      text-align: right;
    }
    .summary-label {
      font-weight: bold;
      color: #666;
    }
    .summary-total {
      font-size: 20px;
      font-weight: bold;
      color: #8B4513;
      padding-top: 10px;
      border-top: 2px solid #8B4513;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer .restaurant-name {
      font-size: 18px;
      font-weight: bold;
      color: #8B4513;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Ravintola Babylon</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">${text.thanks}</div>
      <p style="color: #666; margin-bottom: 20px;">
        ${data.customerName}, ${text.footer}
      </p>

      <!-- Order Number -->
      <div class="order-number">
        ${text.orderNumber}: <span style="font-size: 24px;">${data.orderNumber}</span>
      </div>

      <!-- Order Type & Branch Info -->
      <div class="info-section">
        <div class="info-label">${text.orderType[data.orderType as keyof typeof text.orderType]}</div>
        ${data.branchName ? `
          <div style="margin-top: 10px;">
            <strong>${text.branch}:</strong> ${data.branchName}<br>
            ${data.branchPhone ? `<strong>${language === 'fi' ? 'Puhelin' : 'Phone'}:</strong> ${data.branchPhone}<br>` : ''}
            ${data.branchAddress ? `<strong>${language === 'fi' ? 'Osoite' : 'Address'}:</strong> ${data.branchAddress}` : ''}
          </div>
        ` : ''}
        ${data.orderType === 'delivery' && data.deliveryAddress ? `
          <div style="margin-top: 10px;">
            <div class="info-label">${text.deliveryAddress}</div>
            <div class="info-value">${data.deliveryAddress}</div>
          </div>
        ` : ''}
      </div>

      <!-- Order Items -->
      <h3 style="color: #333; border-bottom: 2px solid #FF8C00; padding-bottom: 10px;">
        ${text.items}
      </h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>${language === 'fi' ? 'Tuote' : 'Item'}</th>
            <th style="text-align: center;">${text.quantity}</th>
            <th style="text-align: right;">${text.price}</th>
          </tr>
        </thead>
        <tbody>
          ${data.orderItems.map(item => `
            <tr>
              <td>
                ${item.name}
                ${item.toppings && item.toppings.length > 0 ? `
                  <div class="toppings">+ ${item.toppings.join(', ')}</div>
                ` : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${item.price.toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <table class="summary-table">
        <tr>
          <td class="summary-label">${text.subtotal}:</td>
          <td>${data.subtotal.toFixed(2)} €</td>
        </tr>
        ${data.deliveryFee > 0 ? `
          <tr>
            <td class="summary-label">${text.deliveryFee}:</td>
            <td>${data.deliveryFee.toFixed(2)} €</td>
          </tr>
        ` : ''}
        ${data.smallOrderFee && data.smallOrderFee > 0 ? `
          <tr>
            <td class="summary-label">${text.smallOrderFee}:</td>
            <td>${data.smallOrderFee.toFixed(2)} €</td>
          </tr>
        ` : ''}
        ${data.serviceFee && data.serviceFee > 0 ? `
          <tr>
            <td class="summary-label">${text.serviceFee}:</td>
            <td>${data.serviceFee.toFixed(2)} €</td>
          </tr>
        ` : ''}
        <tr>
          <td class="summary-total">${text.total}:</td>
          <td class="summary-total">${data.totalAmount.toFixed(2)} €</td>
        </tr>
      </table>

      <!-- Payment Method -->
      <div class="info-section">
        <div class="info-label">${text.paymentMethod}</div>
        <div class="info-value">${paymentMethodText}</div>
      </div>

      <!-- Special Instructions -->
      ${data.specialInstructions ? `
        <div class="info-section">
          <div class="info-label">${text.specialInstructions}</div>
          <div class="info-value">${data.specialInstructions}</div>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="restaurant-name">Ravintola Babylon</div>
      <p>${text.regards}</p>
      <p>
        <strong>${language === 'fi' ? 'Yhteystiedot' : 'Contact'}:</strong><br>
        +358 3 589 9089<br>
        info@ravintolababylon.fi
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send order confirmation email
 * Note: This should be called from a backend API endpoint in production
 */
export async function sendOrderConfirmationEmail(
  data: OrderEmailData,
  language: 'fi' | 'en' = 'fi'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate HTML content
    const htmlContent = generateOrderConfirmationHTML(data, language);

    // In a real implementation, you would call your backend API here
    // Example:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: data.customerEmail,
    //     subject: language === 'fi'
    //       ? `Tilausvahvistus - ${data.orderNumber}`
    //       : `Order Confirmation - ${data.orderNumber}`,
    //     html: htmlContent
    //   })
    // });

    // Get API URL from environment or use default
    const API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

    console.log('📧 Sending email to:', data.customerEmail);
    console.log('📧 Order number:', data.orderNumber);

    // Call backend API
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: language === 'fi'
          ? `Tilausvahvistus - ${data.orderNumber}`
          : `Order Confirmation - ${data.orderNumber}`,
        html: htmlContent,
        replyTo: 'info@ravintolababylon.fi'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result.messageId);

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email:', error);

    // Don't fail the order if email fails - just log and continue
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send marketing email to multiple recipients
 * Note: This should be called from a backend API endpoint in production
 */
export async function sendMarketingEmail(
  data: MarketingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, you would call your backend API here
    // Example:
    // const response = await fetch('/api/send-marketing-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });

    console.log('📧 Marketing email would be sent to:', data.recipients.length, 'recipients');
    console.log('📧 Subject:', data.subject);

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send marketing email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
