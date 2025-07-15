// src/app/page.js
"use client";

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Posts Dashboard</h1>

      <div className="mb-6">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
          Create New Post
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-800">All Posts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Sample static data for now */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Sample Post Title
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  This is a sample post content preview...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    View Details
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  2
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Another Post Title
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Another sample post content preview...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
