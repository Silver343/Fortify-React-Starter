<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $response = $this->get('/register');
    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::first();
    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect(Hash::check('password', $user->password))->toBeTrue();
});

test('registration fails with a weak password', function () {

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'weak',
        'password_confirmation' => 'weak',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

test('registration fails with mismatched passwords', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'not-password',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

test('registration fails with an existing email', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $response = $this->post('/register', [
        'name' => 'Another User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});
