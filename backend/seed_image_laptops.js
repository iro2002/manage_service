import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manage_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const data = [
    ["HP Elitebook 840 G6 i5 8th 16GB 256GB NVMe Touch", "ERO/RNT/FA/LAP/0038", "5CG01327CP/ CHR 925", "02.09.2024"],
    ["HP Elitebook 840 G3 i5 6th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0035", "5CG6427DHC/ CHR 916", "02.08.2024"],
    ["HP Elitebook 840 G6 i5 8th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0044", "5CG0273JJV/ CHR 921", "02.09.2024"],
    ["HP Elitebook 830 G6 i5 8th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0054", "5CG9396M0N/ CHR 935", "01.11.2024"],
    ["Dell Latitude 7490 i5 8th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0046", "1BD4433/ CHR 927", "19.09.2024"],
    ["Dell Latitude 5400 i5 8th 16GB NVMe Laptop", "ERO/RNT/FA/LAP/0063", "CKSVZQ2/ CHR 946", "01.09.2025"],
    ["Dell Latitude 7490 i7 8th Gen 16GB 256GB NVME", "ERO/RNT/FA/LAP/0059", "4KYXLH2/CHR 941", "09.06.2025"],
    ["HP Elitebook 840 G7 i5 10th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0067", "5CG102726Z/ CHR 949", "23.10.2025"],
    ["Lenovo ThinkPad T580 i5 8th 16GB 256G NVMe", "ERO/RNT/FA/LAP/0049", "R90W62R2/ CHR 930", "15.12.2026"],
    ["Lenovo Thinkpad E14 Gen 2 i5 11th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0069", "PF2L2N2P/ CHR 951", "13.02.2026"],
    ["Lenovo Thinkpad E14 Gen 2 i5 11th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0070", "PF2MWVAI/ CHR 952", "13.02.2026"],
    ["Dell Latitude 7490 i7 8th Gen 16GB 256GB NVME", "ERO/RNT/FA/LAP/0058", "GKHC2Z2/CHR 940", "09.06.2025"],
    ["HP Elitebook 840 G6 i5 8th 16GB 256GB NVMe Touch", "ERO/RNT/FA/LAP/0040", "5CG916552F/ CHR 923", "02.09.2024"],
    ["Dell Latitude 5470 i5 6th 8GB 256GB NVMe", "ERO/RNT/FA/LAP/0060", "HC77S72/CHR 942", "28.06.2025"],
    ["Dell Latitude 5470 i5 6th 8GB 256GB NVMe", "ERO/RNT/FA/LAP/0062", "3GDD092/ CHR945", "07.08.2025"],
    ["Dell Latitude 7490 i7 8th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0077", "93SQSN2/ CHR 943", "07.07.2025"],
    ["HP Elitebook 840 G3 i5 6th 16GB 256GB M.2 Laptop", "ERO/RNT/FA/LAP/0072", "5CG6160N6T/ CHR 953", ""],
    ["HP Probook 440 G4 i5 7th 8GB 128GB SSD Laptop", "ERO/RNT/FA/LAP/0071", "5CD7380PJ6 / CHR 954", "20.01.2026"],
    ["HP Probook 440 G4 i5 7th 8GB 128GB SSD Laptop", "ERO/RNT/FA/LAP/0074", "5CD7380PGX/ CHR 956", "24.01.2026"],
    ["Dell Latitude 5400 i7 8th 16GB 256GB NVMe", "ERO/RNT/FA/LAP/0055", "JSQRQ23/ CHR 938", ""],
    ["Lenovo Thinkpad E14 Gen 2 i5 11th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0068", "PF2P80PD/ CHR 950", "13.02.2026"],
    ["Dell Latitude 5490 i5, 8GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0077", "F1W3JZ2 / NRS 855", "21.05.2026"],
    ["Dell Latitude 5490 i5, 8GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0078", "BC62533 / NRS 856", "21.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0081", "FCDN2R2 / NRS 854", "21.05.2026"],
    ["HP Probook 440 G4 i5 8GB 128GB SSD Laptop", "ERO/RNT/FA/LAP/0075", "5CD7380PJH/ CHR 957", "21.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0082", "HYC4H53 / NRS 851", "21.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0083", "1PZ0Q13 / NRS 853", "21.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0084", "4PH9433 /NRS 852", "21.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0085", "H3ZB433 /NRS 849", "21.05.2026"],
    ["Lenovo Thinkpad E14 Gen 2 i5 11th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0086", "PF2MYW4D / CHR 951", "28.05.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0087", "BVY73Z2 / NRS 848", "01.06.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0089", "6G1M433 /NRS 862", "01.06.2026"],
    ["Dell Latitude 5400 i7, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0091", "6BRB2R2 / NRS 118", "01.06.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0092", "CY563Z2 / NRS 861", "01.06.2027"],
    ["HP EliteBook 840 G7 i5 10th 16GB 256GB NVMe Laptop", "ERO/RNT/FA/LAP/0076", "5CG943C4B9/ CHR 958", "29.04.2026"],
    ["Dell Latitude 5490 i5, 16GB RAM, 256GB SSD", "ERO/RNT/FA/LAP/0088", "8ZRM533 / NRS 864", "01.06.2026"],
];

function formatDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.trim().split('.');
  if (parts.length === 3) {
    // DD.MM.YYYY to YYYY-MM-DD
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    if (day.length === 1) day = '0' + day;
    if (month.length === 1) month = '0' + month;
    return `${year}-${month}-${day}`;
  }
  return null;
}

async function insertData() {
  try {
    for (const row of data) {
      const model = row[0];
      const hrRef = row[1];
      const serialNo = row[2];
      const dateStr = row[3];
      const dateOfDelivery = formatDate(dateStr);
      
      await pool.query(
        `INSERT INTO laptops 
          (model, hrRefNumber, serialNo, dateOfDelivery, status, vendorName, ratePerMonth, windowsLicense, msOfficePackage, adminAccountEnabled, massStorageDisabled) 
         VALUES (?, ?, ?, ?, 'Available', NULL, NULL, 0, 0, 1, 1)`,
        [model, hrRef, serialNo, dateOfDelivery]
      );
      console.log(`Inserted: ${model} - ${serialNo}`);
    }
    console.log('All data inserted successfully.');
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    pool.end();
  }
}

insertData();
