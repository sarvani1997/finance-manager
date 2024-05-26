import { redirect, LoaderFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { loginAction } from "~/.server/auth";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  console.log({ loginAction });
  if (context.session) {
    throw redirect("/");
  }
  return {};
};

export default function LoginPage() {
  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl container mx-auto p-4">
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
            Email
          </label>
          <input
            type="email"
            required
            id="date"
            name="email"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            defaultValue=""
          />
        </div>
        <div className="my-2">
          <label
            htmlFor="date"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            id="date"
            name="password"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            defaultValue=""
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
