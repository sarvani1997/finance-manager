import {
  type MetaFunction,
  type ActionFunctionArgs,
  redirect,
  LoaderFunctionArgs,
  json,
} from "@remix-run/node";
import { useSubmit, useLoaderData, Form } from "@remix-run/react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Source, Tag } from "@prisma/client";

import { prisma } from "~/.server/prisma";
import { assertSignedIn } from "~/.server/auth";

interface Transaction {
  id: number;
  date: string;
  amount: number;
  details: string;
  sourceId: number;
  ignore: boolean | null;
  remark: string | null;
  tagId: number | null;
}

export const meta: MetaFunction = () => {
  return [{ title: "Finance Manager" }];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.time("session validate");
  await assertSignedIn(request);
  console.timeEnd("session validate");

  const body = await request.formData();
  const id = body.get("id");
  const tag = body.get("tag");

  await prisma.transaction.update({
    where: { id: Number(id) },
    data: {
      tagId: Number(tag) || null,
    },
  });
  return {};
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertSignedIn(request);

  // if (!session || !user) {
  //   throw redirect("/login", {
  //     headers: cookie ? { "Set-Cookie": cookie } : {},
  //   });
  // }

  const [tags, sources, transactions] = await Promise.all([
    prisma.tag.findMany(),
    prisma.source.findMany(),
    prisma.transaction.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
  ]);

  return json([
    transactions as unknown as Transaction[],
    sources,
    tags,
  ] as const);
};

function TableBody({
  sources,
  tags,
  transaction,
}: {
  sources: Source[];
  tags: Tag[];
  transaction: Transaction;
}) {
  const [editTag, setEditTag] = useState(transaction.tagId || "0");

  const submit = useSubmit();
  return (
    <tr key={transaction.id} className="bg-white border-b ">
      <td className="px-6 py-4">
        {DateTime.fromISO(transaction.date).toFormat("d LLL yyyy")}
      </td>
      <td className="px-6 py-4">
        {transaction.remark
          ? transaction.remark + " (remark)"
          : transaction.details}
        {transaction.ignore && (
          <span className="m-2 bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
            Ignored
          </span>
        )}
      </td>
      <td className="px-6 py-4 ">
        {sources.find((s) => transaction.sourceId === s.id)?.name}
      </td>
      <td className="px-6 py-4">Rs. {transaction.amount}/-</td>
      <td className="px-6 py-4">
        <Form onChange={(e) => submit(e.currentTarget, { method: "POST" })}>
          <input id="id" name="id" type="hidden" value={transaction.id} />
          <select
            id="tag"
            name="tag"
            value={editTag}
            onChange={(e) => setEditTag(e.target.value)}
            // className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
          >
            <option disabled value="0">
              Choose a Tag
            </option>
            {tags.map((s) => {
              return (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              );
            })}
          </select>
        </Form>
      </td>
      <td className="px-6 py-4">
        <a href={`/edit-transaction/${transaction.id}`}>Edit</a>
      </td>
    </tr>
  );
}

