import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import {
  active,
  now,
  uid,
  oid,
  fail,
  insert,
  amount,
  money,
  settings,
  get,
} from "./core.js";

const currency = (value) =>
  "INR " +
  amount(value)
    .toNumber()
    .toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
function pdfBuffer(render, options = {}) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 36, ...options });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    try {
      render(document);
      document.end();
    } catch (error) {
      reject(error);
    }
  });
}
function table(doc, headers, rows, widths) {
  const left = 36;
  let y = doc.y;
  const draw = (values, heading = false) => {
    doc.font(heading ? "Helvetica-Bold" : "Helvetica").fontSize(8);
    const height = Math.max(
      25,
      ...values.map(
        (value, index) =>
          doc.heightOfString(String(value), { width: widths[index] - 12 }) + 12,
      ),
    );
    if (y + height > doc.page.height - 50) {
      doc.addPage();
      y = 36;
    }
    let x = left;
    values.forEach((value, index) => {
      doc
        .rect(x, y, widths[index], height)
        .fillAndStroke(heading ? "#0F3D2E" : "#FFFFFF", "#E5E7EB");
      doc
        .fillColor(heading ? "#FFFFFF" : "#1C2321")
        .text(String(value), x + 6, y + 6, { width: widths[index] - 12 });
      x += widths[index];
    });
    y += height;
  };
  draw(headers, true);
  for (const row of rows) draw(row);
  doc.x = left;
  doc.y = y + 15;
}
export function renderSingleInvoice(doc, order, store) {
  doc.x = 36;
  doc.y = 36;
  doc
    .fillColor("#0F3D2E")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(store.brand_name || "Bharath Delight Foods");
  doc.fillColor("#C89B3C").fontSize(8).text("Authenticity in Every Delight.").moveDown();
  doc.fillColor("#1C2321").font("Helvetica").fontSize(9);
  if (store.gst_number) doc.text(`GSTIN: ${store.gst_number}`);
  if (store.fssai_number) doc.text(`FSSAI Lic. No: ${store.fssai_number}`);
  if (store.business_address) doc.text(`Address: ${store.business_address}`);
  doc.moveDown();
  doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor("#C89B3C").stroke();
  doc.moveDown();
  const start = doc.y;
  const customer = order.customer_snapshot;
  const address = order.shipping_address_snapshot;
  const name =
    `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
    address.full_name;
  doc
    .fillColor("#0F3D2E")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("CUSTOMER INFORMATION", 36, start);
  doc
    .fillColor("#1C2321")
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Name: ${name}\nEmail: ${customer.email}\nPhone: ${customer.phone || address.phone}`,
      { width: 255 },
    );
  doc
    .moveDown()
    .fillColor("#0F3D2E")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("SHIPPING ADDRESS");
  doc
    .fillColor("#1C2321")
    .font("Helvetica")
    .fontSize(9)
    .text(
      [
        address.full_name,
        address.address_line1,
        address.address_line2,
        `${address.city}, ${address.state} - ${address.pincode}`,
        address.country,
      ]
        .filter(Boolean)
        .join("\n"),
      { width: 255 },
    );
  const end = doc.y;
  doc
    .fillColor("#0F3D2E")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("INVOICE METADATA", 306, start);
  doc
    .fillColor("#1C2321")
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Invoice Number: ${order.invoice_number || "PENDING"}\nInvoice Date: ${new Date(order.invoice_generated_at || now()).toLocaleDateString("en-GB")}\nOrder Number: #${order.order_number}\nPayment Status: ${order.payment_status?.toUpperCase() || "PAID"}`,
      { width: 253 },
    );
  doc.x = 36;
  doc.y = Math.max(end, doc.y) + 20;
  table(
    doc,
    ["SKU", "Product Details", "Qty", "Unit Price", "Total"],
    order.items.map((item) => [
      item.sku,
      `${item.product_name} (${item.variant_title || item.volume_weight || "Default"})`,
      item.quantity,
      currency(item.unit_price),
      currency(item.line_total),
    ]),
    [90, 210, 40, 93, 90],
  );
  const totals = [
    ["Subtotal", order.pricing.subtotal],
    ["GST (5%)", order.pricing.tax_total],
    ["Shipping Fee", order.pricing.shipping_fee],
    ["Grand Total", order.pricing.grand_total],
  ];
  for (const [label, value] of totals) {
    if (doc.y > 750) doc.addPage();
    const y = doc.y;
    doc
      .font(label === "Grand Total" ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .text(label, 355, y, { width: 105 });
    doc.text(
      label === "Shipping Fee" && amount(value).isZero()
        ? "FREE"
        : currency(value),
      460,
      y,
      { width: 99, align: "right" },
    );
    doc.y = Math.max(doc.y, y + 20);
  }
  doc.x = 36;
  doc
    .moveDown(2)
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor("#6B7280")
    .text(
      "Thank you for shopping with Bharath Delight Foods. Sourced responsibly.\nThis is a computer-generated document. No signature is required.",
      36,
      doc.y,
      { width: 523, align: "center" },
    );
}

