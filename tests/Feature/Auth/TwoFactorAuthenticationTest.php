<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Events\RecoveryCodeReplaced;
use Laravel\Fortify\Events\RecoveryCodesGenerated;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationEnabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationFailed;
use Laravel\Fortify\Events\ValidTwoFactorAuthenticationCodeProvided;
use PragmaRX\Google2FA\Google2FA;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\withoutExceptionHandling;
use function Pest\Laravel\withSession;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('two factor authentication can be set to pending', function () {
    Event::fake();

    $user = User::factory()->create();

    $this->actingAs($user);

    $this->withSession(['auth.password_confirmed_at' => time()])
        ->post('/user/two-factor-authentication');

    expect($user->fresh()->two_factor_secret)->not->toBeNull();
    expect($user->fresh()->two_factor_confirmed_at)->toBeNull();
    expect($user->fresh()->isTwoFactorEnabled())->toBeFalse();
    expect($user->fresh()->isTwoFactorPending())->toBeTrue();

    Event::assertDispatched(TwoFactorAuthenticationEnabled::class);

});

test('two factor authentication requires confirmation before use', function () {
    Event::fake();

    $tfaEngine = app(Google2FA::class);
    $userSecret = $tfaEngine->generateSecretKey();
    $validOTP = $tfaEngine->getCurrentOtp($userSecret);

    /** @var User $user */
    $user = User::factory()->create();
    $user->forceFill([
        'two_factor_secret' => encrypt($userSecret),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
    ])->save();

    $this->actingAs($user);

    // Before confirmation, 2FA should be pending
    expect($user->isTwoFactorEnabled())->toBeFalse();
    expect($user->isTwoFactorPending())->toBeTrue();

    // Mock the confirmation process
    actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->post(route('two-factor.confirm'), [
            'code' => $validOTP,
        ]);

    // After confirmation, 2FA should be enabled
    expect($user->fresh()->isTwoFactorEnabled())->toBeTrue();
    expect($user->fresh()->isTwoFactorPending())->toBeFalse();

    Event::assertDispatched(TwoFactorAuthenticationConfirmed::class);
});

