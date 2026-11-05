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
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
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
          payment_approved: "Payment verified — Order confirmed",
          payment_rejected: "Payment proof update",
          new_order: "New order and payment proof",
          shipment_updated: "Shipment update",
          contact_inquiry: "New customer inquiry",
        }[email.type] || "Bharath Delight Foods Update";
      const message = Object.entries(email.data)
        .filter(([key]) => key !== "order_id")
        .map(
          ([key, value]) =>
            `<p><strong>${escapeHtml(key.replaceAll("_", " "))}</strong> ${escapeHtml(value)}</p>`,
        )
        .join("");
      const body = {
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Bharath Delight Foods",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: email.to }],
        subject,
        htmlContent: `<div style="font-family:Arial;color:#1c2321;max-width:600px;margin:auto"><h1 style="color:#0f3d2e">Bharath Delight Foods</h1><p style="color:#c89b3c">Authenticity in Every Delight.</p><h2>${subject}</h2>${message}</div>`,
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
