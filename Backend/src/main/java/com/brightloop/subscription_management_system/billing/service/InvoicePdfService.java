package com.brightloop.subscription_management_system.billing.service;

import com.brightloop.subscription_management_system.billing.entity.Invoice;
import com.brightloop.subscription_management_system.billing.entity.InvoiceLine;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class InvoicePdfService {

    public byte[] generatePdf(Invoice invoice) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryColor = new Color(41, 128, 185);
            Color darkGray = new Color(50, 50, 50);

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, primaryColor);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkGray);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkGray);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkGray);

            // Title
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_RIGHT);
            document.add(title);

            Paragraph company = new Paragraph("Brightloop Subscription Management\nEmail: billing@brightloop.com\n\n", normalFont);
            document.add(company);

            // Invoice Info Table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);

            PdfPCell customerCell = new PdfPCell();
            customerCell.setBorder(Rectangle.NO_BORDER);
            customerCell.addElement(new Paragraph("Billed To:", boldFont));
            customerCell.addElement(new Paragraph(invoice.getCustomer().getName(), normalFont));
            customerCell.addElement(new Paragraph(invoice.getCustomer().getEmail(), normalFont));
            infoTable.addCell(customerCell);

            PdfPCell invoiceMetaCell = new PdfPCell();
            invoiceMetaCell.setBorder(Rectangle.NO_BORDER);
            invoiceMetaCell.addElement(new Paragraph("Invoice Number: " + invoice.getNumber(), boldFont));
            invoiceMetaCell.addElement(new Paragraph("Invoice Date: " + invoice.getInvoiceDate(), normalFont));
            invoiceMetaCell.addElement(new Paragraph("Due Date: " + invoice.getDueDate(), normalFont));
            invoiceMetaCell.addElement(new Paragraph("Status: " + invoice.getStatus(), boldFont));
            invoiceMetaCell.addElement(new Paragraph("Period: " + invoice.getPeriodStart() + " to " + invoice.getPeriodEnd(), normalFont));
            infoTable.addCell(invoiceMetaCell);

            document.add(infoTable);
            document.add(new Paragraph("\n"));

            // Line items table
            PdfPTable lineTable = new PdfPTable(5);
            lineTable.setWidthPercentage(100);
            lineTable.setWidths(new float[]{40, 15, 15, 15, 15});

            addHeaderCell(lineTable, "Description", headerFont, primaryColor);
            addHeaderCell(lineTable, "Qty", headerFont, primaryColor);
            addHeaderCell(lineTable, "Unit Price", headerFont, primaryColor);
            addHeaderCell(lineTable, "Tax %", headerFont, primaryColor);
            addHeaderCell(lineTable, "Total", headerFont, primaryColor);

            for (InvoiceLine line : invoice.getLines()) {
                lineTable.addCell(createCell(line.getDescription(), normalFont, Element.ALIGN_LEFT));
                lineTable.addCell(createCell(String.valueOf(line.getQuantity()), normalFont, Element.ALIGN_CENTER));
                lineTable.addCell(createCell(formatMoney(line.getUnitPrice()), normalFont, Element.ALIGN_RIGHT));
                lineTable.addCell(createCell(line.getTaxPercent().setScale(2, RoundingMode.HALF_UP) + "%", normalFont, Element.ALIGN_CENTER));
                lineTable.addCell(createCell(formatMoney(line.getLineTotal()), normalFont, Element.ALIGN_RIGHT));
            }

            document.add(lineTable);
            document.add(new Paragraph("\n"));

            // Totals table
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            addTotalRow(totalsTable, "Subtotal:", formatMoney(invoice.getSubtotal()), normalFont);
            if (invoice.getDiscountTotal() != null && invoice.getDiscountTotal().compareTo(BigDecimal.ZERO) > 0) {
                addTotalRow(totalsTable, "Discount:", "-" + formatMoney(invoice.getDiscountTotal()), normalFont);
            }
            addTotalRow(totalsTable, "Tax Total:", formatMoney(invoice.getTaxTotal()), normalFont);
            addTotalRow(totalsTable, "Total:", formatMoney(invoice.getTotal()), boldFont);
            addTotalRow(totalsTable, "Paid Amount:", formatMoney(invoice.getPaidAmount()), normalFont);
            addTotalRow(totalsTable, "Amount Due:", formatMoney(invoice.getAmountLeft()), boldFont);

            document.add(totalsTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF for invoice " + invoice.getNumber(), e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private PdfPCell createCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
