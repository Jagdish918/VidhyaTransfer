import React, { useEffect } from "react";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { useUserStore } from "../../store/useUserStore";
import { useUser } from "../../util/UserContext";
import { countries } from "../../util/countries";
import OnboardingStepper from "./OnboardingStepper";

const PersonalInfo = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { updatePersonalInfo, onboardingData } = useUserStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: onboardingData.personalInfo.name || "",
      email: onboardingData.personalInfo.email || "",
      age: onboardingData.personalInfo.age || "",
      country: onboardingData.personalInfo.country || "",
      bio: onboardingData.personalInfo.bio || "",
      role: onboardingData.personalInfo.role || "",
    },
  });

  useEffect(() => {
    // Sync email from auth context if not in store
    if (user?.email && !onboardingData.personalInfo.email) {
      setValue("email", user.email);
    }
    if (user?.name && !onboardingData.personalInfo.name) {
      setValue("name", user.name);
    }
  }, [user, setValue, onboardingData.personalInfo.email, onboardingData.personalInfo.name]);

  const onSubmit = async (data) => {
    try {
      // Update local store
      updatePersonalInfo(data);

      // Backend sync
      await axios.post("/onboarding/personal-info", data);

      toast.success("Personal info saved!");
      navigate("/onboarding/skills");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4 font-sans">
      <div className="max-w-[600px] mx-auto space-y-5">
        <OnboardingStepper />

        <div className="text-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <FaGraduationCap className="text-xl text-indigo-600" />
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">VidhyaTransfer</span>
          </div>
          <h2 className="mt-3 text-center text-2xl font-semibold text-slate-900 tracking-tight">
            Basic information
          </h2>
          <p className="mt-1 text-center text-sm text-slate-600">
            Tell us about yourself so we can personalize your experience.
          </p>
        </div>

        <div className="bg-dark-card p-6 shadow-card rounded-2xl border border-dark-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  className="appearance-none block w-full h-10 px-3 bg-white border border-dark-border rounded-lg shadow-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 focus:border-indigo-300 sm:text-sm transition-all"
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-red-400">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  readOnly
                  {...register("email", { required: "Email is required" })}
                  className="appearance-none block w-full h-10 px-3 bg-slate-50 border border-dark-border rounded-lg shadow-sm text-slate-600 cursor-not-allowed sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="age" className="block text-xs font-semibold text-slate-700 mb-2">
                  Age
                </label>
                <div className="mt-1">
                  <input
                    id="age"
                    type="number"
                    {...register("age", {
                      min: { value: 16, message: "Must be at least 16" },
                      max: { value: 100, message: "Must be under 100" }
                    })}
                    className="appearance-none block w-full h-10 px-3 bg-white border border-dark-border rounded-lg shadow-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 focus:border-indigo-300 sm:text-sm transition-all"
                    placeholder="25"
                  />
                  {errors.age && <p className="mt-1 text-xs font-bold text-red-400">{errors.age.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-xs font-semibold text-slate-700 mb-2">
                  Country
                </label>
                <div className="mt-1">
                  <select
                    id="country"
                    {...register("country", { required: "Country is required" })}
                    className="block w-full h-10 px-3 bg-white border border-dark-border rounded-lg shadow-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 focus:border-indigo-300 sm:text-sm transition-all appearance-none"
                  >
                    <option value="" className="bg-white text-slate-600">Select a country</option>
                    {countries.map((c) => (
                      <option key={c} value={c} className="bg-white text-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-1 text-xs font-bold text-red-400">{errors.country.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-slate-700 mb-2">
                Current Role/Title
              </label>
              <div className="mt-1">
                <input
                  id="role"
                  type="text"
                  {...register("role", { required: "Role is required" })}
                  className="appearance-none block w-full h-10 px-3 bg-white border border-dark-border rounded-lg shadow-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 focus:border-indigo-300 sm:text-sm transition-all"
                  placeholder="e.g. Product Designer, Software Engineer"
                />
                {errors.role && <p className="mt-1 text-xs font-bold text-red-400">{errors.role.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-semibold text-slate-700 mb-2">
                Short Bio
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  rows={3}
                  {...register("bio")}
                  className="appearance-none block w-full px-3 py-2.5 bg-white border border-dark-border rounded-lg shadow-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 focus:border-indigo-300 sm:text-sm resize-none transition-all"
                  placeholder="Briefly describe your interests and goals..."
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 flex justify-center items-center px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="text-sm font-medium text-slate-600 hover:text-indigo-700 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
