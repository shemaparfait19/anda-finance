// Test file to verify data operations work correctly
// This file can be deleted after testing

import {
  getMembers,
  getPayments,
  getReports,
  getAccounting,
  addPayment,
  addReport,
} from "./data-service";

export async function testDataOperations() {
  console.log("🧪 Testing data operations...");

  try {
    // Test reading operations
    console.log("📖 Testing read operations...");
    const members = await getMembers();
    console.log(`✅ Members: ${members.length} records`);

    const payments = await getPayments();
    console.log(`✅ Payments: ${payments.length} records`);

    const reports = await getReports();
    console.log(`✅ Reports: ${reports.length} records`);

    const accounting = await getAccounting();
    console.log(
      `✅ Accounting: ${accounting.accounts.length} accounts, ${accounting.journalEntries.length} journal entries`
    );

    // Test write operations (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("✏️  Testing write operations...");

      // Test adding a payment
      const testPayment = await addPayment({
        memberId: "1",
        memberName: "Test Member",
        type: "savings_deposit",
        amount: 1000,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
        reference: "TEST-001",
        status: "completed",
        description: "Test payment",
      });
      console.log(`✅ Added test payment: ${testPayment.id}`);

      // Test adding a report
      const testReport = await addReport({
        title: "Test Report",
        type: "financial",
        period: "2024-01",
        generatedDate: new Date().toISOString().split("T")[0],
        data: { test: true },
        status: "draft",
      });
      console.log(`✅ Added test report: ${testReport.id}`);
    }

    console.log("🎉 All data operations working correctly!");
    return true;
  } catch (error) {
    console.error("❌ Data operations test failed:", error);
    return false;
  }
}
