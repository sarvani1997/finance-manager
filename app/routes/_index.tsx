import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";

import { prisma } from "../services/prisma.server";

export const meta: MetaFunction = () => {
  return [{ title: "Finance Manager" }];
};

export const loader = async () => {
  const tags = await prisma.tag.findMany();
  const sources = await prisma.source.findMany();
  const transactions = await prisma.transaction.findMany({
    where: {
      ignore: false,
    },
    orderBy: { date: "desc" },
  });
  return [transactions, sources, tags] as const;
};

export default function Index() {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();

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
      <div className="relative overflow-x-auto">
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
            {transactions.map((t) => {
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
                  <td className="px-6 py-4">{t.details}</td>
                  <td className="px-6 py-4"></td>
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
