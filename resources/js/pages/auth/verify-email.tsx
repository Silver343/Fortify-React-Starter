// Components
import { destroy } from '@actions/Laravel/Fortify/Http/Controllers/AuthenticatedSessionController';
import { store } from '@actions/Laravel/Fortify/Http/Controllers/EmailVerificationNotificationController';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { submit, processing } = useForm({});

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        submit(store());
    };

    return (
        <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Resend verification email
                </Button>

                <TextLink href={destroy()} className="mx-auto block text-sm">
                    Log out
                </TextLink>
            </form>
        </AuthLayout>
    );
}
