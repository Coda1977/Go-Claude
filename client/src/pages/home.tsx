import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/signup-form";
import { CheckCircle, ArrowRight, Users, Target, Lightbulb } from "lucide-react";
import { GiRunningShoe } from "react-icons/gi";
import { apiRequest } from "@/lib/api";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user has admin privileges
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await apiRequest("GET", "/api/admin/stats");
        setIsAdmin(true);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, []);

  const handleAdminClick = () => {
    setLocation("/admin");
  };

  const features = [
    {
      number: "01",
      icon: Target,
      title: "Understand People",
      description: "Master the psychology of influence and learn to connect authentically with every personality type.",
    },
    {
      number: "02", 
      icon: Lightbulb,
      title: "Think Strategically",
      description: "Develop the mental frameworks that help you see patterns, anticipate challenges, and make decisions with confidence.",
    },
    {
      number: "03",
      icon: Users,
      title: "Inspire Action",
      description: "Transform your ability to motivate others, create psychological safety, and build teams that achieve extraordinary results.",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Set Your Goals",
      description: "Tell us about your leadership aspirations and the impact you want to create",
    },
    {
      number: 2,
      title: "Get Your Plan", 
      description: "AI creates a personalized 12-week journey tailored to your specific goals",
    },
    {
      number: 3,
      title: "Transform Weekly",
      description: "Receive expert coaching every Monday with actionable steps that build momentum",
    },
  ];

  const testimonials = [
    {
      quote: "This program fundamentally changed how I approach leadership. The weekly emails kept me accountable and the AI insights were surprisingly sophisticated.",
      author: "Sarah M.",
      role: "Engineering Manager"
    },
    {
      quote: "I went from avoiding difficult conversations to leading them with confidence. The psychological frameworks made all the difference.",
      author: "David K.", 
      role: "Team Lead"
    },
    {
      quote: "My team engagement scores increased 40% during the 12 weeks. This isn't just theory - it's practical wisdom that works.",
      author: "Maria L.",
      role: "Director of Operations"
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="container flex items-center justify-between py-4">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            GO
          </div>
          {isAdmin && (
            <Button 
              onClick={handleAdminClick}
              className="btn-secondary"
            >
              Admin Dashboard
            </Button>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section className="section-large pt-32">
        <div className="container">
          <div className="grid-2 items-center">
            <div className="fade-in-up">
              <h1 className="text-hero mb-8" style={{ color: 'var(--text-primary)' }}>
                Turn your intentions into 
                <span className="accent-yellow"> Impact</span>
              </h1>
              <p className="text-body mb-12">Get 12 Weeks of Personalized AI Coaching — Straight to Your Inbox</p>
              <div className="flex flex-col sm:flex-row gap-6">
                <a href="#signup" className="btn-primary">
                  Start Your Journey
                </a>
              </div>
            </div>
            <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="card text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-yellow)' }}>
                  <GiRunningShoe className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
                </div>
                <blockquote className="text-lg italic font-serif mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: '1.6' }}>
                  "Action may not always bring happiness, but there is no happiness without action."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section id="how-it-works" className="section bg-white">
        <div className="container">
          <div className="text-center mb-20">
            <h2 className="text-section mb-6">Your "Go" Journey</h2>
            <div className="section-divider"></div>
            <p className="text-body max-w-2xl mx-auto">
              Three simple steps to transform your leadership in 12 weeks
            </p>
          </div>
          <div className="grid-3">
            {steps.map((step, index) => (
              <div key={index} className="text-center fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: 'var(--accent-blue)' }}>
                  {step.number}
                </div>
                <h3 className="text-card mb-4">{step.title}</h3>
                <p className="text-body">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 mx-auto mt-8 accent-blue hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Signup Section */}
      <section id="signup" className="section-large bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-section mb-6">Let's Go</h2>
            <div className="section-divider"></div>
            <p className="text-body">
              Join leaders who've transformed their impact through personalized AI coaching
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="card" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
              <SignupForm />
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="section text-center">
        <div className="container">
          <div className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            GO
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Transform how you lead, starting today.
          </p>
        </div>
      </footer>
    </div>
  );
}