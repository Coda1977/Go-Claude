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
  "Giving constructive feedback",
  "Having difficult conversations",
  "Delegating effectively", 
  "Managing up to senior leadership",
  "Building team engagement",
  "Leading through change",
  "Developing others",
  "Strategic thinking and planning",
  "Cross-functional collaboration",
  "Remote/hybrid team management"
];

export function SignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      timezone: "",
      goals: [],
      currentRole: undefined,
      teamSize: undefined,
      industry: undefined,
      yearsInLeadership: 1,
      workEnvironment: undefined,
      organizationSize: undefined,
      leadershipChallenges: [],
    },
  });

  const [goalInputs, setGoalInputs] = useState([""]);

  const addGoal = () => {
    if (goalInputs.length < 3) {
      setGoalInputs([...goalInputs, ""]);
    }
  };

  const removeGoal = (index: number) => {
    if (goalInputs.length > 1) {
      const newGoals = goalInputs.filter((_, i) => i !== index);
      setGoalInputs(newGoals);
      setValue("goals", newGoals.filter(goal => goal.trim() !== ""));
    }
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goalInputs];
    newGoals[index] = value;
    setGoalInputs(newGoals);
    setValue("goals", newGoals.filter(goal => goal.trim() !== ""));
  };

  // Auto-detect timezone on component mount
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matchingTimezone = timezones.find(tz => tz.value === detectedTimezone);
    if (matchingTimezone) {
      setValue("timezone", detectedTimezone);
    }
  }, [setValue]);

  const selectedTimezone = watch("timezone");
  const selectedRole = watch("currentRole");
  const selectedTeamSize = watch("teamSize");
  const selectedIndustry = watch("industry");
  const selectedWorkEnvironment = watch("workEnvironment");
  const selectedOrgSize = watch("organizationSize");
  const yearsInLeadership = watch("yearsInLeadership");

  const toggleChallenge = (challenge: string) => {
    const newChallenges = selectedChallenges.includes(challenge)
      ? selectedChallenges.filter(c => c !== challenge)
      : [...selectedChallenges, challenge];
    setSelectedChallenges(newChallenges);
    setValue("leadershipChallenges", newChallenges);
  };

  const canProceedToStep2 = () => {
    return watch("email") && watch("currentRole") && watch("teamSize") && watch("industry");
  };

  const canProceedToStep3 = () => {
    return watch("yearsInLeadership") && watch("workEnvironment") && watch("timezone");
  };

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/signup", data);
      
      toast({
        title: "Welcome to Go Leadership!",
        description: "Your personalized coaching journey has begun!",
      });
      
      // Redirect to success page
      setLocation("/success");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-12">
        {[
          { step: 1, label: "Context" },
          { step: 2, label: "Experience" },
          { step: 3, label: "Goals" }
        ].map((item, index) => (
          <div key={item.step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  item.step <= currentStep
                    ? 'bg-accent-blue text-white shadow-lg'
                    : item.step === currentStep + 1
                    ? 'bg-accent-yellow text-text-primary shadow-md'
                    : 'bg-gray-200 text-gray-500'
                }`}
                style={{
                  backgroundColor: item.step <= currentStep ? 'var(--accent-blue)' : 
                                   item.step === currentStep + 1 ? 'var(--accent-yellow)' : undefined,
                  color: item.step <= currentStep ? 'white' : 
                         item.step === currentStep + 1 ? 'var(--text-primary)' : undefined
                }}
              >
                {item.step <= currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  item.step
                )}
              </div>
              <span className={`text-xs font-medium mt-2 transition-colors duration-300 ${
                item.step <= currentStep ? 'text-accent-blue' : 'text-gray-500'
              }`} style={{
                color: item.step <= currentStep ? 'var(--accent-blue)' : undefined
              }}>
                {item.label}
              </span>
            </div>
            {index < 2 && (
              <div className="flex items-center mx-4">
                <div
                  className={`h-0.5 w-16 transition-all duration-500 ${
                    item.step < currentStep ? 'bg-accent-blue' : 'bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: item.step < currentStep ? 'var(--accent-blue)' : undefined
                  }}
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
              <h3 className="text-card mb-3" style={{ color: 'var(--text-primary)' }}>Tell us about your leadership context</h3>
              <p className="text-body max-w-md mx-auto">This helps us personalize your coaching experience to your specific role and situation</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${
                    errors.email 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-gray-200 focus:border-accent-blue hover:border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Current Role Level</Label>
                <Select value={selectedRole} onValueChange={(value) => setValue("currentRole", value as any)}>
                  <SelectTrigger className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${
                    errors.currentRole 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-gray-200 focus:border-accent-blue hover:border-gray-300"
                  }`}>
                    <SelectValue placeholder="Select your current role level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl">
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="py-4 px-4 hover:bg-gray-50">
                        <div>
                          <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{role.label}</div>
                          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currentRole && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.currentRole.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Team Size</Label>
                <Select value={selectedTeamSize} onValueChange={(value) => setValue("teamSize", value as any)}>
                  <SelectTrigger className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${
                    errors.teamSize 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-gray-200 focus:border-accent-blue hover:border-gray-300"
                  }`}>
                    <SelectValue placeholder="How many people do you lead?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl">
                    {teamSizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="py-4 px-4 hover:bg-gray-50">
                        <div>
                          <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{size.label}</div>
                          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{size.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamSize && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.teamSize.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Industry</Label>
                <Select value={selectedIndustry} onValueChange={(value) => setValue("industry", value as any)}>
                  <SelectTrigger className={`h-14 text-base rounded-xl border-2 transition-all duration-200 ${
                    errors.industry 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-gray-200 focus:border-accent-blue hover:border-gray-300"
                  }`}>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl">
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value} className="py-4 px-4 hover:bg-gray-50">
                        <div>
                          <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{industry.label}</div>
                          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{industry.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.industry.message}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2()}
                  className={`btn-primary w-full transition-all duration-300 ${
                    !canProceedToStep2() 
                      ? 'opacity-50 cursor-not-allowed transform-none' 
                      : 'hover:transform hover:scale-105'
                  }`}
                >
                  Continue to Experience & Environment
                  <svg className="w-5 h-5 ml-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="yearsInLeadership">Years in Leadership</Label>
              <Input
                id="yearsInLeadership"
                type="number"
                min="0"
                max="50"
                placeholder="Years of leadership experience"
                {...register("yearsInLeadership", { valueAsNumber: true })}
                className={errors.yearsInLeadership ? "border-red-500" : ""}
              />
              {errors.yearsInLeadership && (
                <p className="text-sm text-red-500">{errors.yearsInLeadership.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Work Environment</Label>
              <Select value={selectedWorkEnvironment} onValueChange={(value) => setValue("workEnvironment", value as any)}>
                <SelectTrigger className={errors.workEnvironment ? "border-red-500" : ""}>
                  <SelectValue placeholder="How does your team work?" />
                </SelectTrigger>
                <SelectContent>
                  {workEnvironmentOptions.map((env) => (
                    <SelectItem key={env.value} value={env.value}>
                      <div>
                        <div className="font-medium">{env.label}</div>
                        <div className="text-sm text-gray-500">{env.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workEnvironment && (
                <p className="text-sm text-red-500">{errors.workEnvironment.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Organization Size (Optional)</Label>
              <Select value={selectedOrgSize} onValueChange={(value) => setValue("organizationSize", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization size" />
                </SelectTrigger>
                <SelectContent>
                  {organizationSizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={selectedTimezone} onValueChange={(value) => setValue("timezone", value)}>
                <SelectTrigger className={errors.timezone ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-red-500">{errors.timezone.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                Back
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
              <p className="text-body max-w-md mx-auto">What do you want to achieve in the next 12 weeks?</p>
            </div>

            <div className="space-y-8">

            <div className="space-y-2">
              <Label htmlFor="goals">Leadership Goals (1-3 specific goals)</Label>
              <div className="space-y-3">
                {goalInputs.map((goal, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Goal ${index + 1}: e.g., "Give more constructive feedback to my team"`}
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      className={errors.goals ? "border-red-500" : ""}
                    />
                    {goalInputs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeGoal(index)}
                        className="shrink-0"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                {goalInputs.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addGoal}
                    className="w-full"
                  >
                    Add Another Goal
                  </Button>
                )}
              </div>
              {errors.goals && (
                <p className="text-sm text-red-500">{errors.goals.message}</p>
              )}
            </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Common Leadership Challenges</Label>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Select any challenges you're currently facing. This helps us prioritize relevant coaching content.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {commonChallenges.map((challenge) => (
                    <button
                      key={challenge}
                      type="button"
                      onClick={() => toggleChallenge(challenge)}
                      className={`group p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        selectedChallenges.includes(challenge)
                          ? 'border-accent-blue bg-blue-50 shadow-md transform scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: selectedChallenges.includes(challenge) ? 'var(--accent-blue)' : undefined
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all duration-200 ${
                            selectedChallenges.includes(challenge)
                              ? 'bg-accent-blue border-accent-blue'
                              : 'border-gray-300 group-hover:border-gray-400'
                          }`}
                          style={{
                            backgroundColor: selectedChallenges.includes(challenge) ? 'var(--accent-blue)' : undefined,
                            borderColor: selectedChallenges.includes(challenge) ? 'var(--accent-blue)' : undefined
                          }}
                        >
                          {selectedChallenges.includes(challenge) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-200 ${
                          selectedChallenges.includes(challenge) 
                            ? 'text-accent-blue' 
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`} style={{
                          color: selectedChallenges.includes(challenge) ? 'var(--accent-blue)' : undefined
                        }}>
                          {challenge}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedChallenges.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-accent-yellow bg-opacity-20 border border-accent-yellow border-opacity-30" style={{
                    backgroundColor: 'rgba(255, 214, 10, 0.1)',
                    borderColor: 'rgba(255, 214, 10, 0.3)'
                  }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedChallenges.length} challenge{selectedChallenges.length > 1 ? 's' : ''} selected - we'll prioritize these in your coaching
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary flex-1 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary flex-2 transition-all duration-300 relative overflow-hidden ${
                    isSubmitting 
                      ? 'opacity-90 cursor-wait' 
                      : 'hover:transform hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6z"></path>
                      </svg>
                      Starting Your Journey...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Start My Leadership Journey
                      <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gray-50 border-l-4 border-accent-blue" style={{
                borderLeftColor: 'var(--accent-blue)'
              }}>
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
          </div>
        )}
      </form>
    </div>
  );
}
