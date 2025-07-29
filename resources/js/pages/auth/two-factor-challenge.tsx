import { store } from '@actions/Laravel/Fortify/Http/Controllers/TwoFactorAuthenticatedSessionController';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type TwoFactorChallengeForm = {
    code: string;
    recovery_code: string;
};

export default function TwoFactorChallenge() {
    const [recovery, setRecovery] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { data, setData, submit, processing, errors, reset, clearErrors } = useForm<TwoFactorChallengeForm>({
        code: '',
        recovery_code: '',
    });

    const toggleRecovery = () => {
        setRecovery(!recovery);
        reset('code', 'recovery_code');
        // Focus the input after toggle
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        submit(store());
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication"
            description={recovery ? 'Enter one of your recovery codes' : 'Enter the code from your authenticator app'}
        >
            <Head title="Two-Factor Authentication" />

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {!recovery ? (
                        <div className="grid gap-2">
                            <Label htmlFor="code">Authentication Code</Label>
                            <Input
                                ref={inputRef}
                                id="code"
                                type="text"
                                inputMode="numeric"
                                name="code"
                                value={data.code}
                                onChange={(e) => {
                                    setData('code', e.target.value);
                                    reset('recovery_code');
                                    clearErrors();
                                }}
                                autoFocus
                                autoComplete="one-time-code"
                                placeholder="123456"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                className={`text-center text-lg tracking-wider`}
                            />
                            <InputError message={errors.code} />
                            <p className="text-center text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="recovery_code">Recovery Code</Label>
                            <Input
                                ref={inputRef}
                                id="recovery_code"
                                type="text"
                                name="recovery_code"
                                value={data.recovery_code}
                                onChange={(e) => {
                                    setData('recovery_code', e.target.value);
                                    reset('code');
                                    clearErrors();
                                }}
                                autoFocus
                                autoComplete="one-time-code"
                                placeholder="abcd-efgh-ijkl"
                                className="text-center font-mono"
                            />
                            <InputError message={errors.recovery_code} />
                            <p className="text-center text-xs text-muted-foreground">Enter one of your saved recovery codes</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button type="submit" className="w-full" disabled={processing || (recovery && !data.recovery_code)}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {recovery ? 'Verify with recovery code' : 'Verify code'}
                        </Button>

                        <div className="text-center">
                            <Button onClick={toggleRecovery} variant="ghost" size="sm">
                                {recovery ? 'Use authentication code' : 'Use a recovery code'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}
