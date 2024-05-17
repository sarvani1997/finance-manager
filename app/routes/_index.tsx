import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import { prisma } from "../services/prisma.server";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Finance Manager" }];
};

export const loader = async () => {
  const tags = await prisma.tag.findMany();
  const sources = await prisma.source.findMany();
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });
  return [transactions, sources, tags] as const;
};

function Filters({
  source,
  setSource,
  tag,
  setTag,
  month,
  setMonth,
  year,
  setYear,
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
          <option value="">All</option>
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
          <option value="">All</option>
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

export default function Index() {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();
  const [ignore, setIgnore] = useState(true);
  const [source, setSource] = useState("");
  const [tag, setTag] = useState("");
  const [month, setMonth] = useState(DateTime.now().toFormat("MM"));
  const [year, setYear] = useState(DateTime.now().toFormat("yyyy"));
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    function get() {
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
        setFilteredTransactions(ignoredTransactions);
      } else {
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
        setFilteredTransactions(unignoredTransactions);
      }
    }
    get();
  }, [tag, ignore, source, month, year]);

  useEffect(() => {
    let amountArr = filteredTransactions.map((t) => t.amount);
    let sum = 0;
    for (let i = 0; i < amountArr.length; i++) {
      sum += amountArr[i];
    }
    setTotal(sum);
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="">
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
  return (
    <div className="py-4">
      <div className="flex justify-between ">
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
            value={ignore}
            onChange={(e) => setIgnore(!e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 ">
            Show Ignored Transactions
          </span>
        </label>
      </div>
      <div className="relative overflow-x-auto mt-6">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500   ">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
              <th scope="col" className="px-6 py-3">
                Source
              </th>
              <th scope="col" className="px-6 py-3">
                Amount
              </th>
              <th scope="col" className="px-6 py-3">
                Details
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
            {filteredTransactions.map((t) => {
              return (
                <tr key={t.id} className="bg-white border-b ">
                  <td className="px-6 py-4">
                    {DateTime.fromISO(t.date)
                      .toLocaleString(DateTime.DATETIME_MED)
                      .slice(0, -7)}
                  </td>
                  <td className="px-6 py-4 ">
                    {sources.find((s) => t.sourceId === s.id)?.name}
                  </td>
                  <td className="px-6 py-4">Rs. {t.amount}/-</td>
                  <td className="px-6 py-4">
                    {t.details}
                    {t.ignore && (
                      <span className="m-2 bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                        Ignored
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {tags.find((s) => t.tagId === s.id)?.name}
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/edit-transaction/${t.id}`}>Edit</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
