import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  timezone: z.string().min(1, "Please select your timezone"),
  goals: z.array(z.string().min(1, "Goal cannot be empty")).min(1, "At least one goal is required").max(3, "Maximum 3 goals allowed"),
  
  // Leadership Context Fields
  currentRole: z.enum(["IC", "Manager", "Director", "VP", "C-Level"], {
    errorMap: () => ({ message: "Please select your current role level" })
  }),
  teamSize: z.enum(["0", "1-5", "6-15", "16-50", "50+"], {
    errorMap: () => ({ message: "Please select your team size" })
  }),
  industry: z.enum([
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Consulting", "Government", "Non-Profit", "Other"
  ], {
    errorMap: () => ({ message: "Please select your industry" })
  }),
  yearsInLeadership: z.number().min(0, "Years cannot be negative").max(50, "Please enter a valid number"),
  workEnvironment: z.enum(["Remote", "Hybrid", "In-Person"], {
    errorMap: () => ({ message: "Please select your work environment" })
  }),
  organizationSize: z.enum(["Startup", "Small", "Medium", "Large", "Enterprise"]).optional(),
  leadershipChallenges: z.array(z.string()).optional()
});

type SignupForm = z.infer<typeof signupSchema>;

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "CET (Paris)" },
  { value: "Asia/Jerusalem", label: "IST (Jerusalem)" },
  { value: "Asia/Tokyo", label: "JST (Tokyo)" },
  { value: "Australia/Sydney", label: "AEST (Sydney)" },
  { value: "America/Toronto", label: "EST (Toronto)" },
  { value: "Europe/Berlin", label: "CET (Berlin)" },
];

const roleOptions = [
  { value: "IC", label: "Individual Contributor", description: "Technical expert, analyst, specialist" },
  { value: "Manager", label: "Team Manager", description: "Leading 1-15 people directly" },
  { value: "Director", label: "Director", description: "Leading multiple teams or functions" },
  { value: "VP", label: "VP/Senior Leader", description: "Executive leadership role" },
  { value: "C-Level", label: "C-Level Executive", description: "CEO, CTO, COO, etc." },
];

const teamSizeOptions = [
  { value: "0", label: "No Direct Reports", description: "Individual contributor or preparing to lead" },
  { value: "1-5", label: "Small Team (1-5)", description: "Leading a small, focused team" },
  { value: "6-15", label: "Mid-Size Team (6-15)", description: "Managing a department or large team" },
  { value: "16-50", label: "Large Team (16-50)", description: "Leading multiple teams or large department" },
  { value: "50+", label: "Enterprise Team (50+)", description: "Senior executive with broad organizational scope" },
];

const industryOptions = [
  { value: "Technology", label: "Technology", description: "Software, hardware, IT services" },
  { value: "Healthcare", label: "Healthcare", description: "Medical, pharmaceutical, biotech" },
  { value: "Finance", label: "Financial Services", description: "Banking, insurance, investment" },
  { value: "Education", label: "Education", description: "Academic institutions, training" },
  { value: "Manufacturing", label: "Manufacturing", description: "Production, industrial, supply chain" },
  { value: "Retail", label: "Retail & E-commerce", description: "Consumer goods, sales, marketing" },
  { value: "Consulting", label: "Consulting", description: "Professional services, advisory" },
  { value: "Government", label: "Government", description: "Public sector, military, non-profit" },
  { value: "Non-Profit", label: "Non-Profit", description: "Charitable organizations, NGOs" },
  { value: "Other", label: "Other Industry", description: "Not listed above" },
];

const workEnvironmentOptions = [
  { value: "Remote", label: "Fully Remote", description: "Team works entirely remotely" },
  { value: "Hybrid", label: "Hybrid", description: "Mix of remote and in-person work" },
  { value: "In-Person", label: "In-Person", description: "Team works primarily on-site" },
];

const organizationSizeOptions = [
  { value: "Startup", label: "Startup (1-50 employees)" },
  { value: "Small", label: "Small Company (51-200 employees)" },
  { value: "Medium", label: "Medium Company (201-1000 employees)" },
  { value: "Large", label: "Large Company (1001-5000 employees)" },
  { value: "Enterprise", label: "Enterprise (5000+ employees)" },
];

const commonChallenges = [
  "Effective communication with team members",
  "Delegating tasks and responsibilities",
  "Managing up to senior leadership",
  "Conflict resolution and difficult conversations",
  "Setting clear expectations and accountability",
  "Building team culture and engagement",
  "Strategic thinking and long-term planning",
  "Performance management and feedback",
  "Managing change and uncertainty",
  "Work-life balance and burnout prevention",
  "Cross-functional collaboration",
  "Hiring and talent development"
];

