import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import FormField from '../../components/ui/FormField';
import { validatePasswordCriteria, isPasswordValid } from '../../api/auth';
import { Lock, Mail, User, Building, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    companyName: z.string().min(2, 'Company name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => isPasswordValid(data.password), {
    message: 'Password does not satisfy all complexity requirements',
    path: ['password'],
  });

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const passwordVal = watch('password') || '';
  const passwordCriteria = validatePasswordCriteria(passwordVal);

  const onSubmit = async (values) => {
    try {
      setServerError('');
      setFieldErrors({});
      setIsSubmitting(true);
      await signup(values);
      toast.success('Account created successfully! Welcome to Brightloop.');
      navigate(ROUTES.PORTAL_SUBSCRIPTIONS);
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setServerError(err.response?.data?.message || err.message || 'Signup failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white tracking-tight">Create your account</h2>
        <p className="text-xs text-[#d6c2b0] mt-1">
          Join Brightloop to purchase and manage subscriptions on self-service portal.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <FormField label="Full Name" labelClassName="text-[#e8d7c8] font-semibold" error={errors.name?.message} required>
          <div className="relative">
            <User className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              {...register('name')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="Alice Johnson"
            />
          </div>
        </FormField>

        <FormField label="Company Name" labelClassName="text-[#e8d7c8] font-semibold" error={errors.companyName?.message} required>
          <div className="relative">
            <Building className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              {...register('companyName')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="Acme Innovations Ltd"
            />
          </div>
        </FormField>

        <FormField
          label="Email address"
          labelClassName="text-[#e8d7c8] font-semibold"
          error={errors.email?.message || fieldErrors.email}
          required
        >
          <div className="relative">
            <Mail className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              {...register('email')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="alice@acme.com"
            />
          </div>
        </FormField>

        <FormField label="Password" labelClassName="text-[#e8d7c8] font-semibold" error={errors.password?.message} required>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              {...register('password')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="Create strong password"
            />
          </div>
        </FormField>

        {/* Live Password Criteria Checklist */}
        <div className="p-3 bg-[#120a06]/90 rounded-xl border border-[#3d2618] space-y-1.5 text-xs">
          <p className="font-bold text-[#e8d7c8] text-[11px] uppercase tracking-wider mb-1">
            Complexity Checklist:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.minLength ? 'text-emerald-400 font-bold' : 'text-[#8c7462]'
              }`}
            >
              {passwordCriteria.minLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-[#4d3221] shrink-0" />
              )}
              <span>More than 8 chars</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasUppercase ? 'text-emerald-400 font-bold' : 'text-[#8c7462]'
              }`}
            >
              {passwordCriteria.hasUppercase ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-[#4d3221] shrink-0" />
              )}
              <span>One uppercase letter</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasLowercase ? 'text-emerald-400 font-bold' : 'text-[#8c7462]'
              }`}
            >
              {passwordCriteria.hasLowercase ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-[#4d3221] shrink-0" />
              )}
              <span>One lowercase letter</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasSpecial ? 'text-emerald-400 font-bold' : 'text-[#8c7462]'
              }`}
            >
              {passwordCriteria.hasSpecial ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-[#4d3221] shrink-0" />
              )}
              <span>One special character</span>
            </div>
          </div>
        </div>

        <FormField label="Confirm Password" labelClassName="text-[#e8d7c8] font-semibold" error={errors.confirmPassword?.message} required>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="Confirm password"
            />
          </div>
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-[#3d2618] text-center text-xs text-[#d6c2b0] font-medium">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
