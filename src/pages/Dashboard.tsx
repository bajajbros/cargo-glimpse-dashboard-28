
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Plus, TrendingUp, Users, Building, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  totalRMs: number;
  totalShippers: number;
  totalConsignees: number;
  totalAgents: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalRMs: 0,
    totalShippers: 0,
    totalConsignees: 0,
    totalAgents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch jobs data
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnapshot.docs.map(doc => doc.data());
      
      const activeJobs = jobs.filter(job => job.status === 'Active').length;
      const completedJobs = jobs.filter(job => job.status === 'Completed').length;
      const pendingJobs = jobs.filter(job => job.status === 'Pending').length;

      // Fetch RMs data
      const rmsSnapshot = await getDocs(collection(db, 'relationship_managers'));
      
      // Fetch entities data
      const shippersSnapshot = await getDocs(collection(db, 'shippers'));
      const consigneesSnapshot = await getDocs(collection(db, 'consignees'));
      const agentsSnapshot = await getDocs(collection(db, 'overseas_agents'));

      setStats({
        totalJobs: jobs.length,
        activeJobs,
        completedJobs,
        pendingJobs,
        totalRMs: rmsSnapshot.size,
        totalShippers: shippersSnapshot.size,
        totalConsignees: consigneesSnapshot.size,
        totalAgents: agentsSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const jobStatusData = [
    { name: 'Active', value: stats.activeJobs, color: '#3b82f6' },
    { name: 'Completed', value: stats.completedJobs, color: '#10b981' },
    { name: 'Pending', value: stats.pendingJobs, color: '#f59e0b' },
  ];

  const entitiesData = [
    { name: 'Shippers', count: stats.totalShippers },
    { name: 'Consignees', count: stats.totalConsignees },
    { name: 'Agents', count: stats.totalAgents },
  ];

  const monthlyData = [
    { month: 'Jan', jobs: 65 },
    { month: 'Feb', jobs: 78 },
    { month: 'Mar', jobs: 90 },
    { month: 'Apr', jobs: 85 },
    { month: 'May', jobs: 95 },
    { month: 'Jun', jobs: 110 },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-full">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-5 w-5 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-blue-100 mt-1">
              All jobs in system
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-green-100 mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Package className="h-5 w-5 text-yellow-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingJobs}</div>
            <p className="text-xs text-yellow-100 mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RMs</CardTitle>
            <Users className="h-5 w-5 text-purple-100" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRMs}</div>
            <p className="text-xs text-purple-100 mt-1">
              Relationship managers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Status Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Job Status Distribution</CardTitle>
            <CardDescription>
              Current status breakdown of all jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entities Bar Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Entities Overview</CardTitle>
            <CardDescription>
              Total number of registered entities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entitiesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Monthly Job Trend</CardTitle>
            <CardDescription>
              Job creation trend over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/create-job">
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" size="lg">
                <Plus className="mr-3 h-5 w-5" />
                Create New Job
              </Button>
            </Link>
            <Link to="/view-jobs">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <FileText className="mr-3 h-5 w-5" />
                View All Jobs
              </Button>
            </Link>
            <Link to="/manage-entities">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <Building className="mr-3 h-5 w-5" />
                Manage Entities
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
