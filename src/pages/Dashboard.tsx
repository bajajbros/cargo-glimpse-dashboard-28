
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, TrendingUp, Activity, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Job } from "@/types/job";
import { Link } from "react-router-dom";

interface RM {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  shortName: string;
  status: string;
  createdAt: Date;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rms, setRMs] = useState<RM[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch jobs
    const jobsQuery = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
      const jobsData: Job[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Job);
      });
      setJobs(jobsData);
    });

    // Fetch RMs
    const fetchRMs = async () => {
      try {
        const rmsSnapshot = await getDocs(collection(db, "relationship_managers"));
        const rmsData: RM[] = [];
        rmsSnapshot.forEach((doc) => {
          const data = doc.data();
          rmsData.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            shortName: data.shortName,
            status: data.status,
            createdAt: data.createdAt?.toDate(),
          });
        });
        setRMs(rmsData);
      } catch (error) {
        console.error("Error fetching RMs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRMs();

    return () => {
      jobsUnsubscribe();
    };
  }, []);

  const activeJobs = jobs.filter(job => job.status === 'Active').length;
  const pendingJobs = jobs.filter(job => job.status === 'Pending').length;
  const completedJobs = jobs.filter(job => job.status === 'Completed').length;
  const activeRMs = rms.filter(rm => rm.status?.toLowerCase() === 'active').length;

  const recentJobs = jobs.slice(0, 5);
  const recentRMs = rms.slice(0, 5);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeJobs} active, {pendingJobs} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeJobs}</div>
            <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Relationship Managers</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{rms.length}</div>
            <p className="text-xs text-gray-500 mt-1">{activeRMs} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{completedJobs}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.permissions?.["Create Job"] && (
              <Link to="/create-job">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              </Link>
            )}
            <Link to="/view-jobs">
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All Jobs
              </Button>
            </Link>
            {user?.role === 'superadmin' && (
              <Link to="/manage-users">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}
            <Link to="/manage-entities">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Manage Entities
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest job activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No jobs found</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{job.jobNumber}</p>
                      <p className="text-xs text-gray-500">{job.shipmentType} • {job.modeOfShipment}</p>
                    </div>
                    <Badge variant={job.status === 'Active' ? 'default' : job.status === 'Pending' ? 'secondary' : 'outline'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent RMs (Admin only) */}
      {user?.role === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Relationship Managers</CardTitle>
            <CardDescription>Newly added RMs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRMs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No RMs found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentRMs.map((rm) => (
                  <div key={rm.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rm.firstName} {rm.lastName}</h4>
                      <Badge variant={rm.status?.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                        {rm.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{rm.email}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {rm.shortName}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
