import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Key, LoaderCircle, Shield } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Security',
        href: '/settings/two-factor',
    },
];

interface TwoFactorProps {
    twoFactorEnabled: boolean;
    twoFactorPending: boolean;
    twoFactorQrCode?: string;
    twoFactorSecretKey?: string;
    twoFactorRecoveryCodes?: string[];
}

export default function TwoFactor({
    twoFactorEnabled,
    twoFactorPending,
    twoFactorQrCode,
    twoFactorSecretKey,
    twoFactorRecoveryCodes,
}: TwoFactorProps) {
    const [showingQrCode, setShowingQrCode] = useState(twoFactorPending);
    const [showingRecoveryCodes, setShowingRecoveryCodes] = useState(false);

    const enableTwoFactorForm = useForm({});
    const disableTwoFactorForm = useForm({});
    const confirmTwoFactorForm = useForm({
        code: '',
    });
    const regenerateRecoveryCodesForm = useForm({});

    const enableTwoFactor = () => {
        enableTwoFactorForm.post(route('two-factor.enable'), {
            preserveScroll: true,
            onSuccess: () => setShowingQrCode(true),
        });
    };

    const confirmTwoFactor: FormEventHandler = (e) => {
        e.preventDefault();

        if (!confirmTwoFactorForm.data.code) {
            confirmTwoFactorForm.setError('code', 'The code field is required.');
            return;
        }

        confirmTwoFactorForm.post(route('two-factor.confirm'), {
            errorBag: 'confirmTwoFactorAuthentication',
            preserveScroll: true,
            onSuccess: () => {
                setShowingQrCode(false);
                setShowingRecoveryCodes(true);
            },
        });
    };

    const regenerateRecoveryCodes = () => {
        regenerateRecoveryCodesForm.post(route('two-factor.recovery-codes'), {
            preserveScroll: true,
            onSuccess: () => setShowingRecoveryCodes(true),
        });
    };

    const showRecoveryCodes = () => {
        setShowingRecoveryCodes(true);
    };

    const disableTwoFactor: FormEventHandler = (e) => {
        e.preventDefault();
        disableTwoFactorForm.delete(route('two-factor.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowingQrCode(false);
                setShowingRecoveryCodes(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Security" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Two-Factor Authentication"
                        description="Add additional security to your account using two-factor authentication."
                    />

                    <div className="space-y-6">
                        {!twoFactorEnabled && !twoFactorPending && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
                                    </p>
                                </div>

                                <Button onClick={enableTwoFactor} disabled={enableTwoFactorForm.processing} className="w-full sm:w-auto">
                                    {enableTwoFactorForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    Enable Two-Factor Authentication
                                </Button>
                            </div>
                        )}

                        {twoFactorPending && (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Two-factor authentication is partially set up but not yet confirmed. Please scan the QR code below and enter
                                        the verification code to complete the setup.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end">
                                    <Button onClick={disableTwoFactor} variant="outline" size="sm" disabled={disableTwoFactorForm.processing}>
                                        {disableTwoFactorForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Cancel Setup
                                    </Button>
                                </div>
                            </div>
                        )}

                        {twoFactorEnabled && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Shield className="h-5 w-5 text-green-600" />
                                    <p className="text-sm text-green-600">Two-factor authentication is enabled.</p>
                                </div>

                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                    <Button onClick={showRecoveryCodes} variant="outline" size="sm">
                                        <Key className="h-4 w-4" />
                                        Show Recovery Codes
                                    </Button>

                                    <Button
                                        onClick={regenerateRecoveryCodes}
                                        variant="outline"
                                        size="sm"
                                        disabled={regenerateRecoveryCodesForm.processing}
                                    >
                                        {regenerateRecoveryCodesForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Regenerate Recovery Codes
                                    </Button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive">Disable Two-Factor Authentication</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Are you sure you want to disable two-factor authentication?</DialogTitle>
                                            <DialogDescription>
                                                This will remove the extra security layer from your account. You can re-enable it at any time.
                                            </DialogDescription>
                                            <form className="space-y-6" onSubmit={disableTwoFactor}>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">Cancel</Button>
                                                    </DialogClose>

                                                    <Button type="submit" variant="destructive" disabled={disableTwoFactorForm.processing}>
                                                        {disableTwoFactorForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                        Disable Two-Factor Authentication
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        )}

                        {(showingQrCode || twoFactorPending) && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium">Scan QR Code</h3>
                                    <p className="text-sm text-muted-foreground">
                                        To finish enabling two factor authentication, scan the following QR code using your phone's authenticator
                                        application or enter the setup key and provide the generated OTP code.
                                    </p>
                                </div>

                                {twoFactorQrCode && (
                                    <div className="flex justify-center">
                                        <div dangerouslySetInnerHTML={{ __html: twoFactorQrCode }} />
                                    </div>
                                )}

                                {twoFactorSecretKey && (
                                    <div className="space-y-2">
                                        <Label>Setup Key</Label>
                                        <Input value={twoFactorSecretKey} readOnly className="font-mono text-sm" />
                                        <p className="text-xs text-muted-foreground">
                                            Enter this key manually in your authenticator app if you can't scan the QR code.
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={confirmTwoFactor} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Verification Code</Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            inputMode="numeric"
                                            value={confirmTwoFactorForm.data.code}
                                            onChange={(e) => {
                                                confirmTwoFactorForm.setData('code', e.target.value);
                                                confirmTwoFactorForm.clearErrors('code');
                                            }}
                                            autoFocus
                                            className="w-full"
                                            placeholder="123456"
                                            pattern="[0-9]{6}"
                                            autoComplete="one-time-code"
                                        />

                                        <InputError message={confirmTwoFactorForm.errors.code} />
                                    </div>

                                    <div className="flex space-x-4">
                                        <Button type="submit" disabled={confirmTwoFactorForm.processing}>
                                            {confirmTwoFactorForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Confirm
                                        </Button>

                                        {!twoFactorPending && (
                                            <Button type="button" variant="outline" onClick={() => setShowingQrCode(false)}>
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}

                        {showingRecoveryCodes && twoFactorRecoveryCodes && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium">Recovery Codes</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Store these recovery codes in a secure location. They can be used to recover access to your account if your
                                        two-factor authentication device is lost.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2 rounded-lg bg-muted p-4 sm:grid-cols-2">
                                    {twoFactorRecoveryCodes.map((code, index) => (
                                        <div key={index} className="font-mono text-sm">
                                            {code}
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={() => setShowingRecoveryCodes(false)} variant="outline" size="sm">
                                    Hide Recovery Codes
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
