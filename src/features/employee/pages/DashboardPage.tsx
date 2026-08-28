export default function DashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here's what's happening with your activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Points</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Activities Completed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Current Streak</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Rank</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">#1</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">No recent activities yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start participating in activities to see them here!
            </p>
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Activities</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">No upcoming activities</p>
            <p className="text-sm text-gray-500 mt-1">
              Check the Discover page for new activities!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Discover Activities
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
            View Rewards
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
            Check Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}