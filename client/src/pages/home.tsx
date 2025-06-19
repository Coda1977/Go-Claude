import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignupForm } from "@/components/signup-form";
import { CheckCircle, Brain, Calendar, Trophy, ArrowUp, Mail, Users, TrendingUp, Percent } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Personalization",
      description: "Advanced AI analyzes your goals and creates personalized weekly action items that build upon each other.",
    },
    {
      icon: Calendar,
      title: "Structured 12-Week Program", 
      description: "Receive perfectly timed emails every Monday at 9am in your timezone, keeping you accountable and motivated.",
    },
    {
      icon: Trophy,
      title: "Proven Results",
      description: "Based on behavioral psychology and leadership best practices, with measurable progress tracking.",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Share Your Goals",
      description: "Tell us about your leadership aspirations and current challenges",
    },
    {
      number: 2,
      title: "AI Analysis",
      description: "Our AI analyzes your goals and creates a personalized 12-week plan",
    },
    {
      number: 3,
      title: "Weekly Coaching",
      description: "Receive personalized emails with specific action items every Monday",
    },
    {
      number: 4,
      title: "Transform",
      description: "Build lasting leadership habits and achieve your goals",
      accent: true,
    },
  ];

  return (
    <div className="min-h-screen bg-go-neutral-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-go-primary rounded-lg flex items-center justify-center">
                <ArrowUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-go-neutral-800">Go Leadership</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-go-neutral-500 hover:text-go-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-go-neutral-500 hover:text-go-primary transition-colors">How It Works</a>
              <Button variant="ghost" onClick={handleAdminClick} className="text-go-neutral-500 hover:text-go-primary">
                Admin
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="go-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Transform Your Leadership Journey in 12 Weeks
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Receive personalized, AI-powered weekly coaching emails that turn your leadership goals into actionable progress. Join thousands of leaders who've elevated their impact.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-go-accent" />
                  <span>12-week structured program</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-go-accent" />
                  <span>AI-personalized coaching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-go-accent" />
                  <span>Weekly action items</span>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-go-neutral-800 mb-6">Start Your Leadership Journey</h2>
                <SignupForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-go-neutral-800 mb-4">Why Choose Go Leadership?</h2>
            <p className="text-xl text-go-neutral-500 max-w-3xl mx-auto">
              Our AI-powered coaching system combines behavioral psychology with personalized guidance to accelerate your leadership development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-go-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-go-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-go-neutral-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-go-neutral-800 mb-4">How It Works</h2>
            <p className="text-xl text-go-neutral-500">Simple, effective, and tailored to your leadership journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 ${step.accent ? 'bg-go-accent' : 'bg-go-primary'} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold`}>
                  {step.number}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-go-neutral-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Email Template Preview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmailPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            {/* Email Template Content */}
            <div className="p-6 bg-gray-50">
              <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Email Header */}
                <div className="go-gradient p-6 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <ArrowUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-lg">Go Leadership</span>
                  </div>
                  <h1 className="text-2xl font-bold">Welcome to Your Leadership Journey!</h1>
                </div>
                
                {/* Email Body */}
                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-gray-700 mb-4">Hi Sarah,</p>
                    <p className="text-gray-700 mb-4">
                      I've carefully analyzed your leadership goals, and I'm impressed by your commitment to developing authentic leadership while building stronger team relationships. Your focus on both personal growth and team dynamics shows real wisdom.
                    </p>
                  </div>
                  
                  {/* Action Item Box */}
                  <div className="bg-blue-50 border-l-4 border-go-primary p-4 rounded">
                    <h3 className="font-semibold text-go-primary mb-2">Your Week 1 Action Item:</h3>
                    <p className="text-gray-700">
                      Schedule three 15-minute one-on-one conversations with team members this week. Ask them one simple question: "What's one thing I could do to better support your success?" Listen actively and take notes.
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-700 mb-4">
                      This first step aligns perfectly with your goal of building stronger relationships while developing your authentic leadership voice. You'll be surprised how much you learn from these conversations.
                    </p>
                    <p className="text-gray-700">
                      I'll check in with you next Monday with your Week 2 action item. You've got this!
                    </p>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Best regards,<br />
                      <strong>Your AI Leadership Coach</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-go-neutral-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-go-primary rounded-lg flex items-center justify-center">
                  <ArrowUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">Go Leadership</span>
              </div>
              <p className="text-gray-300">
                Transform your leadership journey with AI-powered personalized coaching delivered weekly to your inbox.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Program</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
                <li>
                  <button 
                    onClick={() => setShowEmailPreview(true)} 
                    className="hover:text-white transition-colors text-left"
                  >
                    Email Examples
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Go Leadership. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
