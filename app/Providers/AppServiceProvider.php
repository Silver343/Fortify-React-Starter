<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Password::defaults(function () {

            /** @var \Illuminate\Foundation\Application $app */
            $app = $this->app;

            return $app->isProduction()
                ? Password::min(12)->uncompromised()->rules('confirmed')
                : Password::min(8)->rules('confirmed');
        });
    }
}
