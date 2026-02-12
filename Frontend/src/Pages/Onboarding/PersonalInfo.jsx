import React, { useEffect } from "react";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { useUserStore } from "../../store/useUserStore";
import { useUser } from "../../util/UserContext";
import { countries } from "../../util/countries";

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

      // Backend sync (try registered first)
      try {
        await axios.post("/onboarding/registered/personal-info", data);
      } catch (err) {
        try {
          await axios.post("/onboarding/personal-info", data);
        } catch (innerErr) {
          console.warn("Backend sync failed, proceeding with local state", innerErr);
        }
      }

      toast.success("Personal info saved!");
      navigate("/onboarding/skills");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Header */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center">
              <FaGraduationCap className="text-[28px] text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-gray-800 font-sans">SkillSwap</span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Tell us about yourself
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Step 1 of 3: Personal Information
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Full name is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  readOnly
                  {...register("email", { required: "Email is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
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
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="25"
                  />
                  {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <div className="mt-1">
                  <select
                    id="country"
                    {...register("country", { required: "Country is required" })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                  >
                    <option value="">Select a country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Current Role/Title
              </label>
              <div className="mt-1">
                <input
                  id="role"
                  type="text"
                  {...register("role", { required: "Role is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Product Designer, Software Engineer"
                />
                {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Short Bio
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  rows={3}
                  {...register("bio")}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                  placeholder="Briefly describe your interests and goals..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </button>
            </div>

            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  // Assuming logout logic or just back to landing
                  window.location.href = "/login"; // or trigger logout
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Back to Login
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Step 1 of 3</span>
              </div>
            </div>
            <div className="mt-4 flex gap-1 justify-center">
              <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
              <div className="h-1.5 w-16 bg-gray-200 rounded-full"></div>
              <div className="h-1.5 w-16 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
