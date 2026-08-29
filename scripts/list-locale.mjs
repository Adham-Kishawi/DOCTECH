import fs from "node:fs";
import path from "node:path";

function listTree(dir, prefix = "") {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`${prefix}📁 ${f}/`);
      listTree(full, prefix + "  ");
    } else {
      console.log(`${prefix}📄 ${f}`);
    }
  }
}

listTree("D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]");
