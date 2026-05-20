<?php

use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\SalonController as AdminSalonController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Client\AnalyticsController as ClientAnalyticsController;
use App\Http\Controllers\Api\Client\AppointmentController as ClientAppointmentController;
use App\Http\Controllers\Api\Client\AvailableSlotsController;
use App\Http\Controllers\Api\Client\ReviewController as ClientReviewController;
use App\Http\Controllers\Api\Client\SalonController as ClientSalonController;
use App\Http\Controllers\Api\Salon\AnalyticsController as SalonAnalyticsController;
use App\Http\Controllers\Api\Salon\AppointmentController as SalonAppointmentController;
use App\Http\Controllers\Api\Salon\OrderController;
use App\Http\Controllers\Api\Salon\ProfileController;
use App\Http\Controllers\Api\Salon\ReviewController as SalonReviewController;
use App\Http\Controllers\Api\Salon\ServiceController;
use App\Http\Controllers\Api\Salon\WorkingHoursController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register/client', [AuthController::class, 'registerClient']);
    Route::post('register/salon',  [AuthController::class, 'registerSalon']);
    Route::post('login',           [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('dashboard',  [DashboardController::class, 'stats']);
        Route::get('analytics',  [AdminAnalyticsController::class, 'index']);

        Route::get('salons',                    [AdminSalonController::class, 'index']);
        Route::get('salons/{salon}',            [AdminSalonController::class, 'show']);
        Route::patch('salons/{salon}/approve',  [AdminSalonController::class, 'approve']);
        Route::patch('salons/{salon}/reject',   [AdminSalonController::class, 'reject']);
        Route::delete('salons/{salon}',         [AdminSalonController::class, 'destroy']);

        Route::apiResource('products', AdminProductController::class);
    });

    /*
    |--------------------------------------------------------------------------
    | Salon Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:salon')->prefix('salon')->group(function () {
        Route::get('profile',    [ProfileController::class, 'show']);
        Route::put('profile',    [ProfileController::class, 'update']);
        Route::get('analytics',  [SalonAnalyticsController::class, 'index']);

        Route::apiResource('services', ServiceController::class);

        Route::get('orders',          [OrderController::class, 'index']);
        Route::post('orders',         [OrderController::class, 'store']);
        Route::get('orders/{order}',  [OrderController::class, 'show']);

        Route::get('working-hours',         [WorkingHoursController::class, 'index']);
        Route::post('working-hours',        [WorkingHoursController::class, 'upsert']);
        Route::patch('working-hours/{day}', [WorkingHoursController::class, 'update']);

        Route::get('appointments',                           [SalonAppointmentController::class, 'index']);
        Route::patch('appointments/{appointment}/confirm',   [SalonAppointmentController::class, 'confirm']);
        Route::patch('appointments/{appointment}/complete',  [SalonAppointmentController::class, 'complete']);
        Route::patch('appointments/{appointment}/cancel',    [SalonAppointmentController::class, 'cancel']);

        Route::get('reviews', [SalonReviewController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | Client Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('analytics',  [ClientAnalyticsController::class, 'index']);

        Route::get('salons',                         [ClientSalonController::class, 'index']);
        Route::get('salons/{salon}',                 [ClientSalonController::class, 'show']);
        Route::get('salons/{salon}/available-slots', [AvailableSlotsController::class, 'index']);
        Route::get('salons/{salon}/reviews',         [ClientReviewController::class, 'index']);

        Route::get('appointments',                        [ClientAppointmentController::class, 'index']);
        Route::post('appointments',                       [ClientAppointmentController::class, 'store']);
        Route::get('appointments/{appointment}',          [ClientAppointmentController::class, 'show']);
        Route::patch('appointments/{appointment}/cancel', [ClientAppointmentController::class, 'cancel']);

        Route::post('reviews',              [ClientReviewController::class, 'store']);
        Route::get('reviews',               [ClientReviewController::class, 'myReviews']);
        Route::delete('reviews/{review}',   [ClientReviewController::class, 'destroy']);
    });
});
