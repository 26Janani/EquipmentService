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
        const targetDates = [10, 20, 30].map(days => {
            const date = new Date(today);
            date.setDate(today.getDate() + days);
            return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
        });

        console.log("Target Dates :"+targetDates);

        // Step 1: Fetch unique customer_ids with service_end_date in 10, 20, 30 days
        const { data: customerData, error: customerError } = await supabase
            .from('maintenance_records')
            .select('customer_id')
            .in('service_end_date', targetDates);

        if (customerError) throw customerError;

        // Extract unique customer IDs
        const customerIds = [...new Set(customerData.map(record => record.customer_id))];

        if (customerIds.length === 0) {
            console.log("No customers found for the given date range.");
            return [];
        }

        // Step 2: Fetch all maintenance records for these customer IDs within 10-30 days
        const { data: maintenanceRecords, error: maintenanceError } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('customer_id', customerIds)
            .gte('service_end_date', targetDates[0]) // Start from the earliest target date (10 days)
            .lte('service_end_date', targetDates[2]); // End at the latest target date (30 days)

        if (maintenanceError) throw maintenanceError;

        return maintenanceRecords;
    } catch (error) {
        console.error("Error fetching records:", error);
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
                <td style="border: 1px solid #ddd; padding: 10px;">${record.days_pending} day${record.days_pending === 1 || record.days_pending === 0 ? '' : 's'}</td>
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
            hod_name: record.bio_medical_hod_name,
            serial_no: record.serial_no,
            service_end_date: record.service_end_date,
            service_status: record.service_status,
            days_pending: record.days_pending
        })));
    }

    if (allRecords.length > 0) {
       // Generate consolidated email content
       const consolidatedEmailContent = `
           <p>Dear Administrator,</p>
           <p>Please find below an overview of all the customers with upcoming maintenance renewals.</p>
           ${formatRecordsAsTable(allRecords, true)}
           <p>Regards,<br/>Alpic Diagnostics</p>
        `;

       console.log("📧 Consolidated Email Content:", consolidatedEmailContent);
       await sendEmail('jananisrinivasan11@gmail.com', `Automated Reminder: Upcoming Maintenance Renewals Summary`, consolidatedEmailContent);
    }else {
        console.log("❌ No records found. Skipping sending email to company.");
    }

    if (Object.keys(groupedByCustomer).length === 0) {
        console.log("❌ No maintenance renewals found for customers. Skipping sending emails to customers.");
    } else {
        for (const [company, records] of Object.entries(groupedByCustomer)) {
            const hodName = records.length > 0 ? records[0].hod_name : "Customer";
            const customerName = records.length > 0 ? records[0].customer_name : "Customer"; // Get customer name from first record
            const emailContent = `
                <p>Dear ${hodName},</p>
                <p>To keep your equipment running smoothly and avoid unexpected breakdowns, we remind you to renew/enter into an Annual Maintenance Contract (AMC) or Comprehensive AMC. Ensure optimal performance and uninterrupted service throughout the year.</p>
                <p> Please find the details below for ${customerName}.</p>
                ${formatRecordsAsTable(records, false)}
                <p>For renewal or more details, please contact us at [Contact Information].</p>
                <p>Regards,<br/>Alpic Diagnostics</p>
            `;


            console.log(`Email sent for customer: ${customerName}`+emailContent);
            await sendEmail('jananisrinivasan11@gmail.com', `Ensure Trouble-Free Performance – Renew Your AMC Today!`, emailContent);
        }
    }    
}

async function fetchMaintenanceRecordsWithDetails() {
    try {
        const records = await fetchMaintenanceRecords();

        // Fetch all customer names
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, name, bio_medical_hod_name');

        if (customersError) throw customersError;

        // Fetch all equipment names
        const { data: equipments, error: equipmentsError } = await supabase
            .from('equipments')
            .select('id, name');

        if (equipmentsError) throw equipmentsError;

        // Convert customers & equipments into lookup objects for faster mapping
        const customerMap = Object.fromEntries(customers.map(c => [c.id, { name: c.name, hod_name: c.bio_medical_hod_name }]));
        const equipmentMap = Object.fromEntries(equipments.map(e => [e.id, e.name]));

        // Replace customer_id & equipment_id with names
        const updatedRecords = records.map(record => ({
            customer_name: customerMap[record.customer_id]?.name || "Unknown Customer",
            equipment_name: equipmentMap[record.equipment_id] || "Unknown Equipment",
            hod_name: customerMap[record.customer_id]?.hod_name,
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

