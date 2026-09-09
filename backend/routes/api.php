<?php

use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\CashierController as AdminCashierController;
use App\Http\Controllers\Api\Admin\ClientOrderController as AdminClientOrderController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductAttributeController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\ProductOfferController;
use App\Http\Controllers\Api\Admin\ProductPriceTierController;
use App\Http\Controllers\Api\Admin\ProductVariantController;
use App\Http\Controllers\Api\Admin\SalonController as AdminSalonController;
use App\Http\Controllers\Api\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Api\Admin\SearchController as AdminSearchController;
use App\Http\Controllers\Api\Admin\SearchHistoryController as AdminSearchHistoryController;
use App\Http\Controllers\Api\Salon\ProductController as SalonProductController;
use App\Http\Controllers\Api\Salon\SearchHistoryController as SalonSearchHistoryController;
use App\Http\Controllers\Api\Client\SearchHistoryController as ClientSearchHistoryController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Client\AnalyticsController as ClientAnalyticsController;
use App\Http\Controllers\Api\Client\AppointmentController as ClientAppointmentController;
use App\Http\Controllers\Api\Client\AvailableSlotsController;
use App\Http\Controllers\Api\Client\FavoriteController;
use App\Http\Controllers\Api\Client\OrderController as ClientOrderController;
use App\Http\Controllers\Api\Client\ProductController as ClientProductController;
use App\Http\Controllers\Api\Client\ProfileController as ClientProfileController;
use App\Http\Controllers\Api\Client\ReviewController as ClientReviewController;
use App\Http\Controllers\Api\Client\SalonController as ClientSalonController;
use App\Http\Controllers\Api\Salon\AnalyticsController as SalonAnalyticsController;
use App\Http\Controllers\Api\Salon\AppointmentController as SalonAppointmentController;
use App\Http\Controllers\Api\Salon\BalanceController;
use App\Http\Controllers\Api\Salon\OrderController;
use App\Http\Controllers\Api\Salon\ProfileController;
use App\Http\Controllers\Api\Salon\SettingsController as SalonSettingsController;
use App\Http\Controllers\Api\Salon\ReviewController as SalonReviewController;
use App\Http\Controllers\Api\Salon\ServiceController;
use App\Http\Controllers\Api\Salon\ClientController as SalonClientController;
use App\Http\Controllers\Api\Salon\MediaController as SalonMediaController;
use App\Http\Controllers\Api\Salon\ScheduleBlockController;
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
    Route::patch('auth/locale',     [AuthController::class, 'updateLocale']);

    Route::get('notifications',                          [NotificationController::class, 'index']);
    Route::get('notifications/unread-count',             [NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-all-read',           [NotificationController::class, 'markAllRead']);
    Route::patch('notifications/{id}/mark-read',         [NotificationController::class, 'markRead']);
    Route::post('notifications/web-push-subscribe',      [NotificationController::class, 'webPushSubscribe']);
    Route::delete('notifications/web-push-unsubscribe',  [NotificationController::class, 'webPushUnsubscribe']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('dashboard',  [DashboardController::class, 'stats']);
        Route::get('search',    [AdminSearchController::class, 'index']);
        // Merges b2b + b2c order data for the dashboard's cross-cutting recent-orders
        // widget, so it isn't gated behind either single 'orders'/'client_orders' permission.
        Route::get('orders/recent', [AdminOrderController::class, 'recent']);

        Route::middleware('super_admin')->prefix('admin-users')->group(function () {
            Route::get('/',            [AdminUserController::class, 'index']);
            Route::post('/',           [AdminUserController::class, 'store']);
            Route::patch('{user}',     [AdminUserController::class, 'update']);
            Route::delete('{user}',    [AdminUserController::class, 'destroy']);
        });

        Route::middleware('super_admin')->group(function () {
            Route::get('settings',   [AdminSettingsController::class, 'show']);
            Route::patch('settings', [AdminSettingsController::class, 'update']);
        });

        Route::middleware('permission:cashier')->group(function () {
            Route::get('cashier/summary',              [AdminCashierController::class, 'summary']);
            Route::get('cashier/salons',               [AdminCashierController::class, 'salonBreakdown']);
            Route::get('cashier',                      [AdminCashierController::class, 'index']);
            Route::post('cashier',                     [AdminCashierController::class, 'store']);
            Route::delete('cashier/{cashTransaction}', [AdminCashierController::class, 'destroy']);
        });

        Route::middleware('permission:analytics')->group(function () {
            Route::get('analytics',  [AdminAnalyticsController::class, 'index']);
            Route::get('analytics/products-sold', [AdminAnalyticsController::class, 'productsSold']);
            Route::get('search-history/trending', [AdminSearchHistoryController::class, 'trending']);
        });

        Route::middleware('permission:appointments')->group(function () {
            Route::get('appointments', [AdminAppointmentController::class, 'index']);
        });

        Route::middleware('permission:salons')->group(function () {
            Route::get('salons',                    [AdminSalonController::class, 'index']);
            Route::get('salons/{salon}',            [AdminSalonController::class, 'show']);
            Route::get('salons/{salon}/stats',      [AdminSalonController::class, 'stats']);
            Route::patch('salons/{salon}/phone',    [AdminSalonController::class, 'updatePhone']);
            Route::patch('salons/{salon}/approve',  [AdminSalonController::class, 'approve']);
            Route::patch('salons/{salon}/reject',   [AdminSalonController::class, 'reject']);
            Route::delete('salons/{salon}',         [AdminSalonController::class, 'destroy']);
        });

        Route::middleware('permission:products')->group(function () {
            Route::apiResource('products', AdminProductController::class);
            Route::post('products/{product}/image', [ImageUploadController::class, 'productImage']);
            Route::patch('products/{product}/add-stock',  [AdminProductController::class, 'addStock']);
            Route::post('products/{product}/direct-sell', [AdminProductController::class, 'directSell']);

            Route::post('products/{product}/attributes',                    [ProductAttributeController::class, 'store']);
            Route::patch('products/{product}/attributes/{attribute}',       [ProductAttributeController::class, 'update']);
            Route::delete('products/{product}/attributes/{attribute}',      [ProductAttributeController::class, 'destroy']);
            Route::post('products/{product}/attributes/{attribute}/values', [ProductAttributeController::class, 'addValue']);
            Route::patch('products/{product}/attribute-values/{value}',     [ProductAttributeController::class, 'updateValue']);
            Route::delete('products/{product}/attribute-values/{value}',    [ProductAttributeController::class, 'destroyValue']);

            Route::post('products/{product}/variants/generate',    [ProductVariantController::class, 'generate']);
            Route::put('products/{product}/variants',               [ProductVariantController::class, 'bulkUpdate']);
            Route::delete('products/{product}/variants/{variant}', [ProductVariantController::class, 'destroy']);

            Route::post('products/{product}/images',              [ProductImageController::class, 'store']);
            Route::delete('products/{product}/images/{image}',    [ProductImageController::class, 'destroy']);

            Route::put('products/{product}/offer',                                [ProductOfferController::class, 'update']);
            Route::put('products/{product}/variants/{variant}/offer',             [ProductOfferController::class, 'updateVariant']);
            Route::put('products/{product}/price-tiers',                         [ProductPriceTierController::class, 'update']);
            Route::put('products/{product}/variants/{variant}/price-tiers',      [ProductPriceTierController::class, 'updateVariant']);
        });

        Route::middleware('permission:orders')->group(function () {
            Route::get('orders',                      [AdminOrderController::class, 'index']);
            Route::get('orders/{order}',              [AdminOrderController::class, 'show']);
            Route::patch('orders/{order}',            [AdminOrderController::class, 'update']);
            Route::patch('orders/{order}/advance',    [AdminOrderController::class, 'advance']);
            Route::patch('orders/{order}/cancel',     [AdminOrderController::class, 'cancel']);
            Route::patch('orders/{order}/fail',       [AdminOrderController::class, 'fail']);
            Route::patch('orders/{order}/return',     [AdminOrderController::class, 'returnOrder']);
            Route::patch('orders/{order}/approve-return', [AdminOrderController::class, 'approveReturn']);
            Route::patch('orders/{order}/deny-return',    [AdminOrderController::class, 'denyReturn']);
            Route::patch('orders/{order}/approve-cancellation', [AdminOrderController::class, 'approveCancellation']);
            Route::patch('orders/{order}/deny-cancellation',    [AdminOrderController::class, 'denyCancellation']);
        });

        Route::middleware('permission:client_orders')->group(function () {
            Route::get('client-orders',                    [AdminClientOrderController::class, 'index']);
            Route::get('client-orders/{order}',            [AdminClientOrderController::class, 'show']);
            Route::patch('client-orders/{order}',          [AdminClientOrderController::class, 'update']);
            Route::patch('client-orders/{order}/advance',  [AdminClientOrderController::class, 'advance']);
            Route::patch('client-orders/{order}/fail',     [AdminClientOrderController::class, 'fail']);
            Route::patch('client-orders/{order}/return',   [AdminClientOrderController::class, 'returnOrder']);
            Route::patch('client-orders/{order}/approve-return', [AdminClientOrderController::class, 'approveReturn']);
            Route::patch('client-orders/{order}/deny-return',    [AdminClientOrderController::class, 'denyReturn']);
            Route::patch('client-orders/{order}/approve-cancellation', [AdminClientOrderController::class, 'approveCancellation']);
            Route::patch('client-orders/{order}/deny-cancellation',    [AdminClientOrderController::class, 'denyCancellation']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Salon Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:salon')->prefix('salon')->group(function () {
        Route::get('profile',    [ProfileController::class, 'show']);
        Route::put('profile',    [ProfileController::class, 'update']);
        Route::patch('settings', [SalonSettingsController::class, 'update']);
        Route::get('analytics',  [SalonAnalyticsController::class, 'index']);

        Route::middleware('balance_enabled')->prefix('balance')->group(function () {
            Route::get('summary',                [BalanceController::class, 'summary']);
            Route::get('history',                [BalanceController::class, 'history']);
            Route::get('transactions',           [BalanceController::class, 'index']);
            Route::post('transactions',          [BalanceController::class, 'store']);
            Route::delete('transactions/{transaction}', [BalanceController::class, 'destroy']);
        });

        Route::apiResource('services', ServiceController::class);

        Route::get('orders',                  [OrderController::class, 'index']);
        Route::post('orders',                 [OrderController::class, 'store']);
        Route::get('products-ordered',        [OrderController::class, 'productsOrdered']);
        Route::get('orders/{order}',          [OrderController::class, 'show']);
        Route::patch('orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::patch('orders/{order}/request-return', [OrderController::class, 'requestReturn']);

        Route::get('working-hours',         [WorkingHoursController::class, 'index']);
        Route::post('working-hours',        [WorkingHoursController::class, 'upsert']);
        Route::patch('working-hours/{day}', [WorkingHoursController::class, 'update']);

        Route::get('schedule-blocks',                  [ScheduleBlockController::class, 'index']);
        Route::post('schedule-blocks',                 [ScheduleBlockController::class, 'store']);
        Route::delete('schedule-blocks/{scheduleBlock}', [ScheduleBlockController::class, 'destroy']);

        Route::get('appointments',                           [SalonAppointmentController::class, 'index']);
        Route::post('appointments',                          [SalonAppointmentController::class, 'store']);
        Route::patch('appointments/{appointment}/confirm',   [SalonAppointmentController::class, 'confirm']);
        Route::patch('appointments/{appointment}/complete',  [SalonAppointmentController::class, 'complete']);
        Route::patch('appointments/{appointment}/cancel',    [SalonAppointmentController::class, 'cancel']);
        Route::patch('appointments/{appointment}/approve-cancellation', [SalonAppointmentController::class, 'approveCancellation']);
        Route::patch('appointments/{appointment}/deny-cancellation',    [SalonAppointmentController::class, 'denyCancellation']);

        Route::get('reviews', [SalonReviewController::class, 'index']);

        Route::get('products', [SalonProductController::class, 'index']);

        Route::post('profile/logo',               [ImageUploadController::class, 'salonLogo']);
        Route::post('services/{service}/image',   [ImageUploadController::class, 'serviceImage']);

        Route::get('clients',                [SalonClientController::class, 'index']);
        Route::get('clients/walkin',         [SalonClientController::class, 'walkin']);
        Route::get('clients/app/{userId}',   [SalonClientController::class, 'show']);

        Route::get('media',             [SalonMediaController::class, 'index']);
        Route::post('media',            [SalonMediaController::class, 'store']);
        Route::patch('media/{media}',   [SalonMediaController::class, 'update']);
        Route::delete('media/{media}',  [SalonMediaController::class, 'destroy']);

        Route::get('search-history',  [SalonSearchHistoryController::class, 'index']);
        Route::post('search-history', [SalonSearchHistoryController::class, 'store']);
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
        Route::get('salons/cities',                  [ClientSalonController::class, 'cities']);
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

        Route::get('products',              [ClientProductController::class, 'index']);
        Route::get('products/{product}',    [ClientProductController::class, 'show']);

        Route::get('orders',                       [ClientOrderController::class, 'index']);
        Route::post('orders',                      [ClientOrderController::class, 'store']);
        Route::get('orders/{order}',               [ClientOrderController::class, 'show']);
        Route::patch('orders/{order}/cancel',      [ClientOrderController::class, 'cancel']);
        Route::patch('orders/{order}/request-return', [ClientOrderController::class, 'requestReturn']);

        Route::get('search-history',  [ClientSearchHistoryController::class, 'index']);
        Route::post('search-history', [ClientSearchHistoryController::class, 'store']);
    });
});
