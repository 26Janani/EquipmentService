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
        const today = new Date();
        
        // Calculate target dates
        const targetDates = [12, 22, 32].map(days => {
            const date = new Date(today);
            date.setDate(today.getDate() + days);
            return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        });

        console.log("Fetching records for dates:", targetDates); // Debugging

        // Query records matching any of the target dates
        const { data, error } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('service_end_date', targetDates); // Filtering for 10, 20, 30 days ahead

        if (error) throw error;

        console.log("✅ Fetched Maintenance Records:", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching records:", error);
        return [];
    }
}

function formatRecordsAsTable(records, isForCompany) {
    if (records.length === 0) return '<p>No upcoming renewals.</p>';

    let table = `
        <table 
            style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; border: 1px solid #ddd;">
            <tr style="background-color: #0f79ad; color: white;">
                ${isForCompany ? '<th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Customer</th>' : ''}
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Equipment</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Serial Number</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Service Status</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Service End Date</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Days Left</th>
            </tr>
    `;
    
    records.forEach(record => {
        table += `
            <tr style="background-color: #f9f9f9;">
                ${isForCompany ? `<td style="border: 1px solid #ddd; padding: 10px;">${record.customer_name}</td>` : ''}
                <td style="border: 1px solid #ddd; padding: 10px;">${record.equipment_name}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${record.serial_no}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${record.service_status}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${record.service_end_date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${record.days_pending} days</td>
            </tr>`;
    });

    table += `</table>`;
    return table;
}

async function sendEmail(to, subject, htmlContent) {
    try {
        let info = await transporter.sendMail({
            from: '"Alpic Diagnostics " <your-email@gmail.com>',
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
    const records = await fetchMaintenanceRecordsWithDetails();
    const groupedByCustomer = records.reduce((acc, record) => {
        acc[record.customer_name] = acc[record.customer_name] || [];
        acc[record.customer_name].push(record);
        return acc;
    }, {});

    console.log("✅ Grouped by Customer Maintenance Records:", groupedByCustomer);

    let allRecords = []; // Store all records for the consolidated email for company

    for (const [company, companyRecords] of Object.entries(groupedByCustomer)) {
        // Add company records to allRecords
        allRecords.push(...companyRecords.map(record => ({
            company: company,
            customer_name: record.customer_name,
            equipment_name: record.equipment_name,
            serial_no: record.serial_no,
            service_end_date: record.service_end_date,
            service_status: record.service_status,
            days_pending: record.days_pending
        })));
    }

    // Generate consolidated email content
    const consolidatedEmailContent = `
        <p>Dear Administrator,</p>
        <p>Please find below an overview of all customers with upcoming maintenance renewals.</p>
        ${formatRecordsAsTable(allRecords, true)}
        <p>Regards,<br/>Janani</p>
    `;

    console.log("📧 Consolidated Email Content:", consolidatedEmailContent);
    await sendEmail('jananisrinivasan11@gmail.com', `Automated Reminder: Upcoming Maintenance Renewals Summary`, consolidatedEmailContent);
    
    


    for (const [company, records] of Object.entries(groupedByCustomer)) {
        const emailContent = `
            <p>Dear Customer,</p>
            <p>Please find below the list of maintenance contracts due for renewal.</p>
            ${formatRecordsAsTable(records, false)}
            <p>To ensure uninterrupted service and optimal performance, please schedule your renewal at the earliest convenience.</p>
            <p>If you have any questions or need assistance, feel free to contact us.</p>
            <p>Regards,<br/>Alpic Diagnostics</p>
        `;
        
        console.log('Email content for customer'+emailContent);
        await sendEmail('jananisrinivasan11@gmail.com', `[URGENT] Upcoming Maintenance Renewal for Your Equipment`, emailContent);
    }

    
}

async function fetchMaintenanceRecordsWithDetails() {
    try {
        const records = await fetchMaintenanceRecords();

        // Fetch all customer names
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, name');

        if (customersError) throw customersError;

        // Fetch all equipment names
        const { data: equipments, error: equipmentsError } = await supabase
            .from('equipments')
            .select('id, name');

        if (equipmentsError) throw equipmentsError;

        // Convert customers & equipments into lookup objects for faster mapping
        const customerMap = Object.fromEntries(customers.map(c => [c.id, c.name]));
        const equipmentMap = Object.fromEntries(equipments.map(e => [e.id, e.name]));

        // Replace customer_id & equipment_id with names
        const updatedRecords = records.map(record => ({
            customer_name: customerMap[record.customer_id] || "Unknown Customer",
            equipment_name: equipmentMap[record.equipment_id] || "Unknown Equipment",
            days_pending: calculateDaysLeft(record.service_end_date),
            service_end_date: formatDate(record.service_end_date),
            serial_no: record.serial_no,
            service_status: record.service_status
        }));

        console.log("✅ Updated Maintenance Records:", updatedRecords);
        return updatedRecords;
    } catch (error) {
        console.error("❌ Error fetching detailed maintenance records:", error);
        return {};
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // Returns DD/MM/YYYY format
}

function calculateDaysLeft(serviceEndDate) {
    const today = new Date();
    const endDate = new Date(serviceEndDate);

    // Reset hours, minutes, seconds, and milliseconds to 0 to ignore timestamps
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const timeDiff = endDate - today;
    return Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 0); // Ensure no negative values
}

// Execute email sending
processAndSendEmails()
    .then(() => console.log("✅ Emails processed and sent"))
    .catch(err => console.error("❌ Error in email processing:", err));

