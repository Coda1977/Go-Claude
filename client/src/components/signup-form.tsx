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

export function SignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={selectedTimezone} onValueChange={(value) => {
          setValue("timezone", value);
          setValue("timezone", value, { shouldValidate: true });
        }}>
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

      <div className="space-y-2">
        <Label htmlFor="goals">Leadership Goals (1-3 goals, one per line)</Label>
        <div className="space-y-3">
          {goalInputs.map((goal, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder={`Goal ${index + 1}`}
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
        <p className="text-sm text-gray-500">
          Enter up to 3 leadership goals. Each goal should be specific and actionable.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? "Starting Your Journey..." : "Start My Leadership Journey"}
      </button>

      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        You'll receive your personalized coaching content every Monday
      </p>
    </form>
  );
}
