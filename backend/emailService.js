import nodemailer from 'nodemailer';

/**
 * Create SMTP transporter
 */
function createTransporter() {
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPass,
    },
  });
}

/**
 * Professional Enterprise Email Template
 */
function generateEmailHtml({
  title = 'Laptop Assignment Confirmation',
  introText = 'A company device has been successfully provisioned and assigned to you. Please review the assigned asset and software details below.',
  userName,
  companyName,
  model,
  serialNo,
  hrRefNumber,
  formattedDate,
  windowsLicense,
  msOfficePackage,
  performedBy,
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f4f7fb;
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
  }

  table {
    border-spacing: 0;
    width: 100%;
  }

  .wrapper {
    width: 100%;
    table-layout: fixed;
    background-color: #f4f7fb;
    padding: 40px 0;
  }

  .main {
    background-color: #ffffff;
    margin: 0 auto;
    width: 100%;
    max-width: 720px;
    border-spacing: 0;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
  }

  .header {
    background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
    padding: 40px;
    color: #ffffff;
  }

  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: bold;
  }

  .header p {
    margin-top: 10px;
    font-size: 14px;
    opacity: 0.9;
  }

  .content {
    padding: 40px;
  }

  .greeting {
    font-size: 15px;
    line-height: 1.8;
    color: #334155;
    margin-bottom: 30px;
  }

  .section {
    margin-bottom: 28px;
  }

  .section-title {
    font-size: 13px;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 14px;
  }

  .info-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 20px;
  }

  .info-table td {
    padding: 12px 0;
    border-bottom: 1px solid #e2e8f0;
    font-size: 14px;
  }

  .info-table tr:last-child td {
    border-bottom: none;
  }

  .label {
    color: #64748b;
    font-weight: 600;
  }

  .value {
    text-align: right;
    color: #0f172a;
    font-weight: 700;
  }

  .badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .active {
    background: #dcfce7;
    color: #166534;
  }

  .inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .policy {
    background: #fff7ed;
    border-left: 4px solid #f97316;
    padding: 22px;
    border-radius: 0 12px 12px 0;
    margin-top: 30px;
  }

  .policy h3 {
    margin: 0 0 14px;
    font-size: 16px;
    color: #c2410c;
  }

  .policy ul {
    margin: 0;
    padding-left: 18px;
    color: #7c2d12;
    font-size: 14px;
    line-height: 1.8;
  }

  .policy li {
    margin-bottom: 10px;
  }

  .notice {
    margin-top: 30px;
    font-size: 13px;
    color: #64748b;
    text-align: center;
    line-height: 1.7;
  }

  .footer {
    background: #f8fafc;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    line-height: 1.8;
  }

  .footer strong {
    color: #0f172a;
  }

  @media screen and (max-width: 600px) {
    .content {
      padding: 25px !important;
    }

    .header {
      padding: 30px !important;
    }

    .header h1 {
      font-size: 22px !important;
    }
  }
</style>
</head>

<body>

