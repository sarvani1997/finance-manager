import fs from "fs/promises";

async function hello() {
  const data = await fs.readFile("./public/sbi.csv", "utf-8");
  console.log(data);
}

