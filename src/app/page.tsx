export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            B2C Booking API
          </h1>
          <p className="text-xl text-gray-600">
            A secure and scalable API for travel booking management
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            API Endpoints
          </h2>
          
          <div className="space-y-6">
            {/* Authentication */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Authentication
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    POST
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/auth/signup
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    POST
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/auth/login
                  </code>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                User Profile
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    GET
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/user/profile
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                    PUT
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/user/profile
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
              </div>
            </div>

            {/* Bookings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Bookings
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    GET
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/bookings?status=upcoming
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    GET
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/bookings?status=completed
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    POST
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/bookings/:id/summary
                  </code>
                  <span className="text-xs text-gray-500">(Protected, AI)</span>
                </div>
              </div>
            </div>

            {/* Travellers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Travellers
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    POST
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/travellers
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                    PUT
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/travellers/:traveller_id
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                    DELETE
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/travellers/:traveller_id
                  </code>
                  <span className="text-xs text-gray-500">(Protected)</span>
                </div>
              </div>
            </div>

            {/* Database Seeding */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Database
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    POST
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /api/seed
                  </code>
                  <span className="text-xs text-gray-500">(Populate sample data)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Setup Instructions
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Environment Variables</h3>
              <p className="text-sm">
                Configure your <code className="bg-gray-100 px-1 rounded">.env.local</code> file with:
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                <li>MONGODB_URI - Your MongoDB connection string</li>
                <li>JWT_SECRET - Secret key for JWT tokens</li>
                <li>JWT_REFRESH_SECRET - Secret key for refresh tokens</li>
                <li>OPENAI_API_KEY - OpenAI API key for booking summaries</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Database Setup</h3>
              <p className="text-sm">
                Run <code className="bg-gray-100 px-1 rounded">POST /api/seed</code> to populate the database with sample data.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Authentication</h3>
              <p className="text-sm">
                Use the sample users or create new ones via signup. Include the access token in the Authorization header as <code className="bg-gray-100 px-1 rounded">Bearer &lt;token&gt;</code> for protected endpoints.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Sample Users</h3>
              <p className="text-sm">
                After seeding, you can use these credentials:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>Email: john.doe@example.com, Password: password123</li>
                <li>Email: jane.smith@example.com, Password: password123</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}