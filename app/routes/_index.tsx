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
    include: { transactionTags: true },
  });
  return [transactions, sources, tags] as const;
};

export default function Index() {
  const [transactions, sources, tags] = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-end">
        <a href="/upload-csv" className="m-4 text-blue-500">
          Upload CSV
        </a>
      </div>
      <div
        id="jobs"
        className="relative overflow-x-auto shadow-md sm:rounded-lg lg:px-16 xl:px-32 py-8"
      >
        <table className="w-full text-base text-left   ">
          <thead className="text-base shadow-sm text-gray-700 uppercase">
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
                <tr key={t.id} className="border-y-4 border-white shadow-sm">
                  <td className="px-6 py-4">
                    {DateTime.fromISO(t.date).toISODate()}
                  </td>
                  <td className="px-6 py-4 ">
                    {sources.find((s) => t.sourceId === s.id)?.name}
                  </td>
                  <td className="px-6 py-4">{t.amount}</td>
                  <td className="px-6 py-4">{t.details}</td>
                  <td className="px-6 py-4">
                    {t.transactionTags.map(
                      (tt) => tags.find((tag) => tag.id == tt.tagId)?.name
                    )}
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
