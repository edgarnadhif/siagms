import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const users = await prisma.user.findMany()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome back!</p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Registered Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Role</th>
              <th className="py-3 px-6 text-left">Date Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                 <td className="py-3 px-6">{user.id}</td>
                 <td className="py-3 px-6">{user.email}</td>
                 <td className="py-3 px-6"><span className={`font-bold ${user.role === 'ADMIN' ? 'text-blue-500' : 'text-green-500'}`}>{user.role}</span></td>
                 <td className="py-3 px-6">{user.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