test('two factor authentication can be disabled', function () {

    Event::fake();

    $user = User::factory()->create();
    $user->forceFill([
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->actingAs($user);

    $this->withSession(['auth.password_confirmed_at' => time()])
        ->delete('/user/two-factor-authentication');

    expect($user->fresh()->two_factor_secret)->toBeNull();
    expect($user->fresh()->two_factor_recovery_codes)->toBeNull();
    expect($user->fresh()->two_factor_confirmed_at)->toBeNull();

    Event::assertDispatched(TwoFactorAuthenticationDisabled::class);
});

test('two factor challenge screen can be rendered', function () {

    $user = User::factory()->create([
        'two_factor_secret' => encrypt('secret'),
    ]);

    $response = $this->withSession([
        'login.id' => $user->id,
        'login.remember' => false,
    ])->get('/two-factor-challenge');

    $response->assertStatus(200);
});

test('recovery codes can be regenerated', function () {

    Event::fake();

    $user = User::factory()->create([
        'two_factor_secret' => encrypt('secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['old-code-1', 'old-code-2'])),
    ]);

    $this->actingAs($user);

    $originalCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

    $response = $this->withSession(['auth.password_confirmed_at' => time()])
        ->post('/user/two-factor-recovery-codes');

    $response->assertStatus(302);

    $newCodes = json_decode(decrypt($user->fresh()->two_factor_recovery_codes), true);

    expect($originalCodes)->not->toEqual($newCodes);

    Event::assertDispatched(RecoveryCodesGenerated::class);
});

test('user is redirected to challenge when using two factor authentication', function () {
    Event::fake();

    $user = User::factory()->withTwoFactor()->confirmed()->create();

    withoutExceptionHandling();

    post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/two-factor-challenge');

    Event::assertDispatched(TwoFactorAuthenticationChallenged::class);
});

test('user is not redirected to challenge when using two factor authentication that has not been confirmed', function () {

    Event::fake();

    $user = User::factory()->withTwoFactor()->create();

    withoutExceptionHandling();

    post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));
});

test('user password is rehashed when redirecting to two factor challenge', function () {

    $user = User::factory()->state([
        'password' => Hash::make('password', ['rounds' => 4]),
    ])->withTwoFactor()->confirmed()->create();

    withoutExceptionHandling();

    post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/two-factor-challenge');

    $this->assertNotSame($user->password, $user->fresh()->password);
    $this->assertTrue(Hash::check('password', $user->fresh()->password));
});

test('two factor challenge can be passed via code', function () {
    Event::fake();

    $tfaEngine = app(Google2FA::class);
    $userSecret = $tfaEngine->generateSecretKey();
    $validOTP = $tfaEngine->getCurrentOtp($userSecret);

    $user = user::factory()->state([
        'two_factor_secret' => encrypt($userSecret),
    ])->confirmed()->create();

    withSession([
        'login.id' => $user->id,
        'login.remember' => false,
    ]);

    withoutExceptionHandling();

    post('/two-factor-challenge', [
        'code' => $validOTP,
    ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionMissing('login.id');

    Event::assertDispatched(ValidTwoFactorAuthenticationCodeProvided::class);
});

test('two factor authentication preserves remember me selecetion', function () {
    Event::fake();

    $user = User::factory()->withTwoFactor()->confirmed()->create();

    withoutExceptionHandling();

    post('/login', [
        'email' => $user->email,
        'password' => 'password',
        'remeber' => false,
    ])
        ->assertRedirect('/two-factor-challenge')
        ->assertSessionHas('login.remember', false);
});

test('two factor challenge fails for old otp', function () {
    Event::fake();

    $tfaEngine = app(Google2FA::class);
    $userSecret = $tfaEngine->generateSecretKey();
    $currentTs = $tfaEngine->getTimestamp();
    $previousOtp = $tfaEngine->oathTotp($userSecret, $currentTs - 2);

    $user = User::factory()
        ->withTwoFactor()
        ->confirmed()
        ->state([
            'two_factor_secret' => encrypt($userSecret),
        ])
        ->create();

    withSession([
        'login.id' => $user->id,
        'login.remember' => false,
    ]);

    withoutExceptionHandling();

    post('/two-factor-challenge', [
        'code' => $previousOtp,
    ])
        ->assertRedirect('/two-factor-challenge')
        ->assertSessionHas('login.id')
        ->assertSessionHasErrors(['code']);

    Event::assertDispatched(TwoFactorAuthenticationFailed::class);
});

test('two factor challenge can be passed via recovery code', function () {

    Event::fake();

    $user = User::factory()
        ->withTwoFactor()
        ->confirmed()
        ->state([
            'two_factor_recovery_codes' => encrypt(json_encode(['invalid-code', 'valid-code'])),
        ])
        ->create();

    withSession([
        'login.id' => $user->id,
        'login.remember' => false,
    ]);

    withoutExceptionHandling();

    post('/two-factor-challenge', [
        'recovery_code' => 'valid-code',
    ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionMissing('login.id');

    $this->assertNotNull(Auth::getUser());
    $this->assertNotContains('valid-code', json_decode(decrypt($user->fresh()->two_factor_recovery_codes), true));

    Event::assertDispatched(ValidTwoFactorAuthenticationCodeProvided::class);
    Event::assertDispatched(RecoveryCodeReplaced::class);

});

test('two factor challenge can fail via recovery code', function () {

    $user = User::factory()
        ->withTwoFactor()
        ->confirmed()
        ->state([
            'two_factor_recovery_codes' => encrypt(json_encode(['invalid-code', 'valid-code'])),
        ])
        ->create();

    withSession([
        'login.id' => $user->id,
        'login.remember' => false,
    ]);

    withoutExceptionHandling();

    post('/two-factor-challenge', [
        'recovery_code' => 'missing-code',
    ])
        ->assertRedirect('/two-factor-challenge')
        ->assertSessionHas('login.id')
        ->assertSessionHasErrors(['recovery_code']);

    $this->assertNull(Auth::getUser());
});

test('two factor challenge requires a challenged user', function () {

    withSession([]);
    withoutExceptionHandling();

    get('/two-factor-challenge')
        ->assertRedirect('/login');

    $this->assertNull(Auth::getUser());
});
