import fs from "fs/promises";
import * as csv from "csv";

async function readAmazonCreditCard() {
  let data = await fs.readFile("./public/amazon.csv", "utf-8");
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => (line.match(/,/g) || []).length > 3)
    .join("\n");

  const records = await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  });

  const headers = records[0];

  const transactions = records
    .slice(1)
    .map((record) => {
      const transaction = {};
      record.forEach((value, index) => {
        value = headers[index].startsWith("Amount") ? Number(value) : value;

        transaction[headers[index]] = value;
      });
      return transaction;
    })
    .filter(
      (transaction) =>
        !transaction["Transaction Details"].includes("INFINITY PAYMENT")
    );

  console.log(transactions);
}

// readAmazonCreditCard();
//
async function readSbiStatement() {
  let data = await fs.readFile("./public/sbi_test.csv", "utf-8");
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => line.split(",").filter((x) => x.length > 0).length > 5)
    .join("\n");

  const records = await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  });

  const headers = records[0];

  const transactions = records.slice(1).map((record) => {
    const transaction = {};
    record.forEach((value, index) => {
      transaction[headers[index]] = value;
    });
    return transaction;
  });

  console.log(transactions);
}

// readSbiStatement();
//
async function readCoralCreditCard() {
  let data = await fs.readFile("./public/coralCard.csv", "utf-8");
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => (line.match(/,/g) || []).length > 3)
    .join("\n");

  const records = await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  });

  const headers = records[0];

  const transactions = records
    .slice(1)
    .map((record) => {
      const transaction = {};
      record.forEach((value, index) => {
        value = headers[index].startsWith("Amount") ? Number(value) : value;

        transaction[headers[index]] = value;
      });
      return transaction;
    })
    .filter(
      (transaction) =>
        !transaction["Transaction Details"].includes("INFINITY PAYMENT")
    );

  console.log(transactions);
}

// readCoralCreditCard();

async function readIciciStatement() {
  let data = await fs.readFile("./public/icici_bank.csv", "utf-8");
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => line.split(",").filter((x) => x.length > 0).length > 5)
    .join("\n");

  const records = await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  });

  const headers = records[0];

  const transactions = records.slice(1).map((record) => {
    const transaction = {};
    record.forEach((value, index) => {
      if (headers[index].trim() === "") {
        return;
      }

      value = headers[index].startsWith("Amount") ? Number(value) : value;

      transaction[headers[index]] = value;
    });
    return transaction;
  });

  console.log(transactions);
}

readIciciStatement();
