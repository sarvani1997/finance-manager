import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";

import { prisma } from "../services/prisma.server";
import { useState } from "react";

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

export default function Index() {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();
  const [ignore, setIgnore] = useState(true);
  const ignoredTransactions = transactions.filter((t) => !t.ignore);
  const filteredTransactions = ignore ? ignoredTransactions : transactions;

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
      <div>
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
