import * as csv from "csv";
import { DateTime } from "luxon";
import { z } from "zod";

import { prisma } from "./prisma";
import { Record } from "@prisma/client/runtime/library";

type Transaction = Record<string, string | number>;

export async function readAmazonCreditCard(data: string) {
  try {
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
          const val = headers[index].startsWith("Amount")
            ? Number(value)
            : value;

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

    let count = 0


    for (let transaction of inserts) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        count = count + 1;
      } catch (err) {
        console.log({err})
      }
    }

   
console.log({count})
    return {count};
  } catch (err) {
    console.log({err})
    return "error" as const;
  }
}

export async function readHdfcStatement(data: string) {
  try {
    data = data.replaceAll("\r", "");
    data = data
    .split("\n")
    .filter((line) =>  {
      let len = line.split(",").filter((x) => x.length > 0).length
      return len === 6 || len === 7
    }).slice(0,-1)

    data = Object.values(data).filter((x) => !x.includes("*")).join("\n");
    
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

    let inserts = transactions.map((t:any) => {
      const formattedDate = DateTime.fromFormat(t["Date"], "dd/MM/yy");

      const amount =
        t["Withdrawal Amt."] === " "
          ? -Number(t["Deposit Amt."].trim().replaceAll(",", ""))
          : Number(t["Withdrawal Amt."].trim().replaceAll(",", ""));
      return {
        date: formattedDate.toISO(),
        amount: amount,
        details: t["Narration"],
        sourceId: 5,
      };
    });

    let count = 0
    console.log({inserts})

    for (let transaction of inserts) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        count = count + 1;
      } catch (err) {
        console.log({err})
      }
    }
    console.log({count})
    return {count};
  } catch (err) {
    return "error" as const;
  }
}


export async function readSbiStatement(data: string) {
  try {
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
    let inserts = transactions.map((t:any) => {
      const formattedDate = DateTime.fromFormat(t["Txn Date"], "d LLL yyyy");

      const amount =
        t["        Debit"] === " "
          ? -Number(t["Credit"].trim().replaceAll(",", ""))
          : Number(t["        Debit"].trim().replaceAll(",", ""));
      return {
        date: formattedDate.toISO(),
        amount: amount,
        details: t["Description"],
        sourceId: 2,
      };
    });

    let count = 0

    for (let transaction of inserts) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        count = count + 1;
      } catch (err) {
        console.log({err})
      }
    }
    return {count};
  } catch (err) {
    return "error" as const;
  }
}

// readSbiStatement();
//
export async function readCoralCreditCard(data: string) {
  try {
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

    transactions = transactions.map((t:any) => {
      const formattedDate = DateTime.fromFormat(t["Date"], "dd/MM/yyyy");

      return {
        date: formattedDate.toISO(),
        amount: t["Amount(in Rs)"],
        details: t["Transaction Details"],
        sourceId: 3,
      };
    });

    let count = 0

    for (let transaction of transactions) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        count = count + 1;
      } catch (err) {
        console.log({err})
      }
    }
    return {count};
  } catch (err) {
    return "error" as const;
  }
}

// readCoralCreditCard();

export async function readIciciStatement(data: string) {
  try {
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

    transactions = transactions.map((t:any) => {
      const formattedDate = DateTime.fromFormat(
        t["Transaction Date"],
        "dd/MM/yyyy"
      );

      return {
        date: formattedDate.toISO(),
        amount:
          Number(t["Withdrawal Amount (INR )"]) === 0
            ? -Number(t["Deposit Amount (INR )"])
            : Number(t["Withdrawal Amount (INR )"]),
        details: t["Transaction Remarks"],
        sourceId: 4,
      };
    });

    let count = 0

    for (let transaction of transactions) {
      try {
        await prisma.transaction.create({
          data: transaction
        });
        count = count + 1;
      } catch (err) {
        console.log({err})
      }
    }
    return {count};
  } catch (err) {
    return "error" as const;
  }
}

export const statementMap = {
  amazon_cc: readAmazonCreditCard,
  sbi: readSbiStatement,
  coral_cc: readCoralCreditCard,
  icici_643: readIciciStatement,
  hdfc:readHdfcStatement
};

const validataSchema = z.object({
  source: z.union([
    z.literal("amazon_cc"),
    z.literal("sbi"),
    z.literal("coral_cc"),
    z.literal("icici_643"),
    z.literal("hdfc"),

  ]),
  data: z.string(),
});

export async function insertTransactions(source: string, data: string) {
  const { source: _source } = validataSchema.parse({
    source: source,
    data: data,
  });
  let msg = await statementMap[_source](data);
  return msg;
}
