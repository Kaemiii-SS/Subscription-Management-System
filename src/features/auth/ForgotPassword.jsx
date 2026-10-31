import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '../../api/auth';
import { ROUTES } from '../../constants/routes';
import FormField from '../../components/ui/FormField';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-textPrimary tracking-tight">Forgot password?</h2>
        <p className="text-xs text-textSecondary mt-1">
          Hop will send a secure recovery link to your registered email address.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-sage border border-mint text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-textPrimary mb-1">Check your inbox</h3>
          <p className="text-xs text-textSecondary mb-6 max-w-xs mx-auto">
            If this email exists, a link was sent. Click the link in the message to set a new password.
          </p>

          <div className="p-3 bg-sage/50 border border-mint rounded-xl mb-6 text-left">
            <p className="text-[11px] text-primary font-bold">Hop's Demo Simulator:</p>
            <p className="text-[11px] text-textSecondary mt-0.5">
              Click below to proceed to the Reset Password screen with a valid demo token:
            </p>
            <Link
              to={`${ROUTES.RESET_PASSWORD}?token=demo_valid_token_xyz`}
              className="mt-2 inline-block text-xs font-bold text-primary underline"
            >
              Open Password Reset Page &rarr;
            </Link>
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-textSecondary hover:text-textPrimary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Registered Email" error={errors.email?.message} required>
            <div className="relative">
              <Mail className="w-4 h-4 text-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                {...register('email')}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-background border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textPrimary placeholder-textSecondary"
                placeholder="you@company.com"
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
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Reset Link with Hop</span>
              </>
            )}
          </button>

          <div className="pt-3 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-textSecondary hover:text-textPrimary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
