export default function Home() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Welcome to Tidy Analytics Admin Console</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/admin/disposition-config"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Disposition Configuration
          </h3>
          <p className="text-gray-600">
            Manage disposition values used for schema triage categorization.
          </p>
        </a>

        <a
          href="/admin/schema-triage"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Schema Triage
          </h3>
          <p className="text-gray-600">
            Review and categorize database columns across multiple databases.
          </p>
        </a>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h4>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Start with <strong>Disposition Configuration</strong> to set up your triage categories</li>
          <li>Navigate to <strong>Schema Triage</strong> to begin reviewing database columns</li>
          <li>Generate schema inventory for your target database</li>
          <li>Review columns one by one, assigning dispositions and marking master-eligible fields</li>
        </ol>
      </div>
    </div>
  );
}
