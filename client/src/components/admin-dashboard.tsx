import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Percent, 
  Send, 
  Clock, 
  Download, 
  Settings,
  Search,
  Eye,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { User } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  emailsSentToday: number;
  completionRate: number;
}

export function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/admin/test-email", { email }),
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your email inbox for the test message",
      });
      setTestEmail("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Trigger weekly emails mutation
  const triggerEmailsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/trigger-weekly-emails"),
    onSuccess: (data) => {
      toast({
        title: "Weekly emails triggered",
        description: `Processed ${data.result?.processed || 0} emails`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to trigger emails",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", `/api/admin/users/${userId}/deactivate`),
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "The user has been deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to deactivate user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(testEmail);
  };

  const handleDeactivateUser = (userId: number) => {
    if (confirm("Are you sure you want to deactivate this user?")) {
      deactivateUserMutation.mutate(userId);
    }
  };

  // Filter users based on search and status
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive) ||
      (filterStatus === "completed" && user.currentWeek >= 12);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getStatusBadge = (user: User) => {
    if (user.currentWeek >= 12) {
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    }
    if (user.isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-go-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-go-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-go-neutral-500">Total Users</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-go-accent/10 rounded-lg">
                <Mail className="h-6 w-6 text-go-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-go-neutral-500">Emails Sent Today</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.emailsSentToday || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-go-secondary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-go-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-go-neutral-500">Active Users</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.activeUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Percent className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-go-neutral-500">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.completionRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending}
                className="w-full go-button-primary"
              >
                <Send className="h-4 w-4 mr-2" />
                {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
              </Button>
            </div>

            <Button
              onClick={() => triggerEmailsMutation.mutate()}
              disabled={triggerEmailsMutation.isPending}
              className="go-text-accent bg-go-accent/10 hover:bg-go-accent/20 text-go-accent border-go-accent"
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              {triggerEmailsMutation.isPending ? "Processing..." : "Trigger Weekly Emails"}
            </Button>

            <Button variant="outline" className="text-go-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>

            <Button variant="outline" className="text-go-neutral-600">
              <Settings className="h-4 w-4 mr-2" />
              System Health
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined {formatDate(user.signupDate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.currentWeek >= 12 ? "Completed" : `Week ${user.currentWeek}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.lastEmailSent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-go-primary hover:text-go-secondary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivateUser(user.id)}
                              disabled={deactivateUserMutation.isPending}
                              className="text-red-600 hover:text-red-900"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredUsers.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users?.length || 0} users
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
