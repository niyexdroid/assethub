import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

interface AgreementData {
  landlordName:   string;
  tenantName:     string;
  propertyAddress: string;
  propertyTitle:  string;
  startDate:      string;
  endDate:        string;
  rentAmount:     string;
  tenancyType:    string;
  cautionFee:     string;
  agencyFee:      string;
  rules?:         string;
  generatedAt:    string;
}

export async function generateAgreementPdf(data: AgreementData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 60 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('TENANCY AGREEMENT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${data.generatedAt}`, { align: 'center' });
    doc.moveDown(1.5);

    // Parties
    doc.fontSize(12).font('Helvetica-Bold').text('PARTIES');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text(`Landlord: ${data.landlordName}`)
      .text(`Tenant:   ${data.tenantName}`);
    doc.moveDown(1);

    // Property
    doc.fontSize(12).font('Helvetica-Bold').text('PROPERTY');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text(`Title:   ${data.propertyTitle}`)
      .text(`Address: ${data.propertyAddress}`);
    doc.moveDown(1);

    // Terms
    doc.fontSize(12).font('Helvetica-Bold').text('TENANCY TERMS');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text(`Type:        ${data.tenancyType}`)
      .text(`Start Date:  ${data.startDate}`)
      .text(`End Date:    ${data.endDate}`)
      .text(`Rent:        ₦${data.rentAmount}`)
      .text(`Caution Fee: ₦${data.cautionFee}`)
      .text(`Agency Fee:  ₦${data.agencyFee}`);
    doc.moveDown(1);

    // Rules
    if (data.rules) {
      doc.fontSize(12).font('Helvetica-Bold').text('HOUSE RULES');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(data.rules);
      doc.moveDown(1);
    }

    // Standard clauses
    doc.fontSize(12).font('Helvetica-Bold').text('STANDARD CLAUSES');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').text(
      '1. The tenant shall pay rent on or before the due date as scheduled on the PropMan platform.\n' +
      '2. The tenant shall keep the property clean and in good repair.\n' +
      '3. The tenant shall not sublet without written landlord consent.\n' +
      '4. The caution fee is refundable at the end of tenancy subject to property condition.\n' +
      '5. Either party may terminate this agreement with 30 days written notice.\n' +
      '6. All disputes shall be resolved through the PropMan platform dispute resolution process.\n' +
      '7. This agreement is governed by Nigerian law.'
    );
    doc.moveDown(2);

    // Signatures
    doc.fontSize(12).font('Helvetica-Bold').text('SIGNATURES');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
      .text('Landlord Signature: ________________________   Date: ____________')
      .moveDown(1)
      .text('Tenant Signature:   ________________________   Date: ____________');

    doc.end();
  });
}
