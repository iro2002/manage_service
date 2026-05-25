import nodemailer from 'nodemailer';

/**
 * Create transporter — configure via .env
 * Strips spaces from Gmail App Passwords since SMTP auth doesn't use them.
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
 * Send laptop assignment email with usage policy to the employee.
 * * @param {Object} opts
 * @param {string} opts.toEmail      - Employee's email address
 * @param {string} opts.userName     - Employee's full name
 * @param {string} opts.model        - Laptop model
 * @param {string} opts.serialNo     - Laptop serial number
 * @param {string} opts.hrRefNumber  - HR reference number
 * @param {string} opts.handoverDate - Date of handover
 * @param {string} opts.department   - Department
 * @param {string} opts.performedBy  - Admin who assigned
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
}) {
  if (!toEmail) {
    console.warn('[Email] Warning: No recipient email provided. Skipping email dispatch.');
    return;
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Email] Error: SMTP credentials missing in .env. Skipping email dispatch.');
    return;
  }

  console.log(`[Email] Initiating laptop assignment notification to ${toEmail}...`);

  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'IT Asset Management';
  const fromEmail = process.env.SMTP_USER;
  const companyName = process.env.COMPANY_NAME || 'Earrow Technologies Sdn Bhd';

  const formattedDate = handoverDate
    ? new Date(handoverDate).toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  // Professionally styled HTML Email Template with SVG Icon
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IT Asset Assignment Notification</title>
  <style>
    /* Reset & Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #333333; line-height: 1.6; }
    
    /* Container */
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e1e4e8; }
    
    /* Header */
    .header { background-color: #0f172a; padding: 30px 40px; border-bottom: 4px solid #3b82f6; text-align: left; }
    .header-top { display: flex; align-items: center; margin-bottom: 8px; }
    .company-name { font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-left: 10px; }
    .header h1 { font-size: 20px; font-weight: 600; color: #ffffff; margin: 0; }
    
    /* Content Body */
    .content { padding: 40px; }
    .greeting { font-size: 15px; color: #334155; margin-bottom: 25px; }
    .greeting strong { color: #0f172a; }
    
    /* Section Titles */
    .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; margin-top: 30px; }
    
    /* Asset Table */
    .asset-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8fafc; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
    .asset-table th, .asset-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .asset-table th { width: 40%; font-weight: 600; color: #475569; background-color: #f1f5f9; }
    .asset-table td { color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .asset-table tr:last-child th, .asset-table tr:last-child td { border-bottom: none; }
    
    /* Policy List */
    .policy-container { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 6px 6px 0; margin-bottom: 25px; }
    .policy-container p { font-size: 13px; font-weight: 600; color: #b45309; margin-bottom: 12px; }
    .policy-list { list-style-type: none; padding-left: 0; }
    .policy-list li { font-size: 13px; color: #4a5568; margin-bottom: 10px; padding-left: 20px; position: relative; }
    .policy-list li::before { content: "•"; color: #f59e0b; font-weight: bold; position: absolute; left: 0; font-size: 18px; line-height: 1; top: -1px; }
    .policy-list strong { color: #1a202c; }
    
    /* Acknowledgement */
    .acknowledgement { font-size: 13px; color: #475569; background-color: #f1f5f9; padding: 16px 20px; border-radius: 6px; border: 1px solid #e2e8f0; }
    
    /* Footer */
    .footer { background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="2" y1="20" x2="22" y2="20"></line>
        </svg>
        <span class="company-name">${companyName}</span>
      </div>
      <h1>IT Asset Assignment Notification</h1>
    </div>

    <div class="content">
      <div class="greeting">
        <p>Dear <strong>${userName}</strong>,</p>
        <br />
        <p>This is an official notification to confirm that a company laptop has been assigned to you as of <strong>${formattedDate}</strong>. Please review your asset details and the standard acceptable use policy below.</p>
      </div>

      <div class="section-title">Asset Record</div>
      <table class="asset-table">
        <tr>
          <th>Device Model</th>
          <td style="font-family: inherit;">${model || 'N/A'}</td>
        </tr>
        <tr>
          <th>Serial Number</th>
          <td>${serialNo || 'N/A'}</td>
        </tr>
        <tr>
          <th>HR Reference</th>
          <td>${hrRefNumber || 'N/A'}</td>
        </tr>
        <tr>
          <th>Department</th>
          <td style="font-family: inherit;">${department || 'N/A'}</td>
        </tr>
        <tr>
          <th>Handover Date</th>
          <td style="font-family: inherit;">${formattedDate}</td>
        </tr>
        <tr>
          <th>Assigned By</th>
          <td style="font-family: inherit;">${performedBy || 'System Administrator'}</td>
        </tr>
      </table>

      <div class="section-title">Acceptable Use Policy</div>
      <div class="policy-container">
        <p>Standard Conditions of Use:</p>
        <ul class="policy-list">
          <li><strong>Intended Use:</strong> This device remains the exclusive property of ${companyName} and is provided strictly for authorized business purposes.</li>
          <li><strong>Software & Security:</strong> Only IT-approved applications may be installed. Unauthorized software, personal applications, and games are strictly prohibited.</li>
          <li><strong>Access Control:</strong> Do not share your login credentials. The device must only be operated by the assigned employee.</li>
          <li><strong>Asset Protection:</strong> Ensure the device is safeguarded against loss, theft, or damage at all times. Use approved cloud storage; do not store critical data locally.</li>
          <li><strong>Asset Return:</strong> The device and its accessories must be returned in good working condition upon separation from the company, role change, or at management's request.</li>
          <li><strong>Monitoring & Compliance:</strong> In accordance with corporate IT policies, activity on this device may be monitored to ensure security and compliance.</li>
        </ul>
      </div>

      <div class="acknowledgement">
        <p>By proceeding to log in and utilize this device, you acknowledge receipt of the asset in good condition and agree to comply with the corporate IT policies outlined above.</p>
        <br />
        <p>If you discover any discrepancies in this record, please contact the IT Department or <strong>${performedBy || 'your system administrator'}</strong> immediately.</p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated message generated by the ${companyName} IT Asset Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  // Send the email with Try/Catch for better error handling
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `[IT Asset] Laptop Assigned — ${model || 'New Device'}`,
      html,
    });
    console.log(`[Email] [SUCCESS] Assignment email sent successfully to ${toEmail}.`);
  } catch (error) {
    console.error(`[Email] [FAILED] Failed to send assignment email to ${toEmail}:`, error);
  }
}