export function invoicePdf(order, store) {
  return pdfBuffer((doc) => renderSingleInvoice(doc, order, store));
}

export function bulkInvoicesPdf(orders, store) {
  return pdfBuffer((doc) => {
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      renderSingleInvoice(doc, order, store);
    });
  });
}

export async function reportExport(db, req, res) {
  const filter = { ...active };
  if (req.query.status) {
    filter.order_status = String(req.query.status);
  } else {
    filter.$or = [
      { order_status: { $ne: "pending_payment" } },
      { proof_submitted_at: { $ne: null } },
    ];
  }
  if (req.query.start_date || req.query.end_date) {
    filter.created_at = {};
    if (req.query.start_date) {
      const start = new Date(req.query.start_date);
      if (Number.isNaN(start.getTime())) fail("Invalid start date.");
      filter.created_at.$gte = start;
    }
    if (req.query.end_date) {
      const end = new Date(req.query.end_date);
      if (Number.isNaN(end.getTime())) fail("Invalid end date.");
      end.setUTCHours(23, 59, 59, 999);
      filter.created_at.$lte = end;
    }
  }
  const orders = await db
    .collection("orders")
    .find(filter)
    .sort({ created_at: -1 })
    .limit(10000)
    .toArray();
  const rows = orders.map((order) => [
    order.order_number,
    new Date(order.created_at).toISOString().slice(0, 10),
    order.customer_snapshot.email,
    (order.items || [])
      .map(
        (item) =>
          `${item.product_name} (${item.variant_title || item.volume_weight || "Default"}) x${item.quantity}`,
      )
      .join("\n"),
    order.order_status,
    order.payment_status,
    amount(order.pricing.grand_total).toNumber(),
  ]);
  const headers = [
    "Order Number",
    "Date",
    "Customer Email",
    "Products & Variants",
    "Order Status",
    "Payment Status",
    "Grand Total (INR)",
  ];
  if (req.query.format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");
    sheet.addRow(headers);
    for (const row of rows) sheet.addRow(row);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F3D2E" },
    };
    sheet.columns.forEach((column, index) => {
      column.width = [25, 14, 32, 45, 18, 18, 20][index];
    });
    sheet.getColumn(4).alignment = { wrapText: true, vertical: "top" };
    sheet.getColumn(7).numFmt = "#,##0.00";
    res
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .attachment("orders-report.xlsx")
      .send(Buffer.from(await workbook.xlsx.writeBuffer()));
  } else if (req.query.format === "pdf") {
    const pdf = await pdfBuffer(
      (doc) => {
        doc
          .fontSize(18)
          .fillColor("#0F3D2E")
          .text("Bharath Delight Foods — Orders Report");
        doc
          .fontSize(9)
          .fillColor("#666666")
          .text(`Generated ${now().toISOString().slice(0, 10)} | ${orders.length} orders total`)
          .moveDown(1);
        table(doc, headers, rows, [90, 60, 140, 215, 85, 80, 100]);
      },
      { layout: "landscape" },
    );
    res.type("application/pdf").attachment("orders-report.pdf").send(pdf);
  } else fail("Report format must be pdf or excel.");
}
export async function queueEmail(db, type, to, data, session) {
  if (!to) return;
  await insert(
    db,
    "email_outbox",
    { type, to, data, status: "pending", attempts: 0, next_attempt_at: now() },
    session,
  );
}

