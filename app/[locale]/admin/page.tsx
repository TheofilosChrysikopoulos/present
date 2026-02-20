import { getAdminProductStats } from '@/lib/queries/products'
import { getEnquiryStats } from '@/lib/queries/enquiries'
import { Package, BarChart3, Mail, AlertCircle } from 'lucide-react'

export default async function AdminDashboard() {
  const [productStats, enquiryStats] = await Promise.all([
    getAdminProductStats(),
    getEnquiryStats(),
  ])

  const stats = [
    {
      label: 'Total Products',
      value: productStats.total,
      icon: Package,
      color: 'text-stone-600',
    },
    {
      label: 'Active Products',
      value: productStats.active,
      icon: BarChart3,
      color: 'text-green-600',
    },
    {
      label: 'Total Enquiries',
      value: enquiryStats.total,
      icon: Mail,
      color: 'text-blue-600',
    },
    {
      label: 'New Enquiries',
      value: enquiryStats.new,
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-stone-200 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">{stat.label}</p>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
