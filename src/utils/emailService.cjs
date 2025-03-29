const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
// const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = 'https://qfqqeobtlycwwppaynur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcXFlb2J0bHljd3dwcGF5bnVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjEwNTAzOSwiZXhwIjoyMDU3NjgxMDM5fQ.dcXcydSSHS3tUM7cNIWjvR0n2b2CLNg9v4ZeSv0zgWo';

console.log("url",SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // user: process.env.EMAIL_USER,
        // pass: process.env.EMAIL_PASS  // Use App Password for security
        user: 'subaarjun10@gmail.com',
        pass: 'htnk vany apef tkyx'
    }
});

async function fetchMaintenanceRecords() {
    try {
        const { data, error } = await supabase
            .from('customers') // Replace with your table name
            .select('*')
            //.gte('service_end_date', new Date().toISOString().split('T')[0]); // Filter based on date

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching records:", error);
        return [];
    }
}

function formatRecordsAsTable(records) {
    if (records.length === 0) return '<p>No upcoming renewals.</p>';

    let table = `
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                <th>Company</th>
                <th>Equipment</th>
                <th>Service End Date</th>
            </tr>`;
    
    records.forEach(record => {
        table += `
            <tr>
                <td>${record.name}</td>
                <td>${record.bio_medical_hod_name}</td>
                <td>${record.notes}</td>
            </tr>`;
    });

    table += `</table>`;
    return table;
}

async function sendEmail(to, subject, htmlContent) {
    try {
        let info = await transporter.sendMail({
            from: '"Janani" <your-email@gmail.com>',
            to,
            subject,
            html: htmlContent // Send HTML content
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}

async function processAndSendEmails() {
    const records = await fetchMaintenanceRecords();
    const groupedByCompany = records.reduce((acc, record) => {
        acc[record.company_name] = acc[record.company_name] || [];
        acc[record.company_name].push(record);
        return acc;
    }, {});

    for (const [company, records] of Object.entries(groupedByCompany)) {
        const emailContent = `
            <p>Dear ${company},</p>
            <p>Please find below the list of maintenance contracts due for renewal:</p>
            ${formatRecordsAsTable(records)}
            <p>Kind Regards,<br/>Janani</p>
        `;
        
        await sendEmail('jananisrinivasan11@gmail.com', `Reminder: Renewals for ${company}`, emailContent);
    }
}

// Execute email sending
processAndSendEmails()
    .then(() => console.log("✅ Emails processed and sent"))
    .catch(err => console.error("❌ Error in email processing:", err));