export function getCourierUrl(carrierName) {
  const norm = String(carrierName || "").toLowerCase().trim();
  if (norm.includes("st courier") || norm.includes("stcourier")) {
    return "https://stcourier.com/track/shipment";
  }
  if (norm.includes("professional") || norm.includes("tpc")) {
    return "https://www.tpcindia.com";
  }
  return "https://stcourier.com/track/shipment";
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

function buildEmailHtml(email, subject) {
  const brandName = "Bharath Delight Foods";
  const tagline = "Authenticity in Every Delight.";
  const customerName = escapeHtml(email.data?.customer_name || "Valued Customer");
  const orderNumber = escapeHtml(email.data?.order_number || "");
  const carrierName = escapeHtml(email.data?.carrier_name || "Courier Partner");
  const trackingNumber = escapeHtml(email.data?.tracking_number || "");
  const trackingUrl = email.data?.tracking_url || getCourierUrl(carrierName);

  if (email.type === "shipment_dispatched") {
    const itemsRows = (email.data?.items || [])
      .map(
        (item) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 8px;font-size:13px;color:#1c2321;">
            <strong>${escapeHtml(item.product_name)}</strong>
            <div style="font-size:11px;color:#6b7280;">${escapeHtml(item.variant_title)}</div>
          </td>
          <td style="padding:10px 8px;font-size:13px;color:#1c2321;text-align:center;">x${item.quantity}</td>
          <td style="padding:10px 8px;font-size:13px;color:#1c2321;text-align:right;">Rs. ${Number(item.total_price || 0).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const address = email.data?.shipping_address;
    const addressHtml = address
      ? `
      <div style="margin-top:16px;padding:12px 16px;background:#f9fafb;border-radius:6px;font-size:12px;color:#374151;line-height:1.5;">
        <strong style="color:#0f3d2e;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;display:block;margin-bottom:4px;">Delivery Address</strong>
        ${escapeHtml(address.full_name || "")}<br/>
        ${escapeHtml(address.address_line1 || "")}${address.address_line2 ? ", " + escapeHtml(address.address_line2) : ""}<br/>
        ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} - ${escapeHtml(address.pincode || "")}<br/>
        Phone: ${escapeHtml(address.phone || "")}
      </div>`
      : "";

    return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#0F3D2E;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:0.5px;">${brandName}</h1>
        <p style="color:#C89B3C;margin:6px 0 0 0;font-size:12px;font-style:italic;">${tagline}</p>
      </div>
      <div style="padding:24px 28px;">
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
          <h2 style="color:#065f46;margin:0 0 4px 0;font-size:16px;">📦 Your Order Has Been Dispatched!</h2>
          <p style="margin:0;color:#047857;font-size:13px;">Order <strong>#${orderNumber}</strong> has been carefully packaged and handed over to our delivery partner.</p>
        </div>

        <p style="font-size:14px;color:#1f2937;margin-top:0;">Hello <strong>${customerName}</strong>,</p>
        <p style="font-size:13px;color:#4b5563;line-height:1.5;">Great news! Your package is now on its way to you. You can track your consignment in real-time using the details below.</p>

        <!-- Tracking Card -->
        <div style="background:#FAF9F6;border:1px solid #C89B3C;border-radius:8px;padding:18px;margin:20px 0;text-align:center;">
          <div style="font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Courier Service</div>
          <div style="font-size:18px;font-weight:bold;color:#0F3D2E;margin-bottom:12px;">${carrierName}</div>
          <div style="font-size:11px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tracking / Consignment ID</div>
          <div style="font-family:monospace;font-size:18px;font-weight:bold;color:#1c2321;background:#ffffff;display:inline-block;padding:6px 16px;border:1px dashed #C89B3C;border-radius:4px;letter-spacing:1px;margin-bottom:16px;">${trackingNumber}</div>
          <div>
            <a href="${trackingUrl}" target="_blank" style="background:#0F3D2E;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:bold;display:inline-block;">Track on Courier Portal →</a>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-top:10px;">Tip: Copy the Tracking ID above and paste it on the tracking page to view live updates.</div>
        </div>

        <!-- Ordered Products -->
        <h3 style="font-size:14px;color:#0F3D2E;margin:20px 0 10px 0;border-bottom:2px solid #C89B3C;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Products in this Shipment</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
              <th style="padding:8px;font-size:11px;color:#6b7280;text-align:left;text-transform:uppercase;">Product</th>
              <th style="padding:8px;font-size:11px;color:#6b7280;text-align:center;text-transform:uppercase;">Qty</th>
              <th style="padding:8px;font-size:11px;color:#6b7280;text-align:right;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        ${addressHtml}

        <p style="font-size:12px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          Thank you for ordering with <strong>${brandName}</strong>.<br/>
          If you have any questions, simply reply to this email.
        </p>
      </div>
    </div>`;
  }

  if (email.type === "shipment_delivered") {
    return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#0F3D2E;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:0.5px;">${brandName}</h1>
        <p style="color:#C89B3C;margin:6px 0 0 0;font-size:12px;font-style:italic;">${tagline}</p>
      </div>
      <div style="padding:24px 28px;">
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:16px 20px;margin-bottom:20px;text-align:center;">
          <h2 style="color:#065f46;margin:0 0 4px 0;font-size:18px;">🎉 Your Order Has Been Delivered!</h2>
          <p style="margin:0;color:#047857;font-size:13px;">Order <strong>#${orderNumber}</strong> has been successfully delivered to your address via ${carrierName}.</p>
        </div>

        <p style="font-size:14px;color:#1f2937;margin-top:0;">Hello <strong>${customerName}</strong>,</p>
        <p style="font-size:13px;color:#4b5563;line-height:1.6;">
          We are pleased to inform you that your package (Tracking ID: <strong>${trackingNumber}</strong>) has been successfully delivered!
        </p>
        <p style="font-size:13px;color:#4b5563;line-height:1.6;">
          We hope you relish the purity and authenticity of our traditional delicacies. Thank you for making Bharath Delight Foods a part of your family table.
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="https://bharath-delight-foods.pages.dev" target="_blank" style="background:#0F3D2E;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:bold;display:inline-block;">Visit Bharath Delight Foods Store →</a>
        </div>

        <p style="font-size:12px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          Warm regards,<br/><strong>Bharath Delight Foods Team</strong>
        </p>
      </div>
    </div>`;
  }

  if (email.type === "shipment_returned") {
    return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#0F3D2E;padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:0.5px;">${brandName}</h1>
        <p style="color:#C89B3C;margin:6px 0 0 0;font-size:12px;font-style:italic;">${tagline}</p>
      </div>
      <div style="padding:24px 28px;">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
          <h2 style="color:#991b1b;margin:0 0 4px 0;font-size:16px;">Notice: Package Marked as Returned</h2>
          <p style="margin:0;color:#b91c1c;font-size:13px;">Order <strong>#${orderNumber}</strong> was marked as returned by ${carrierName}.</p>
        </div>

        <p style="font-size:14px;color:#1f2937;margin-top:0;">Hello <strong>${customerName}</strong>,</p>
        <p style="font-size:13px;color:#4b5563;line-height:1.6;">
          Your shipment with Tracking ID <strong>${trackingNumber}</strong> could not be delivered and has been marked as returned to sender by the courier service.
        </p>
        <p style="font-size:13px;color:#4b5563;line-height:1.6;">
          If this was due to an address issue or if you would like us to re-dispatch your package, please reply directly to this email or contact our support team right away so we can assist you.
        </p>

        <p style="font-size:12px;color:#6b7280;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          Bharath Delight Foods Customer Support
        </p>
      </div>
    </div>`;
  }

  // Fallback for default email types (payment_approved, etc.)
  const message = Object.entries(email.data || {})
    .filter(([key]) => key !== "order_id" && key !== "items" && key !== "shipping_address")
    .map(
      ([key, value]) =>
        `<p style="margin:4px 0;font-size:13px;"><strong>${escapeHtml(key.replaceAll("_", " "))}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join("");

  return `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1c2321;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:8px;"><h1 style="color:#0f3d2e;margin-top:0;">${brandName}</h1><p style="color:#c89b3c;font-style:italic;margin-top:-6px;">${tagline}</p><h2 style="font-size:16px;color:#1c2321;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">${subject}</h2>${message}</div>`;
}

export async function sendPendingEmails(db) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) return;
  for (let index = 0; index < 10; index++) {
    const lease = uid();
    const email = await db
      .collection("email_outbox")
      .findOneAndUpdate(
        {
          status: { $in: ["pending", "sending"] },
          next_attempt_at: { $lte: now() },
          attempts: { $lt: 5 },
        },
        {
          $set: {
            status: "sending",
            lease,
            next_attempt_at: new Date(Date.now() + 120000),
          },
          $inc: { attempts: 1 },
        },
        { returnDocument: "after" },
      );
    if (!email) break;
    try {
      const subject =
        {
          payment_approved: `Payment verified — Order #${email.data?.order_number || ""} confirmed`,
          payment_rejected: `Payment proof update — Order #${email.data?.order_number || ""}`,
          new_order: `New order and payment proof — Order #${email.data?.order_number || ""}`,
          shipment_dispatched: `Order #${email.data?.order_number || ""} Dispatched via ${email.data?.carrier_name || "Courier"} — Bharath Delight Foods`,
          shipment_delivered: `Order #${email.data?.order_number || ""} Delivered — Bharath Delight Foods`,
          shipment_returned: `Order #${email.data?.order_number || ""} Update: Package Returned — Bharath Delight Foods`,
          contact_inquiry: "New customer inquiry — Bharath Delight Foods",
        }[email.type] || "Bharath Delight Foods Update";

      const body = {
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Bharath Delight Foods",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: email.to }],
        subject,
        htmlContent: buildEmailHtml(email, subject),
      };
      if (email.type === "payment_approved") {
        const order = await get(db, "orders", email.data.order_id);
        if (!order.invoice_number) {
          order.invoice_number = `INV-${now().toISOString().slice(0, 10).replaceAll("-", "")}-${order.order_number}`;
          order.invoice_generated_at = now();
          await db
            .collection("orders")
            .updateOne(
              { _id: order._id, invoice_number: null },
              {
                $set: {
                  invoice_number: order.invoice_number,
                  invoice_generated_at: order.invoice_generated_at,
                },
              },
            );
        }
        body.attachment = [
          {
            name: `${order.invoice_number}.pdf`,
            content: (await invoicePdf(order, await settings(db))).toString(
              "base64",
            ),
          },
        ];
      }
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}`);
      await db
        .collection("email_outbox")
        .updateOne(
          { _id: email._id, lease },
          { $set: { status: "sent", sent_at: now() } },
        );
    } catch (error) {
      await db
        .collection("email_outbox")
        .updateOne(
          { _id: email._id, lease },
          {
            $set: {
              status: email.attempts >= 5 ? "failed" : "pending",
              next_attempt_at: new Date(Date.now() + email.attempts * 60000),
              last_error: error.message,
            },
          },
        );
    }
  }
}
