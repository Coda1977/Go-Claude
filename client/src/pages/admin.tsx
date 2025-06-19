import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Shield, Mail } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/admin/stats");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/login", { email });
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Welcome back!",
        description: "Admin access granted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Access Denied",
        description: "Only authorized administrators can access this dashboard",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      loginMutation.mutate(email.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-body">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md card">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-blue)' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-card">Admin Access</CardTitle>
              <p className="text-body mt-2">
                Restricted to authorized administrators only
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending || !email.trim()}
                className="btn-primary w-full"
              >
                {loginMutation.isPending ? "Verifying Access..." : "Access Dashboard"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                This dashboard provides comprehensive analytics and user management for the Go Leadership platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}