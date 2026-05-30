<?php

use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\CashierController as AdminCashierController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\SalonController as AdminSalonController;
use App\Http\Controllers\Api\Salon\ProductController as SalonProductController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Client\AnalyticsController as ClientAnalyticsController;
use App\Http\Controllers\Api\Client\AppointmentController as ClientAppointmentController;
use App\Http\Controllers\Api\Client\AvailableSlotsController;
use App\Http\Controllers\Api\Client\FavoriteController;
use App\Http\Controllers\Api\Client\ProfileController as ClientProfileController;
use App\Http\Controllers\Api\Client\ReviewController as ClientReviewController;
use App\Http\Controllers\Api\Client\SalonController as ClientSalonController;
use App\Http\Controllers\Api\Salon\AnalyticsController as SalonAnalyticsController;
use App\Http\Controllers\Api\Salon\AppointmentController as SalonAppointmentController;
use App\Http\Controllers\Api\Salon\OrderController;
use App\Http\Controllers\Api\Salon\ProfileController;
use App\Http\Controllers\Api\Salon\ReviewController as SalonReviewController;
use App\Http\Controllers\Api\Salon\ServiceController;
use App\Http\Controllers\Api\Salon\ClientController as SalonClientController;
use App\Http\Controllers\Api\Salon\CashierController;
use App\Http\Controllers\Api\Salon\MediaController as SalonMediaController;
use App\Http\Controllers\Api\Salon\WorkingHoursController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('register/client', [AuthController::class, 'registerClient']);
    Route::post('register/salon',  [AuthController::class, 'registerSalon']);
    Route::post('login',           [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout',      [AuthController::class, 'logout']);
    Route::get('auth/me',           [AuthController::class, 'me']);
    Route::post('auth/push-token',  [AuthController::class, 'updatePushToken']);

    Route::get('notifications',                          [NotificationController::class, 'index']);
    Route::get('notifications/unread-count',             [NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-all-read',           [NotificationController::class, 'markAllRead']);
    Route::patch('notifications/{id}/mark-read',         [NotificationController::class, 'markRead']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('dashboard',  [DashboardController::class, 'stats']);
        Route::get('cashier/summary',              [AdminCashierController::class, 'summary']);
        Route::get('cashier/salons',               [AdminCashierController::class, 'salonBreakdown']);
        Route::get('cashier',                      [AdminCashierController::class, 'index']);
        Route::post('cashier',                     [AdminCashierController::class, 'store']);
        Route::delete('cashier/{cashTransaction}', [AdminCashierController::class, 'destroy']);
        Route::get('analytics',  [AdminAnalyticsController::class, 'index']);

        Route::get('salons',                    [AdminSalonController::class, 'index']);
        Route::get('salons/{salon}',            [AdminSalonController::class, 'show']);
        Route::patch('salons/{salon}/approve',  [AdminSalonController::class, 'approve']);
        Route::patch('salons/{salon}/reject',   [AdminSalonController::class, 'reject']);
        Route::delete('salons/{salon}',         [AdminSalonController::class, 'destroy']);

        Route::apiResource('products', AdminProductController::class);
        Route::post('products/{product}/image', [ImageUploadController::class, 'productImage']);

        Route::get('orders',                      [AdminOrderController::class, 'index']);
        Route::get('orders/{order}',              [AdminOrderController::class, 'show']);
        Route::patch('orders/{order}/advance',    [AdminOrderController::class, 'advance']);
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
        Route::post('appointments',                          [SalonAppointmentController::class, 'store']);
        Route::patch('appointments/{appointment}/confirm',   [SalonAppointmentController::class, 'confirm']);
        Route::patch('appointments/{appointment}/complete',  [SalonAppointmentController::class, 'complete']);
        Route::patch('appointments/{appointment}/cancel',    [SalonAppointmentController::class, 'cancel']);

        Route::get('reviews', [SalonReviewController::class, 'index']);

        Route::get('products', [SalonProductController::class, 'index']);

        Route::post('profile/logo',               [ImageUploadController::class, 'salonLogo']);
        Route::post('services/{service}/image',   [ImageUploadController::class, 'serviceImage']);

        Route::get('clients',                [SalonClientController::class, 'index']);
        Route::get('clients/walkin',         [SalonClientController::class, 'walkin']);
        Route::get('clients/app/{userId}',   [SalonClientController::class, 'show']);

        Route::get('cashier/summary',              [CashierController::class, 'summary']);
        Route::get('cashier',                      [CashierController::class, 'index']);
        Route::post('cashier',                     [CashierController::class, 'store']);
        Route::delete('cashier/{cashTransaction}', [CashierController::class, 'destroy']);

        Route::get('media',             [SalonMediaController::class, 'index']);
        Route::post('media',            [SalonMediaController::class, 'store']);
        Route::patch('media/{media}',   [SalonMediaController::class, 'update']);
        Route::delete('media/{media}',  [SalonMediaController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Client Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('analytics',  [ClientAnalyticsController::class, 'index']);
        Route::put('profile',    [ClientProfileController::class, 'update']);

        Route::get('favorites',              [FavoriteController::class, 'index']);
        Route::get('favorites/ids',          [FavoriteController::class, 'ids']);
        Route::post('favorites/{salon}',     [FavoriteController::class, 'toggle']);

        Route::get('salons',                         [ClientSalonController::class, 'index']);
        Route::get('salons/{salon}',                 [ClientSalonController::class, 'show']);
        Route::get('salons/{salon}/media',           [ClientSalonController::class, 'media']);
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
