import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import FormField from '../../components/ui/FormField';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@brightloop.com',
      password: 'Password123!',
    },
  });

  const onSubmit = async (values) => {
    try {
      setServerError('');
      setIsSubmitting(true);
      const data = await login(values);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (data.user.role === ROLES.CUSTOMER) {
        navigate(ROUTES.PORTAL_SUBSCRIPTIONS);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-[#d6c2b0] mt-1">
          Hop is ready to assist with your subscriptions, plans, and invoices.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email address" labelClassName="text-[#e8d7c8] font-semibold" error={errors.email?.message} required>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#d99b50] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              {...register('email')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#120a06]/90 border border-[#3d2618] rounded-xl focus:outline-none focus:border-[#d99b50] focus:ring-2 focus:ring-[#d99b50]/20 text-white placeholder-[#8c7462] font-medium"
              placeholder="you@brightloop.com"
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
              placeholder="••••••••"
            />
          </div>
        </FormField>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#d6c2b0] font-medium">
            <input
              type="checkbox"
              defaultChecked
              className="w-3.5 h-3.5 rounded text-emerald-500 border-[#3d2618] bg-[#120a06] focus:ring-emerald-400 cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Sign In with Hop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#3d2618] text-center text-xs text-[#d6c2b0] font-medium">
        Don't have an account yet?{' '}
        <Link to={ROUTES.SIGNUP} className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline">
          Create customer account
        </Link>
      </div>
    </div>
  );
}
