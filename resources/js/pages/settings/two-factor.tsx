import { type BreadcrumbItem } from '@/types';
import { store as confirmTwoFactor } from '@actions/Laravel/Fortify/Http/Controllers/ConfirmedTwoFactorAuthenticationController';
import { store as regenerateRecoveryCodes } from '@actions/Laravel/Fortify/Http/Controllers/RecoveryCodeController';
import { destroy as disableTwoFactor, store as enableTwoFactor } from '@actions/Laravel/Fortify/Http/Controllers/TwoFactorAuthenticationController';
import { Form, Head } from '@inertiajs/react';
import { AlertTriangle, Key, LoaderCircle, Shield } from 'lucide-react';
import { useState } from 'react';

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

    const showRecoveryCodes = () => {
        setShowingRecoveryCodes(true);
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
                                <Form action={enableTwoFactor()} options={{ preserveScroll: true }}>
                                    {({ processing }) => (
                                        <Button disabled={processing} className="w-full sm:w-auto">
                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Enable Two-Factor Authentication
                                        </Button>
                                    )}
                                </Form>
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
                                    <Form action={disableTwoFactor()} options={{ preserveScroll: true }}>
                                        {({ processing }) => (
                                            <Button variant="outline" size="sm" disabled={processing}>
                                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Cancel Setup
                                            </Button>
                                        )}
                                    </Form>
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

                                    <Form
                                        action={regenerateRecoveryCodes()}
                                        options={{ preserveScroll: true }}
                                        onSuccess={() => setShowingRecoveryCodes(true)}
                                    >
                                        {({ processing }) => (
                                            <Button variant="outline" size="sm" disabled={processing}>
                                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Regenerate Recovery Codes
                                            </Button>
                                        )}
                                    </Form>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive">Disable Two-Factor Authentication</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Are you sure you want to disable two-factor authentication?</DialogTitle>
                                            <DialogDescription>
                                                This will remove the extra security layer from your account. You can re-enable it at any time.
                                            </DialogDescription>
                                            <Form className="space-y-6" action={disableTwoFactor()} options={{ preserveScroll: true }}>
                                                {({ processing }) => (
                                                    <DialogFooter className="gap-2">
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">Cancel</Button>
                                                        </DialogClose>

                                                        <Button type="submit" variant="destructive" disabled={processing}>
                                                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                            Disable Two-Factor Authentication
                                                        </Button>
                                                    </DialogFooter>
                                                )}
                                            </Form>
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

                                <Form
                                    action={confirmTwoFactor()}
                                    errorBag="confirmTwoFactorAuthentication"
                                    options={{ preserveScroll: true }}
                                    onSuccess={() => {
                                        setShowingQrCode(false);
                                        setShowingRecoveryCodes(true);
                                    }}
                                    className="space-y-4"
                                >
                                    {({ processing, errors, clearErrors }) => (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="code">Verification Code</Label>
                                                <Input
                                                    id="code"
                                                    name="code"
                                                    type="text"
                                                    inputMode="numeric"
                                                    onChange={() => {
                                                        clearErrors('code');
                                                    }}
                                                    defaultValue=""
                                                    autoFocus
                                                    className="w-full"
                                                    placeholder="123456"
                                                    pattern="[0-9]{6}"
                                                    autoComplete="one-time-code"
                                                />

                                                <InputError message={errors.code} />
                                            </div>

                                            <div className="flex space-x-4">
                                                <Button type="submit" disabled={processing}>
                                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                    Confirm
                                                </Button>

                                                {!twoFactorPending && (
                                                    <Button type="button" variant="outline" onClick={() => setShowingQrCode(false)}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </Form>
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