<div class="wrapper">

  <table class="main">

    <tr>
      <td class="header">
        <h1>${title}</h1>
        <p>${companyName} — Manage Service System</p>
      </td>
    </tr>

    <tr>
      <td class="content">

        <div class="greeting">
          <p>Dear <strong>${userName}</strong>,</p>

          <p>
            ${introText}
          </p>

          <p>
            Please review the asset allocation details below and ensure compliance with the organization's IT usage and security policies.
          </p>
        </div>

        <div class="section">
          <div class="section-title">
            Hardware Information
          </div>

          <div class="info-box">

            <table class="info-table">

              <tr>
                <td class="label">Device Model</td>
                <td class="value">${model || 'N/A'}</td>
              </tr>

              <tr>
                <td class="label">Serial Number</td>
                <td class="value">${serialNo || 'N/A'}</td>
              </tr>

              <tr>
                <td class="label">HR Reference</td>
                <td class="value">${hrRefNumber || 'N/A'}</td>
              </tr>

              <tr>
                <td class="label">Assignment Date</td>
                <td class="value">${formattedDate}</td>
              </tr>

            </table>

          </div>
        </div>

        <div class="section">
          <div class="section-title">
            Software & Licensing
          </div>

          <div class="info-box">

            <table class="info-table">

              <tr>
                <td class="label">Windows License</td>
                <td class="value">
                  <span class="badge ${windowsLicense ? 'active' : 'inactive'}">
                    ${windowsLicense ? 'Activated' : 'Not Licensed'}
                  </span>
                </td>
              </tr>

              <tr>
                <td class="label">Microsoft Office</td>
                <td class="value">
                  <span class="badge ${msOfficePackage ? 'active' : 'inactive'}">
                    ${msOfficePackage ? 'Provisioned' : 'Not Assigned'}
                  </span>
                </td>
              </tr>

            </table>

          </div>
        </div>

        <div class="policy">

          <h3>Corporate Device Usage Policy</h3>

          <ul>
            <li>
              This device remains the property of <strong>${companyName}</strong>.
            </li>

            <li>
              The device is intended strictly for authorized business and operational activities.
            </li>

            <li>
              Installation of unauthorized software, games, or personal applications is prohibited.
            </li>

            <li>
              Users are responsible for maintaining the confidentiality of login credentials and company information.
            </li>

            <li>
              Any loss, theft, malfunction, or security concern must be reported immediately to the IT department.
            </li>

            <li>
              Company-approved cloud storage and security practices must be followed at all times.
            </li>

          </ul>

        </div>

        <div class="notice">

          If you notice any discrepancy in the assigned asset details, please contact
          <strong>${performedBy || 'the IT Department'}</strong> immediately.

        </div>

      </td>
    </tr>

    <tr>
      <td class="footer">

        <strong>${companyName}</strong><br>

        Automated notification generated by the  Manage Service System.<br>

        This is a system-generated email. Please do not reply directly to this message.

      </td>
    </tr>

  </table>

</div>

</body>
</html>
`;
}

/**
 * Send Assignment Email
 */
export async function sendAssignmentEmail({
  toEmail,
  userName,
  model,
  serialNo,
  hrRefNumber,
  handoverDate,
  department,
  performedBy,
  windowsLicense,
  msOfficePackage,
}) {
  if (!toEmail) {
    console.warn('[Email] No recipient email provided.');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Email] SMTP credentials missing.');
    return;
  }

  const transporter = createTransporter();

  const companyName =
    process.env.COMPANY_NAME || 'Earrow Technologies Sdn Bhd';

  const fromName =
    process.env.SMTP_FROM_NAME || 'IT Asset Management';

  const fromEmail = process.env.SMTP_USER;

  const formattedDate = new Date(
    handoverDate || new Date()
  ).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const html = generateEmailHtml({
    userName,
    companyName,
    model,
    serialNo,
    hrRefNumber,
    formattedDate,
    windowsLicense,
    msOfficePackage,
    performedBy,
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `[IT Asset] Laptop Assignment Confirmation`,
      html,
    });

    console.log(
      `[Email] Assignment email sent successfully to ${toEmail}`
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send assignment email:`,
      error
    );
  }
}

/**
 * Send MS Office Activation Email
 */
export async function sendSoftwareActivationEmail({
  toEmail,
  userName,
  model,
  serialNo,
  hrRefNumber,
  handoverDate,
  department,
  performedBy,
  windowsLicense,
  msOfficePackage,
}) {
  if (!toEmail) {
    console.warn('[Email] No recipient email provided.');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Email] SMTP credentials missing.');
    return;
  }

  const transporter = createTransporter();

  const companyName =
    process.env.COMPANY_NAME || 'Earrow Technologies Sdn Bhd';

  const fromName =
    process.env.SMTP_FROM_NAME || 'IT Asset Management';

  const fromEmail = process.env.SMTP_USER;

  const formattedDate = new Date(
    handoverDate || new Date()
  ).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const html = generateEmailHtml({
    title: 'Software License Activated',
    introText:
      'Your Microsoft Office package has been successfully activated and provisioned for your assigned corporate device.',
    userName,
    companyName,
    model,
    serialNo,
    hrRefNumber,
    formattedDate,
    windowsLicense,
    msOfficePackage,
    performedBy,
  });

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `[IT Asset] Microsoft Office Activation`,
      html,
    });

    console.log(
      `[Email] Activation email sent successfully to ${toEmail}`
    );
  } catch (error) {
    console.error(
      `[Email] Failed to send activation email:`,
      error
    );
  }
}