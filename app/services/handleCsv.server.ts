import * as csv from "csv";
import { DateTime } from "luxon";
import { z } from "zod";

import { prisma } from "./prisma.server";
import { Record } from "@prisma/client/runtime/library";

type Transaction = Record<string, string | number>;

export async function readAmazonCreditCard(data: string) {
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => (line.match(/,/g) || []).length > 3)
    .join("\n");

  const records = (await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  })) as string[][];

  const headers = records[0];

  const transactions = records
    .slice(1)
    .map((record) => {
      const transaction: Transaction = {};
      record.forEach((value, index) => {
        const val = headers[index].startsWith("Amount") ? Number(value) : value;

        transaction[headers[index]] = val;
      });
      return transaction;
    })
    .filter((transaction) => {
      if (typeof transaction["Transaction Details"] === "number") return true;
      return !transaction["Transaction Details"].includes("INFINITY PAYMENT");
    });

  const inserts = transactions.map((t) => {
    const formattedDate = DateTime.fromFormat(t.Date as string, "dd/MM/yyyy");

    return {
      date: formattedDate.toJSDate(),
      amount: t["Amount(in Rs)"] as number,
      details: t["Transaction Details"] as string,
      sourceId: 1,
    };
  });

  await prisma.transaction.createMany({
    data: inserts,
    skipDuplicates: true,
  });
}

export async function readSbiStatement(data: string) {
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => line.split(",").filter((x) => x.length > 0).length > 5)
    .join("\n");

  const records = (await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  })) as string[][];

  const headers = records[0];

  let transactions = records.slice(1).map((record) => {
    const transaction: Transaction = {};
    record.forEach((value, index) => {
      transaction[headers[index]] = value;
    });
    return transaction;
  });

  transactions = transactions.map((t) => {
    const formattedDate = DateTime.fromFormat(t["Txn Date"], "d LLL yyyy");

    return {
      date: formattedDate.toISO(),
      amount:
        t["        Debit"] === " "
          ? 0
          : Number(t["        Debit"].replace(",", "")),
      details: t["Description"],
      sourceId: 2,
    };
  });

  await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  });
}

// readSbiStatement();
//
export async function readCoralCreditCard(data: string) {
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => (line.match(/,/g) || []).length > 3)
    .join("\n");

  const records = (await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  })) as string[][];

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
    const formattedDate = DateTime.fromFormat(t["Date"], "dd/MM/yyyy");

    return {
      date: formattedDate.toISO(),
      amount: t["Amount(in Rs)"],
      details: t["Transaction Details"],
      sourceId: 3,
    };
  });

  await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  });
}

// readCoralCreditCard();

export async function readIciciStatement(data: string) {
  data = data.replaceAll("\r", "");
  data = data
    .split("\n")
    .filter((line) => line.split(",").filter((x) => x.length > 0).length > 5)
    .join("\n");

  const records = (await new Promise((resolve) => {
    csv.parse(data, {}, (err, output) => {
      resolve(output);
    });
  })) as string[][];

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
    const formattedDate = DateTime.fromFormat(
      t["Transaction Date"],
      "dd/MM/yyyy"
    );

    return {
      date: formattedDate.toISO(),
      amount: Number(t["Withdrawal Amount (INR )"]),
      details: t["Transaction Remarks"],
      sourceId: 4,
    };
  });

  await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true, // Skip 'Bobo'
  });
}

export const statementMap = {
  amazon_cc: readAmazonCreditCard,
  sbi: readSbiStatement,
  coral_cc: readCoralCreditCard,
  icici_643: readIciciStatement,
};

const validataSchema = z.object({
  source: z.union([
    z.literal("amazon_cc"),
    z.literal("sbi"),
    z.literal("coral_cc"),
    z.literal("icici_643"),
  ]),
  data: z.string(),
});

export async function insertTransactions(source: string, data: string) {
  const { source: _source } = validataSchema.parse({
    source: source,
    data: data,
  });
  await statementMap[_source](data);
}