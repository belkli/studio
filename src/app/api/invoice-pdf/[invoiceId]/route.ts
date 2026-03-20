import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Invoice } from '@/lib/types';
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from '@/lib/brand';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  if (process.env.LYRIOSA_INTERNAL_PDF_ENABLED === 'false') {
    return new NextResponse('PDF generation is disabled', { status: 404 });
  }

  const { invoiceId } = await params;
  const db = await getDb();
  const invoice = await db.payments.findById(invoiceId);

  if (!invoice) {
    return new NextResponse('Invoice not found', { status: 404 });
  }

  // Cast to access extended fields not yet on the Invoice type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as Invoice & Record<string, any>;
  const gatewayName = inv.paymentMethod ?? 'שער התשלום';
  const paidAt = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString('he-IL')
    : '-';
  const amount = (invoice.total ?? 0).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
  });

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>אסמכתא תשלום ${invoice.invoiceNumber || invoiceId}</title>
  <style>
    body { font-family: 'Arial', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .invoice-title { font-size: 28px; font-weight: bold; color: #4f46e5; text-align: left; }
    .invoice-meta { color: #666; font-size: 14px; text-align: left; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: right; font-weight: 600; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row { font-size: 18px; font-weight: bold; background: #f0f0ff; }
    .status { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 14px; }
    @media print { body { margin: 0; } .no-print { display: none; } }
    .disclaimer { background:#fff3cd; border:2px solid #ffc107; border-radius:6px; padding:12px 16px; margin-bottom:24px; font-size:13px; font-weight:600; color:#856404; text-align:center; }
  </style>
</head>
<body>
  <div class="disclaimer">
    מסמך פנימי בלבד — אינו מהווה חשבונית מס. החשבונית הרשמית הונפקה על-ידי ${gatewayName}.
  </div>
  <div class="header">
    <div class="logo">${BRAND_NAME}</div>
    <div>
      <div class="invoice-title">אסמכתא תשלום — מסמך פנימי</div>
      <div class="invoice-meta">מספר: ${invoice.invoiceNumber || invoiceId}</div>
      <div class="invoice-meta">תאריך תשלום: ${paidAt}</div>
    </div>
  </div>

  <table>
    <tr><th>שדה</th><th>פרטים</th></tr>
    <tr><td>לקוח</td><td>${inv.payerName || 'N/A'}</td></tr>
    <tr><td>מייל</td><td>${inv.payerEmail || '-'}</td></tr>
    <tr><td>חבילה</td><td>${inv.packageTitle || 'שיעורי מוזיקה'}</td></tr>
    <tr><td>מספר עסקה</td><td>${inv.cardcomTransactionId || '-'}</td></tr>
    <tr><td>סטטוס</td><td><span class="status">שולם</span></td></tr>
    <tr class="total-row"><td>סה"כ</td><td>${amount}</td></tr>
  </table>

  <p style="font-size:12px; color:#999; margin-top:40px;">מסמך זה הופק אוטומטית על ידי מערכת ${BRAND_NAME}. לשאלות: ${BRAND_SUPPORT_EMAIL}</p>

  <div class="no-print" style="margin-top:20px;">
    <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:16px;">הדפס / שמור PDF</button>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
