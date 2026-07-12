import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to the project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function main() {
  console.log('Running license expiry reminders...');

  // Get drivers with licenses expiring in the next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const now = new Date();

  const driversExpiringSoon = await prisma.driver.findMany({
    where: {
      licenseExpiryDate: {
        gt: now,
        lte: thirtyDaysFromNow,
      },
    },
  });

  if (driversExpiringSoon.length === 0) {
    console.log('No drivers with licenses expiring in the next 30 days.');
    return;
  }

  console.log(`Found ${driversExpiringSoon.length} driver(s) with expiring licenses.`);

  // Send an email to the depot managers / admin (using the SMTP_FROM email for demo purposes)
  const managerEmail = process.env.SMTP_USER || 'admin@transitops.in';

  let emailHtml = `
    <h2>Driver License Expiry Alert</h2>
    <p>The following drivers have licenses expiring within the next 30 days:</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th>Driver Name</th>
          <th>License Number</th>
          <th>Category</th>
          <th>Expiry Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  driversExpiringSoon.forEach(driver => {
    emailHtml += `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.licenseNumber}</td>
          <td>${driver.licenseCategory}</td>
          <td style="color: red; font-weight: bold;">${driver.licenseExpiryDate.toLocaleDateString('en-IN')}</td>
          <td>${driver.status}</td>
        </tr>
    `;
  });

  emailHtml += `
      </tbody>
    </table>
    <p>Please ensure these drivers renew their licenses to remain compliant with operational rules.</p>
    <br/>
    <p>TransitOps System</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"TransitOps" <no-reply@transitops.in>',
      to: managerEmail,
      subject: 'Action Required: Driver Licenses Expiring Soon',
      html: emailHtml,
    });
    console.log('Reminder email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send reminder email:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
