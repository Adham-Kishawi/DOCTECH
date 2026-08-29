import http from "node:http";

const routes = [
  // Auth
  "/role-selection",
  "/sign-in",
  "/sign-up",
  "/clinic-setup",
  "/forgot-password",
  "/reset-password",
  "/secretary-activation",

  // Doctor
  "/doctor/dashboard",
  "/doctor/appointments",
  "/doctor/schedule",
  "/doctor/reports/1",
  "/doctor/profile",
  "/doctor/team",
  "/doctor/team/invite",
  "/doctor/communications",
  "/doctor/notifications",

  // Secretary
  "/secretary/dashboard",
  "/secretary/appointments",
  "/secretary/appointments/new",
  "/secretary/appointments/1",
  "/secretary/schedule",
  "/secretary/patients",
  "/secretary/patients/1",
  "/secretary/reports",
  "/secretary/reports/1",
  "/secretary/whatsapp",
  "/secretary/whatsapp/1",
  "/secretary/communications",
  "/secretary/notifications",
];

const locales = ["en", "ar"];

async function fetchUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on("error", (err) => {
      resolve({ error: err.message });
    });
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("  DOCTECH FULL ROUTE & UI AUDIT TESTER   ");
  console.log("==========================================\n");

  let total = 0;
  let passed = 0;
  let failed = 0;
  const issues = [];

  for (const locale of locales) {
    for (const route of routes) {
      total++;
      const path = `/${locale}${route}`;
      const url = `http://localhost:3000${path}`;

      const res = await fetchUrl(url);

      if (res.error) {
        failed++;
        console.log(`❌ FAIL: ${path} - Connection error: ${res.error}`);
        issues.push({ path, issue: res.error });
        continue;
      }

      if (res.statusCode !== 200) {
        failed++;
        console.log(`❌ FAIL: ${path} - HTTP ${res.statusCode}`);
        issues.push({ path, issue: `HTTP status ${res.statusCode}` });
        continue;
      }

      // Check for error text inside the HTML
      const body = res.body || "";
      const hasErrorText =
        body.includes("Internal Server Error") ||
        body.includes("Application error") ||
        body.includes("Unhandled Runtime Error") ||
        body.includes("TypeError:") ||
        body.includes("ReferenceError:");

      if (hasErrorText) {
        failed++;
        console.log(`❌ FAIL: ${path} - Render/Runtime error found in response HTML`);
        issues.push({ path, issue: "Runtime error found in body" });
        continue;
      }

      // Check RTL for Arabic
      if (locale === "ar" && !body.includes('dir="rtl"')) {
        failed++;
        console.log(`⚠️ WARN: ${path} - Arabic page missing dir="rtl"`);
        issues.push({ path, issue: 'Missing dir="rtl" on Arabic page' });
        continue;
      }

      passed++;
      console.log(`✅ PASS (${res.statusCode}): ${path}`);
    }
  }

  console.log("\n==========================================");
  console.log(`RESULTS: Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log("==========================================");

  if (issues.length > 0) {
    console.log("\nFound Issues:");
    issues.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.path}] -> ${item.issue}`);
    });
  }
}

runTests();
