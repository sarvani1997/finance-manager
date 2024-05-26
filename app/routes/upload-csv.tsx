import {
  type ActionFunctionArgs,
  type MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { useState } from "react";

import { prisma } from "~/.server/prisma";
import { insertTransactions } from "~/.server/handleCsv";

export const meta: MetaFunction = () => {
  return [{ title: "Upload Statement" }];
};

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();

  const source = body.get("source") as string | null;
  const file = body.get("file") as Blob | null;

  if (!source || !file) {
    return new Response("Bad Request", { status: 400 });
  }

  const msg = await insertTransactions(source, await file.text());

  if (msg === "error") {
    return "1";
  } else if (msg.count === 0) {
    return "0";
  }

  return redirect("/");
}

export const loader = async () => {
  const sources = await prisma.source.findMany();
  return sources;
};

export default function PploadCsv() {
  const d = useActionData<typeof action>();
  const data = useLoaderData<typeof loader>();
  const [source, setSource] = useState("");
  const [, setFile] = useState<File | null>(null);

  return (
    <div className=" py-4">
      {d === "0" && (
        <div
          className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <span className="font-medium">Alert!</span> This Statement is already
          uploaded
        </div>
      )}
      {d === "1" && (
        <div
          className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
          role="alert"
        >
          <span className="font-medium">Alert!</span> Please check the format of
          the file
        </div>
      )}
      <Form
        className="max-w-sm md:max-w-full md:px-8 lg:px-0 mx-auto"
        encType="multipart/form-data"
        name="csv_uploader"
        method="POST"
      >
        <div className="mt-4">
          <label
            htmlFor="source"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Select an option
          </label>
          <select
            id="source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
          >
            <option disabled value="">
              Choose a source
            </option>
            {data.map((s) => {
              return (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              );
            })}
          </select>
        </div>
        <div className="mt-4 ">
          <input
            type="file"
            name="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-200 "
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
