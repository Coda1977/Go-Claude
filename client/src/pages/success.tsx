import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, Mail, Calendar, TrendingUp, ArrowLeft } from "lucide-react";

export default function Success() {
  const [, setLocation] = useLocation();

  const handleBackToHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-go-neutral-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-20 h-20 bg-go-accent rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-go-neutral-800">Welcome to Go Leadership!</h1>
          <p className="text-lg text-go-neutral-500">
            You're all set! Check your email for your personalized welcome message and first action item.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-go-neutral-800">What happens next?</h3>
          <ul className="text-left space-y-3 text-sm text-go-neutral-600">
            <li className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-go-primary mt-0.5 flex-shrink-0" />
              <span>You'll receive a welcome email with AI-analyzed feedback on your goals</span>
            </li>
            <li className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-go-primary mt-0.5 flex-shrink-0" />
              <span>Every Monday at 9am (your time), you'll get a new coaching email</span>
            </li>
            <li className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-go-primary mt-0.5 flex-shrink-0" />
              <span>Track your progress over 12 weeks of structured leadership development</span>
            </li>
          </ul>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleBackToHome}
          className="text-go-primary hover:text-go-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Homepage
        </Button>
      </div>
    </div>
  );
}
