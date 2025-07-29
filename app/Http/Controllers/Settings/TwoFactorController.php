<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    /**
     * Show the two-factor authentication settings page.
     */
    public function edit(): Response
    {
        $twoFactorEnabled = Auth::user()->isTwoFactorEnabled();
        $twoFactorPending = Auth::user()->isTwoFactorPending();

        return Inertia::render('settings/two-factor', [
            'twoFactorEnabled' => $twoFactorEnabled,
            'twoFactorPending' => $twoFactorPending,
            'twoFactorQrCode' => ($twoFactorEnabled || $twoFactorPending) ? Auth::user()->twoFactorQrCodeSvg() : null,
            'twoFactorSecretKey' => Auth::user()->two_factor_secret ? decrypt(Auth::user()->two_factor_secret) : null,
            'twoFactorRecoveryCodes' => $twoFactorEnabled ? Auth::user()->recoveryCodes() : null,
        ]);
    }
}
