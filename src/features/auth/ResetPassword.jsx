import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi, validatePasswordCriteria, isPasswordValid } from '../../api/auth';
import { ROUTES } from '../../constants/routes';
import FormField from '../../components/ui/FormField';
import { Lock, Check, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const resetSchema = z
  .object({
    newPassword: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => isPasswordValid(data.newPassword), {
    message: 'Password does not meet complexity criteria',
    path: ['newPassword'],
  });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  });

  const passwordVal = watch('newPassword') || '';
  const passwordCriteria = validatePasswordCriteria(passwordVal);

  if (!token || token === 'expired') {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-coral/20 border border-coral text-coral-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-textPrimary mb-1">Reset link expired or invalid</h3>
        <p className="text-xs text-textSecondary mb-6 leading-relaxed">
          This password reset link has expired for your security. Please request a new link to proceed.
        </p>
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-sm"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ newPassword }) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      await authApi.resetPassword({ token, newPassword });
      setIsSuccess(true);
      toast.success('Your password has been reset successfully!');
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-sage border border-mint text-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-textPrimary mb-1">Password updated!</h3>
        <p className="text-xs text-textSecondary mb-6">
          Your new password has been saved. You can now sign in using your updated credentials.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-[#15803d] rounded-xl shadow-sm"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-textPrimary tracking-tight">Set new password</h2>
        <p className="text-xs text-textSecondary mt-1">
          Choose a secure password meeting all enterprise security standards.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-xl bg-coral/10 border border-coral/30 text-xs text-coral-700 font-semibold">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="New Password" error={errors.newPassword?.message} required>
          <div className="relative">
            <Lock className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              {...register('newPassword')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textPrimary placeholder-textSecondary"
              placeholder="New strong password"
            />
          </div>
        </FormField>

        {/* Live Password Criteria Checklist */}
        <div className="p-3 bg-background rounded-xl border border-border space-y-1.5 text-xs">
          <p className="font-bold text-textPrimary text-[11px] uppercase tracking-wider mb-1">
            Complexity checklist:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.minLength ? 'text-primary font-bold' : 'text-textSecondary'
              }`}
            >
              {passwordCriteria.minLength ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
              )}
              <span>More than 8 chars</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasUppercase ? 'text-primary font-bold' : 'text-textSecondary'
              }`}
            >
              {passwordCriteria.hasUppercase ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
              )}
              <span>One uppercase letter</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasLowercase ? 'text-primary font-bold' : 'text-textSecondary'
              }`}
            >
              {passwordCriteria.hasLowercase ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
              )}
              <span>One lowercase letter</span>
            </div>

            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                passwordCriteria.hasSpecial ? 'text-primary font-bold' : 'text-textSecondary'
              }`}
            >
              {passwordCriteria.hasSpecial ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
              )}
              <span>One special character</span>
            </div>
          </div>
        </div>

        <FormField label="Confirm New Password" error={errors.confirmPassword?.message} required>
          <div className="relative">
            <Lock className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textPrimary placeholder-textSecondary"
              placeholder="Confirm new password"
            />
          </div>
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-[#15803d] disabled:bg-primary/50 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <span>Update Password & Sign In</span>
          )}
        </button>
      </form>
    </div>
  );
}
