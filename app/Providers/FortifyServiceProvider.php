<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;
use Laravel\Fortify\Fortify;
use Inertia\Inertia;
use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\UpdateUserProfileInformation;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\ResetUserPassword;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {

        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        // Configure Inertia views
        Fortify::loginView(function () {
            return Inertia::render('auth/login', [
                'canResetPassword' => \Illuminate\Support\Facades\Route::has('password.request'),
                'status' => session('status'),
            ]);
        });

        Fortify::registerView(function () {
            return Inertia::render('auth/register');
        });

        Fortify::requestPasswordResetLinkView(function () {
            return Inertia::render('auth/forgot-password', [
                'status' => session('status'),
            ]);
        });

        Fortify::resetPasswordView(function (Request $request) {
            return Inertia::render('auth/reset-password', [
                'email' => $request->input('email'),
                'token' => $request->route('token'),
            ]);
        });

        Fortify::verifyEmailView(function () {
            return Inertia::render('auth/verify-email', [
                'status' => session('status'),
            ]);
        });

        Fortify::confirmPasswordView(function () {
            return Inertia::render('auth/confirm-password');
        });

        Fortify::twoFactorChallengeView(function () {
            return Inertia::render('auth/two-factor-challenge');
        });

    }
}
