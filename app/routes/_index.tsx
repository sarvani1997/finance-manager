import type { MetaFunction } from "@remix-run/node";
import { prisma } from "../services/prisma.server";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async () => {
  const transactions = await prisma.transaction.findMany();
  console.log("transactions", transactions);
  return transactions;
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  console.log(data);
  return (
    <div>
      <div
        id="jobs"
        className="relative overflow-x-auto shadow-md sm:rounded-lg lg:px-16 xl:px-32 py-16"
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
            </tr>
          </thead>
          <tbody>
            {data.map((t) => {
              return (
                <tr key={t.id} className="border-y-4 border-white shadow-sm">
                  <td className="px-6 py-4">{t.date}</td>
                  <td className="px-6 py-4 ">{t.sourceId}</td>
                  <td className="px-6 py-4">{t.amount}</td>
                  <td className="px-6 py-4">{t.details}</td>
                  <td className="px-6 py-4"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
