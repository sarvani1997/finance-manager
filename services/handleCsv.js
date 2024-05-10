import fs from "fs/promises";
import * as csv from "csv";
import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon';

const prisma = new PrismaClient()

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

  let transactions = records
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

  transactions = transactions.map((t) => {
    let formattedDate = DateTime.fromFormat(t.Date,'dd/MM/yyyy')

    return {
      date: formattedDate.toISO(),
      amount: t["Amount(in Rs)"],
      details: t["Transaction Details"],
      sourceId: 1,

    }
  })

  await prisma.Transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  })
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

  let transactions = records.slice(1).map((record) => {
    const transaction = {};
    record.forEach((value, index) => {
      transaction[headers[index]] = value;
    });
    return transaction;
  });


  transactions = transactions.map((t) => {
    let formattedDate = DateTime.fromFormat(t["Txn Date"],'d LLL yyyy')

    return {
      date: formattedDate.toISO(),
      amount: t['        Debit'] === " " ? 0 : Number( t['        Debit'].replace(",","")),
      details: t["Description"],
      sourceId: 2,

    }
  })

  await prisma.Transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  })
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

  let transactions = records
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

  
  
  transactions = transactions.map((t) => {
    let formattedDate = DateTime.fromFormat(t["Date"],'dd/MM/yyyy')
    
    return {
      date: formattedDate.toISO(),
      amount: t["Amount(in Rs)"],
      details: t["Transaction Details"],
      sourceId: 3,
      
    }
  })

  await prisma.Transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  })
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

  let transactions = records.slice(1).map((record) => {
    const transaction = {};
    record.forEach((value, index) => {
      if (headers[index].trim() === "") {
        return;
      }


      transaction[headers[index]] = value;
    });
    return transaction;
  });

  transactions = transactions.map((t) => {
    let formattedDate = DateTime.fromFormat(t["Transaction Date"],'dd/MM/yyyy')
    
    return {
      date: formattedDate.toISO(),
      amount: Number(t["Withdrawal Amount (INR )"]),
      details: t["Transaction Remarks"],
      sourceId: 4,
      
    }
  })

  await prisma.Transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  })
}

readIciciStatement();
