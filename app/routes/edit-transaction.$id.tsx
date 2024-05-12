import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";

import { prisma } from "../services/prisma.server";

export const meta: MetaFunction = () => {
  return [{ title: "Finance Manager" }];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const tags = await prisma.tag.findMany();
  const sources = await prisma.source.findMany();
  const transaction = await prisma.transaction.findUnique({
    where: { id: Number(params.id) },
    include: { transactionTags: true },
  });
  return [transaction, sources, tags] as const;
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const body = await request.formData();
  const remark = body.get("remark") as string | null;

  await prisma.transaction.update({
    where: { id: Number(params.id) },
    data: { remark: remark || "" },
  });

  return redirect;
};

export default function EditTransaction() {
  const [transaction] = useLoaderData<typeof loader>();

  if (transaction === null) {
    return <div>Transaction not found</div>;
  }

  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl container mx-auto p-4">
      <h2 className="">Edit Transaction</h2>
      <Form
        className="max-w-sm md:max-w-full md:px-8 lg:px-0 mx-auto"
        encType="multipart/form-data"
        name="csv_uploader"
        method="POST"
      >
        <div className="my-2">
          <label
            htmlFor="date"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Date
          </label>
          <input
            type="text"
            id="date"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            value={transaction.date.slice(0, 10)}
            disabled
          />
        </div>
        <div className="my-2">
          <label
            htmlFor="details"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Details
          </label>
          <input
            type="text"
            id="details"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            value={transaction.details}
            disabled
          />
        </div>
        <div className="my-2">
          <label
            htmlFor="amount"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Amount
          </label>
          <input
            type="text"
            id="amount"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            value={transaction.amount}
            disabled
          />
        </div>
        <div className="my-2">
          <label
            htmlFor="remark"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Remark
          </label>
          <input
            type="text"
            id="remark"
            name="remark"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            defaultValue={transaction.remark || ""}
          />
        </div>
        <button
          type="submit"
          className="mt-4 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Submit
        </button>
      </Form>
    </div>
  );
}
