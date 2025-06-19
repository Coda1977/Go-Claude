import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Clock, 
  Eye, 
  MousePointer, 
  Search,
  Calendar,
  Target,
  BarChart3,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  emailsSentToday: number;
  completionRate: number;
}

interface UserWithEmailData {
  id: number;
  email: string;
  goals: string;
  timezone: string;
  isActive: boolean;
  currentWeek: number;
  createdAt: string;
  emailsSent: number;
  lastEmailSent: string | null;
  emailHistory: EmailRecord[];
}

interface EmailRecord {
  id: number;
  weekNumber: number;
  subject: string;
  sentDate: string;
  openedAt: string | null;
  clickCount: number;
  deliveryStatus: string;
}

export function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithEmailData | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<UserWithEmailData[]>({
    queryKey: ["/api/admin/users"],
  });

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.goals.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const calculateOpenRate = (emailHistory: EmailRecord[]) => {
    if (emailHistory.length === 0) return 0;
    const openedEmails = emailHistory.filter(email => email.openedAt).length;
    return Math.round((openedEmails / emailHistory.length) * 100);
  };

  const getStatusBadge = (user: UserWithEmailData) => {
    if (!user.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (user.currentWeek >= 12) return <Badge className="bg-green-500">Completed</Badge>;
    if (user.currentWeek >= 8) return <Badge className="bg-blue-500">Advanced</Badge>;
    if (user.currentWeek >= 4) return <Badge className="bg-yellow-500">Progress</Badge>;
    return <Badge variant="outline">New</Badge>;
  };

  if (statsLoading || usersLoading) {
    return (
      <div className="p-8">
        <div className="grid-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section mb-2">Admin Dashboard</h1>
          <p className="text-body">
            Comprehensive leadership program analytics and user management
          </p>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Last updated: {format(new Date(), "MMM dd, yyyy 'at' h:mm a")}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid-4 gap-6">
        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Enrolled in program
            </p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Active Users
            </CardTitle>
            <TrendingUp className="h-4 w-4 accent-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.activeUsers || 0}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Currently receiving emails
            </p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Emails Today
            </CardTitle>
            <Mail className="h-4 w-4 accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.emailsSentToday || 0}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Sent successfully
            </p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Completion Rate
            </CardTitle>
            <Target className="h-4 w-4 accent-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats?.completionRate || 0}%
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Finished all 12 weeks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Email Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <Input
                placeholder="Search by email or goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filteredUsers.length} of {users?.length || 0} users
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>User</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Emails</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Open Rate</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.email}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Joined {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            Week {user.currentWeek}/12
                          </div>
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${(user.currentWeek / 12) * 100}%`,
                                backgroundColor: 'var(--accent-blue)'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.emailsSent}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {calculateOpenRate(user.emailHistory)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActiveTab("analytics");
                          }}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Header */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-card mb-2">{selectedUser.email}</h3>
                    <p className="text-body mb-4 max-w-2xl">
                      <strong>Goals:</strong> {selectedUser.goals}
                    </p>
                    <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Joined {format(new Date(selectedUser.createdAt), "MMMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {selectedUser.timezone}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setActiveTab("users");
                    }}
                  >
                    Back to Users
                  </Button>
                </div>
              </div>

              {/* Email History */}
              <div className="card">
                <h4 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                  Email History ({selectedUser.emailHistory.length} emails)
                </h4>
                <div className="space-y-4">
                  {selectedUser.emailHistory.map((email) => (
                    <div 
                      key={email.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h5 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Week {email.weekNumber}: {email.subject}
                          </h5>
                          <Badge variant={email.deliveryStatus === 'sent' ? 'default' : 'destructive'}>
                            {email.deliveryStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Sent {format(new Date(email.sentDate), "MMM dd, h:mm a")}
                          </div>
                          {email.openedAt && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Opened {format(new Date(email.openedAt), "MMM dd, h:mm a")}
                            </div>
                          )}
                          {email.clickCount > 0 && (
                            <div className="flex items-center gap-2">
                              <MousePointer className="w-4 h-4" />
                              {email.clickCount} clicks
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {email.openedAt ? (
                          <Badge className="bg-green-500">Opened</Badge>
                        ) : (
                          <Badge variant="outline">Not Opened</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <h3 className="text-card mb-2">Select a User</h3>
              <p className="text-body">
                Choose a user from the User Management tab to view their detailed email analytics
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}