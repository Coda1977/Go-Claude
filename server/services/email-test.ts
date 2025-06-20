import { emailService } from "./email";

// Test email functionality for hadaswexler@gmail.com
async function testEmailDelivery() {
  console.log("Testing email delivery...");
  
  try {
    await emailService.sendTestEmail("hadaswexler@gmail.com");
    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Test email failed:", error);
  }
}

testEmailDelivery();