export function SignupForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      timezone: "",
      goals: [""],
      currentRole: undefined,
      teamSize: undefined,
      industry: undefined,
      yearsInLeadership: 0,
      workEnvironment: undefined,
      organizationSize: undefined,
      leadershipChallenges: []
    },
    mode: "onChange"
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const watchedValues = watch();

  // Navigation functions
  const canProceedToStep2 = () => {
    return watchedValues.email && 
           watchedValues.timezone && 
           watchedValues.currentRole && 
           watchedValues.teamSize &&
           watchedValues.industry &&
           watchedValues.yearsInLeadership !== undefined &&
           watchedValues.workEnvironment;
  };

  const canProceedToStep3 = () => {
    return canProceedToStep2();
  };

  // Goal management
  const addGoal = () => {
    if (watchedValues.goals && watchedValues.goals.length < 3) {
      setValue("goals", [...watchedValues.goals, ""]);
    }
  };

  const removeGoal = (index: number) => {
    if (watchedValues.goals && watchedValues.goals.length > 1) {
      const newGoals = watchedValues.goals.filter((_, i) => i !== index);
      setValue("goals", newGoals);
    }
  };

  const updateGoal = (index: number, value: string) => {
    if (watchedValues.goals) {
      const newGoals = [...watchedValues.goals];
      newGoals[index] = value;
      setValue("goals", newGoals);
    }
  };

  // Challenge management
  const toggleChallenge = (challenge: string) => {
    const current = watchedValues.leadershipChallenges || [];
    const isSelected = current.includes(challenge);
    
    if (isSelected) {
      setValue("leadershipChallenges", current.filter(c => c !== challenge));
    } else {
      setValue("leadershipChallenges", [...current, challenge]);
    }
  };

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast({
        title: "Welcome aboard!",
        description: "Your account has been created successfully. You'll receive your first coaching email within 24 hours.",
      });

      setLocation("/success");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { step: 1, title: "Basic Info & Role", icon: "👤" },
    { step: 2, title: "Experience", icon: "💼" },
    { step: 3, title: "Goals & Challenges", icon: "🎯" }
  ];

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-12">
        {steps.map((item, index) => (
          <div key={item.step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${currentStep >= item.step 
                    ? 'bg-accent-blue text-white shadow-lg scale-110' 
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
                style={{
                  backgroundColor: currentStep >= item.step ? 'var(--accent-blue)' : undefined,
                  color: currentStep >= item.step ? 'white' : undefined
                }}
              >
                {item.step}
              </div>
              <span 
                className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                  currentStep >= item.step ? 'text-accent-blue' : 'text-gray-400'
                }`}
                style={{ color: currentStep >= item.step ? 'var(--accent-blue)' : undefined }}
              >
                {item.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex items-center mx-4">
                <div
                  className={`h-0.5 w-8 transition-colors duration-300 ${
                    currentStep > item.step ? 'bg-accent-blue' : 'bg-gray-200'
                  }`}
                  style={{ backgroundColor: currentStep > item.step ? 'var(--accent-blue)' : undefined }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Info & Role Context */}
        {currentStep === 1 && (
          <div className="space-y-8 fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent-yellow" style={{ backgroundColor: 'var(--accent-yellow)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-card mb-3" style={{ color: 'var(--text-primary)' }}>Let's get to know you</h3>
              <p className="text-body max-w-md mx-auto">We'll personalize your leadership coaching based on your role and experience</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </Label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="your.email@company.com"
                  className="bg-white border-gray-200 focus:border-accent-blue focus:ring-accent-blue"
                  style={{
                    '--tw-ring-color': 'var(--accent-blue)',
                    borderColor: errors.email ? 'var(--error-color)' : undefined
                  } as any}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="timezone" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Timezone
                </Label>
                <Select value={watchedValues.timezone} onValueChange={(value) => setValue("timezone", value)}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-sm text-red-600">{errors.timezone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Current Role Level
                  </Label>
                  <Select value={watchedValues.currentRole} onValueChange={(value) => setValue("currentRole", value as any)}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currentRole && (
                    <p className="text-sm text-red-600">{errors.currentRole.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Team Size
                  </Label>
                  <Select value={watchedValues.teamSize} onValueChange={(value) => setValue("teamSize", value as any)}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamSizeOptions.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          <div>
                            <div className="font-medium">{size.label}</div>
                            <div className="text-xs text-gray-500">{size.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.teamSize && (
                    <p className="text-sm text-red-600">{errors.teamSize.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Industry
                  </Label>
                  <Select value={watchedValues.industry} onValueChange={(value) => setValue("industry", value as any)}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          <div>
                            <div className="font-medium">{industry.label}</div>
                            <div className="text-xs text-gray-500">{industry.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-red-600">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="yearsInLeadership" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Years in Leadership
                  </Label>
                  <Input
                    {...register("yearsInLeadership", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="50"
                    placeholder="3"
                    className="bg-white border-gray-200"
                  />
                  {errors.yearsInLeadership && (
                    <p className="text-sm text-red-600">{errors.yearsInLeadership.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Work Environment
                </Label>
                <Select value={watchedValues.workEnvironment} onValueChange={(value) => setValue("workEnvironment", value as any)}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select work environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {workEnvironmentOptions.map((env) => (
                      <SelectItem key={env.value} value={env.value}>
                        <div>
                          <div className="font-medium">{env.label}</div>
                          <div className="text-xs text-gray-500">{env.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workEnvironment && (
                  <p className="text-sm text-red-600">{errors.workEnvironment.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Organization Size (Optional)
                </Label>
                <Select value={watchedValues.organizationSize} onValueChange={(value) => setValue("organizationSize", value as any)}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select organization size" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationSizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button 
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2()}
                className="px-8"
                style={{ backgroundColor: 'var(--accent-blue)' }}
              >
                Continue to Experience
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Experience & Work Environment */}
        {currentStep === 2 && (
          <div className="space-y-8 fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent-blue" style={{ backgroundColor: 'var(--accent-blue)' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-card mb-3" style={{ color: 'var(--text-primary)' }}>Your experience & work environment</h3>
              <p className="text-body max-w-md mx-auto">Help us tailor coaching to your specific situation and experience level</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Experience Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Role:</span> 
                    <span className="ml-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {roleOptions.find(r => r.value === watchedValues.currentRole)?.label || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Team Size:</span> 
                    <span className="ml-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {teamSizeOptions.find(t => t.value === watchedValues.teamSize)?.label || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Industry:</span> 
                    <span className="ml-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {industryOptions.find(i => i.value === watchedValues.industry)?.label || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Experience:</span> 
                    <span className="ml-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {watchedValues.yearsInLeadership} years
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button 
                type="button"
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1 mr-4"
              >
                Back to Step 1
              </Button>
              <Button 
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3()}
                className="flex-1"
              >
                Continue to Goals
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Goals & Challenges */}
        {currentStep === 3 && (
          <div className="space-y-8 fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent-yellow" style={{ backgroundColor: 'var(--accent-yellow)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--text-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-card mb-3" style={{ color: 'var(--text-primary)' }}>Your leadership goals & challenges</h3>
              <p className="text-body max-w-md mx-auto">Define what you want to achieve and areas where you need support</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Leadership Goals (1-3)
                  </Label>
                  {watchedValues.goals && watchedValues.goals.length < 3 && (
                    <Button 
                      type="button" 
                      onClick={addGoal}
                      variant="outline"
                      size="sm"
                      className="text-accent-blue border-accent-blue hover:bg-accent-blue hover:text-white"
                    >
                      + Add Goal
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {watchedValues.goals?.map((goal, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-1">
                        <Textarea
                          value={goal}
                          onChange={(e) => updateGoal(index, e.target.value)}
                          placeholder={`Goal ${index + 1}: e.g., "Improve my delegation skills to better empower my team"`}
                          className="min-h-[80px] bg-white border-gray-200 focus:border-accent-blue focus:ring-accent-blue resize-none"
                          style={{
                            '--tw-ring-color': 'var(--accent-blue)'
                          } as any}
                        />
                      </div>
                      {watchedValues.goals && watchedValues.goals.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeGoal(index)}
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.goals && (
                  <p className="text-sm text-red-600">{errors.goals.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Leadership Challenges (Optional)
                </Label>
                <p className="text-sm text-gray-600">Select areas where you'd like focused coaching support</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commonChallenges.map((challenge) => (
                    <div
                      key={challenge}
                      onClick={() => toggleChallenge(challenge)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${(watchedValues.leadershipChallenges || []).includes(challenge)
                          ? 'border-accent-blue bg-blue-50 text-accent-blue'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      style={{
                        borderColor: (watchedValues.leadershipChallenges || []).includes(challenge) ? 'var(--accent-blue)' : undefined,
                        backgroundColor: (watchedValues.leadershipChallenges || []).includes(challenge) ? 'rgba(59, 130, 246, 0.1)' : undefined,
                        color: (watchedValues.leadershipChallenges || []).includes(challenge) ? 'var(--accent-blue)' : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{challenge}</span>
                        {(watchedValues.leadershipChallenges || []).includes(challenge) && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5 text-accent-blue" style={{ color: 'var(--accent-blue)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      You'll receive your personalized coaching content every Monday at 9 AM in your timezone
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Your first email will arrive within 24 hours with a customized action plan based on your responses
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button 
                type="button"
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="flex-1 mr-4"
              >
                Back to Experience
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                style={{ backgroundColor: 'var(--accent-blue)' }}
              >
                {isSubmitting ? 'Creating Account...' : 'Start My Leadership Journey'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}