function Filters({
  source,
  setSource,
  tag,
  setTag,
  month,
  setMonth,
  year,
  setYear,
}: {
  source: string;
  setSource: (source: string) => void;
  tag: string;
  setTag: (tag: string) => void;
  month: string;
  setMonth: (month: string) => void;
  year: string;
  setYear: (year: string) => void;
}) {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();

  const months = [
    { name: "Jan", id: "01" },
    { name: "Feb", id: "02" },
    { name: "Mar", id: "03" },
    { name: "Apr", id: "04" },
    { name: "May", id: "05" },
    { name: "Jun", id: "06" },
    { name: "Jul", id: "07" },
    { name: "Aug", id: "08" },
    { name: "Sep", id: "09" },
    { name: "Oct", id: "10" },
    { name: "Nov", id: "11" },
    { name: "Dec", id: "12" },
  ];

  const years = ["2021", "2022", "2023", "2024"];

  const handleReset = () => {
    setTag("");
    setSource("");
    setMonth(DateTime.now().toFormat("MM"));
    setYear(DateTime.now().toFormat("yyyy"));
  };

  return (
    <div className="flex flex-row">
      <div className="mx-2">
        <select
          id="month"
          name="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
        >
          {months.map((s) => {
            return (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="mx-2">
        <select
          id="year"
          name="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
        >
          {years.map((s) => {
            return (
              <option key={s} value={s}>
                {s}
              </option>
            );
          })}
        </select>
      </div>
      <div className="mx-2">
        <select
          id="source"
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
        >
          <option value="">All Sources</option>
          {sources.map((s) => {
            return (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="mx-2">
        <select
          id="tag"
          name="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
        >
          <option value="">All Tags</option>
          {tags.map((s) => {
            return (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            );
          })}
        </select>
      </div>
      <button
        className="mx-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 "
        onClick={handleReset}
      >
        Reset
      </button>
    </div>
  );
}

function filterTransactions(
  transactions: Transaction[],
  {
    ignore,
    source,
    tag,
    month,
    year,
  }: {
    ignore: boolean;
    source: string;
    tag: string;
    month: string;
    year: string;
  }
) {
  if (ignore) {
    let ignoredTransactions = transactions.filter((t) => !t.ignore);
    if (source !== "") {
      ignoredTransactions = ignoredTransactions.filter(
        (t) => t.sourceId === Number(source)
      );
    }
    if (tag !== "") {
      ignoredTransactions = ignoredTransactions.filter(
        (t) => t.tagId === Number(tag)
      );
    }
    if (month !== "" || year !== "") {
      ignoredTransactions = ignoredTransactions.filter((t) => {
        return DateTime.fromFormat(
          "01/" + month + "/" + year,
          "dd/MM/yyyy"
        ).hasSame(DateTime.fromISO(t.date), "month");
      });
    }
    return ignoredTransactions;
  }
  let unignoredTransactions = transactions;
  if (source !== "") {
    unignoredTransactions = unignoredTransactions.filter(
      (t) => t.sourceId === Number(source)
    );
  }
  if (tag !== "") {
    unignoredTransactions = unignoredTransactions.filter(
      (t) => t.tagId === Number(tag)
    );
  }
  if (month !== "" || year !== "") {
    unignoredTransactions = unignoredTransactions.filter((t) => {
      return DateTime.fromFormat(
        "01/" + month + "/" + year,
        "dd/MM/yyyy"
      ).hasSame(DateTime.fromISO(t.date), "month");
    });
  }
  return unignoredTransactions;
}

export default function Index() {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();
  const [ignore, setIgnore] = useState(true);
  const [source, setSource] = useState("");
  const [tag, setTag] = useState("");
  const [month, setMonth] = useState(DateTime.now().toFormat("MM"));
  const [year, setYear] = useState(DateTime.now().toFormat("yyyy"));

  const filteredTransactions = filterTransactions(transactions, {
    ignore,
    source,
    tag,
    month,
    year,
  });

  let total = 0;
  let amountArr = filteredTransactions.map((t) => t.amount);
  let sum = 0;
  for (let i = 0; i < amountArr.length; i++) {
    sum += amountArr[i];
  }
  total = sum;

  if (transactions.length === 0) {
    return (
      <div>
        <p className="text-center">
          No Transactions to Display.{" "}
          <a className="text-blue-600" href="/upload-csv">
            Click here
          </a>{" "}
          to upload
        </p>
      </div>
    );
  }
  console.log({ ignore });
  return (
    <div className="py-4">
      <div className="flex justify-between items-center">
        <div>
          <Filters
            source={source}
            setSource={setSource}
            tag={tag}
            setTag={setTag}
            month={month}
            year={year}
            setMonth={setMonth}
            setYear={setYear}
          />
        </div>
        <div className="font-bold text-red-500 text-xl">
          Total: Rs. {total}/-
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={ignore}
            onChange={(e) => setIgnore(!ignore)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 ">
            Hide Ignored Transactions
          </span>
        </label>
      </div>
      <div className="relative overflow-x-auto mt-6">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
              <th scope="col" className="px-6 py-3">
                Details
              </th>
              <th scope="col" className="px-6 py-3">
                Source
              </th>
              <th scope="col" className="px-6 py-3">
                Amount
              </th>
              <th scope="col" className="px-6 py-3">
                Tag
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => {
              return (
                <TableBody
                  key={transaction.id}
                  transaction={transaction}
                  sources={sources}
                  tags={tags}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
