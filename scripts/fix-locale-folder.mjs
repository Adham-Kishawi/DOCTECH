import fs from "node:fs";
import path from "node:path";

const appDir = "D:\\FULL-PROJECTS\\DOCTECH\\app";
const items = fs.readdirSync(appDir);
console.log("Current items in app/ :", items);

// Find any directory with brackets/backticks
for (const item of items) {
  if (item.includes("locale")) {
    const fullPath = path.join(appDir, item);
    const targetPath = path.join(appDir, "[locale]");
    console.log(`Found: "${item}", fullPath: "${fullPath}"`);
    if (item !== "[locale]") {
      console.log(`Renaming "${fullPath}" to "${targetPath}"`);
      fs.renameSync(fullPath, targetPath);
    }
  }
}

console.log("Updated items in app/ :", fs.readdirSync(appDir));
