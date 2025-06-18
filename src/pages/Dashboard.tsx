
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Plus, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingJobs: number;
  totalRMs: number;
  recentJobs: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalRMs: 0,
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch jobs data
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeJobs = jobs.filter(job => job.status === 'Active').length;
      const completedJobs = jobs.filter(job => job.status === 'Completed').length;
      const pendingJobs = jobs.filter(job => job.status === 'Pending').length;

      // Fetch recent jobs
      const recentJobsQuery = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentJobsSnapshot = await getDocs(recentJobsQuery);
      const recentJobs = recentJobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch RMs data
      const rmsSnapshot = await getDocs(collection(db, 'relationship_managers'));

      setStats({
        totalJobs: jobs.length,
        activeJobs,
        completedJobs,
        pendingJobs,
        totalRMs: rmsSnapshot.size,
        recentJobs,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 space-y-6 min-h-full">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your logistics operations today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
            <FileText className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              All jobs in the system
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Jobs</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Relationship Managers</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalRMs}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active RMs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Recent Jobs</CardTitle>
            <CardDescription>
              Latest job activities in your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length > 0 ? (
              <div className="space-y-4">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-gray-900">{job.jobNumber}</div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'Active' ? 'bg-green-100 text-green-800' :
                          job.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {job.shipmentType} • {job.finalDestination}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.rmName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent jobs found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
            <CardDescription>
              Get things done faster
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.permissions?.["Create Job"] && (
              <Link to="/create-job" className="block">
                <Button className="w-full justify-start bg-gray-900 hover:bg-gray-800 text-white" size="lg">
                  <Plus className="mr-3 h-5 w-5" />
                  Create New Job
                </Button>
              </Link>
            )}
            <Link to="/view-jobs" className="block">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <FileText className="mr-3 h-5 w-5" />
                View All Jobs
              </Button>
            </Link>
            <Link to="/manage-entities" className="block">
              <Button className="w-full justify-start" variant="outline" size="lg">
                <Users className="mr-3 h-5 w-5" />
                Manage Entities
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Performance Summary</CardTitle>
          <CardDescription>
            Your logistics performance at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">{stats.completedJobs}</div>
              <div className="text-sm text-gray-600">Completed Jobs</div>
              <div className="flex items-center justify-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600">Success Rate</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{stats.activeJobs}</div>
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs text-blue-600">Active Now</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">{stats.pendingJobs}</div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="flex items-center justify-center mt-2">
                <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                <span className="text-xs text-yellow-600">Awaiting</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
