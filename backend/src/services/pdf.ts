import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export function generateTicketPDF(booking: any, stream: Writable): void {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the document to the stream
  doc.pipe(stream);

  // Set colors
  const primaryColor = '#0F0F1A';
  const accentColor = '#FF6B6B';
  const mutedColor = '#666666';

  // 1. Header
  doc.fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('WanderWise E-Ticket', { align: 'center' });
  doc.moveDown(0.5);

  doc.strokeColor('#E0E0E0')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(562, doc.y)
     .stroke();
  doc.moveDown(1);

  // 2. Booking Metadata Grid
  const startY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(mutedColor).text('BOOKING ID:', 50, startY);
  doc.fillColor(primaryColor).text(booking.provider_booking_id, 50, startY + 15);

  doc.fillColor(mutedColor).text('PNR / REFERENCE:', 220, startY);
  doc.fillColor(primaryColor).text(booking.booking_reference, 220, startY + 15);

  doc.fillColor(mutedColor).text('BOOKING TYPE:', 390, startY);
  doc.fillColor(primaryColor).text(booking.booking_type.toUpperCase(), 390, startY + 15);

  doc.moveDown(3);

  // 3. Journey Details Section
  const detailsY = doc.y;
  doc.strokeColor(accentColor)
     .lineWidth(2)
     .moveTo(50, detailsY)
     .lineTo(50, detailsY + 80)
     .stroke();

  doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('JOURNEY DETAILS', 65, detailsY);
  doc.fontSize(10).font('Helvetica').fillColor(mutedColor);

  const j = booking.journey_details;
  if (booking.booking_type === 'flight') {
    doc.text(`Carrier: ${j.airline_name} (${j.flight_number})`, 65, detailsY + 20);
    doc.text(`Route: ${j.source} -> ${j.destination}`, 65, detailsY + 35);
    doc.text(`Departure: ${j.date} at ${j.departure_time}`, 65, detailsY + 50);
    doc.text(`Duration & Class: ${j.duration} | ${j.cabin_class}`, 65, detailsY + 65);
  } else if (booking.booking_type === 'train') {
    doc.text(`Train: ${j.train_name} (${j.train_number})`, 65, detailsY + 20);
    doc.text(`Route: ${j.source} -> ${j.destination}`, 65, detailsY + 35);
    doc.text(`Date & Dep: ${j.date} at ${j.departure_time}`, 65, detailsY + 50);
    doc.text(`Class & Quota: ${j.class_name} | ${j.quota}`, 65, detailsY + 65);
  } else {
    doc.text(`Operator: ${j.operator_name} (${j.bus_type})`, 65, detailsY + 20);
    doc.text(`Route: ${j.source} -> ${j.destination}`, 65, detailsY + 35);
    doc.text(`Date & Dep: ${j.date} at ${j.departure_time}`, 65, detailsY + 50);
    doc.text(`Boarding: ${j.boarding_point?.name}`, 65, detailsY + 65);
  }

  doc.moveDown(4);

  // 4. Passenger Details Table
  doc.fontSize(12).font('Helvetica-Bold').text('PASSENGERS', 50, doc.y);
  doc.moveDown(0.5);

  const tableHeaderY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
  doc.text('Name', 50, tableHeaderY);
  doc.text('Age / Gender', 250, tableHeaderY);
  doc.text('Seat / Berth', 400, tableHeaderY);

  doc.strokeColor('#E0E0E0')
     .lineWidth(1)
     .moveTo(50, tableHeaderY + 15)
     .lineTo(562, tableHeaderY + 15)
     .stroke();

  let currentY = tableHeaderY + 25;
  doc.font('Helvetica').fillColor(mutedColor);
  booking.passengers.forEach((passenger: any) => {
    doc.text(passenger.name, 50, currentY);
    doc.text(`${passenger.age} / ${passenger.gender}`, 250, currentY);
    doc.text(passenger.seat_number || 'Confirmed', 400, currentY);
    currentY += 20;
  });

  doc.moveDown(2);

  // 5. Payment details & QR
  const bottomY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('PAYMENT SUMMARY', 50, bottomY);
  doc.font('Helvetica').fillColor(mutedColor);
  doc.text(`Total Paid: INR ${booking.amount_paid}`, 50, bottomY + 20);
  doc.text(`Payment ID: ${booking.payment_id}`, 50, bottomY + 35);
  doc.text(`Status: Confirmed`, 50, bottomY + 50);

  // Draw simulated QR Code
  const qrX = 420;
  const qrY = bottomY;
  const qrSize = 100;

  // Background
  doc.rect(qrX, qrY, qrSize, qrSize).fill('#F5F5F5');
  
  // Custom QR grid drawing loops to look like a barcode/QR code
  doc.fillColor('#000000');
  doc.rect(qrX + 10, qrY + 10, 25, 25).fill();
  doc.rect(qrX + 13, qrY + 13, 19, 19).fill('#F5F5F5');
  doc.rect(qrX + 16, qrY + 16, 13, 13).fill('#000000');

  doc.rect(qrX + 65, qrY + 10, 25, 25).fill();
  doc.rect(qrX + 68, qrY + 13, 19, 19).fill('#F5F5F5');
  doc.rect(qrX + 71, qrY + 16, 13, 13).fill('#000000');

  doc.rect(qrX + 10, qrY + 65, 25, 25).fill();
  doc.rect(qrX + 13, qrY + 68, 19, 19).fill('#F5F5F5');
  doc.rect(qrX + 16, qrY + 71, 13, 13).fill('#000000');

  // Random pixel blocks for QR representation
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 4; k++) {
      if ((i + k) % 2 === 0) {
        doc.rect(qrX + 40 + (i * 8), qrY + 40 + (k * 8), 6, 6).fill('#000000');
      }
    }
  }

  // Footer note
  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .fillColor(mutedColor)
     .text('Please present this ticket at check-in or boarding. Wish you a safe and wonderful journey with WanderWise!', 50, 720, { align: 'center', width: 512 });

  // End the document
  doc.end();
}
