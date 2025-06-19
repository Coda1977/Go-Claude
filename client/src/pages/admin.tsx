import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDashboard } from "@/components/admin-dashboard";
import { ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBackToHome = () => {
    setLocation("/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/admin/login", { password });
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      setIsAuthenticated(false);
      setPassword("");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-go-neutral-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToHome}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2"
                    placeholder="Enter admin password"
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 go-button-primary"
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToHome}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="text-go-neutral-500 hover:text-go-neutral-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <h1 className="text-xl font-bold">Go Leadership - Admin Dashboard</h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-go-neutral-500 hover:text-go-neutral-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <AdminDashboard />
    </div>
  );
}
