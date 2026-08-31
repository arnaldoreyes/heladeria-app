<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Registra una nueva venta completa con sus ítems, pagos e impacto en inventario.
     */
    public function createSale(array $data, string $businessId, string $userId): Sale
    {
        return DB::transaction(function () use ($data, $businessId, $userId) {
            // 1. Obtener tasa de cambio activa
            $exchangeRate = (float) ($data['exchange_rate'] ?? $this->getLatestExchangeRate($businessId));
            $exchangeRateDate = $data['exchange_rate_date'] ?? now();

            // 2. Procesar ítems y calcular totales
            $itemsData = [];
            $totalSubtotalUsd = 0.0;
            $totalCostUsd = 0.0;
            $totalMarginUsd = 0.0;
            $totalReinvestmentUsd = 0.0;
            $totalProfitUsd = 0.0;

            foreach ($data['items'] as $itemData) {
                // bloquear para lectura, el InventoryService hará la validación estricta de stock
                $product = Product::where('business_id', $businessId)
                    ->where('id', $itemData['product_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $quantity = (float) $itemData['quantity'];

                // Snapshots de precios y costos
                $unitPriceUsd = (float) ($itemData['unit_price_usd'] ?? $product->price_usd);
                $unitCostUsd = (float) ($itemData['unit_cost_usd'] ?? $product->cost_usd ?? 0.0);

                $unitPriceBs = $unitPriceUsd * $exchangeRate;
                $unitCostBs = $unitCostUsd * $exchangeRate;

                $subtotalUsd = round($unitPriceUsd * $quantity, 2);
                $costUsd = round($unitCostUsd * $quantity, 2);
                $marginUsd = round($subtotalUsd - $costUsd, 2);

                $subtotalBs = round($subtotalUsd * $exchangeRate, 2);
                $costBs = round($costUsd * $exchangeRate, 2);
                $marginBs = round($subtotalBs - $costBs, 2);

                // Distribuir margen según porcentajes del producto
                $profitPercentage = (float) ($product->profit_percentage ?? 50.0);
                $reinvestmentPercentage = (float) ($product->reinvestment_percentage ?? 50.0);

                $profitUsd = round(($marginUsd * $profitPercentage) / 100, 2);
                $reinvestmentUsd = round(($marginUsd * $reinvestmentPercentage) / 100, 2);

                $profitBs = round(($marginBs * $profitPercentage) / 100, 2);
                $reinvestmentBs = round(($marginBs * $reinvestmentPercentage) / 100, 2);

                // Acumular a la venta general
                $totalSubtotalUsd += $subtotalUsd;
                $totalCostUsd += $costUsd;
                $totalMarginUsd += $marginUsd;
                $totalReinvestmentUsd += $reinvestmentUsd;
                $totalProfitUsd += $profitUsd;

                $itemsData[] = [
                    'business_id' => $businessId,
                    'product_id' => $product->id,
                    'product_name_snapshot' => $product->name,
                    'quantity' => $quantity,
                    'unit_price_usd' => $unitPriceUsd,
                    'unit_price_bs' => $unitPriceBs,
                    'unit_cost_usd' => $unitCostUsd,
                    'unit_cost_bs' => $unitCostBs,
                    'subtotal_usd' => $subtotalUsd,
                    'cost_usd' => $costUsd,
                    'margin_usd' => $marginUsd,
                    'subtotal_bs' => $subtotalBs,
                    'cost_bs' => $costBs,
                    'margin_bs' => $marginBs,
                    'profit_percentage' => $profitPercentage,
                    'reinvestment_percentage' => $reinvestmentPercentage,
                    'reinvestment_usd' => $reinvestmentUsd,
                    'profit_usd' => $profitUsd,
                    'reinvestment_bs' => $reinvestmentBs,
                    'profit_bs' => $profitBs,
                ];
            }

            $discountBs = (float) ($data['discount_bs'] ?? 0.0);
            $totalBs = round(($totalSubtotalUsd * $exchangeRate) - $discountBs, 2);

            // 3. Procesar pagos iniciales
            $paidUsd = 0.0;
            $paymentsData = [];

            if (!empty($data['payments'])) {
                foreach ($data['payments'] as $payment) {
                    $amountOriginal = (float) $payment['amount'];
                    $currency = strtoupper($payment['currency'] ?? 'USD');
                    $payRate = (float) ($payment['exchange_rate'] ?? $exchangeRate);

                    $amountUsd = $currency === 'VES'
                        ? round($amountOriginal / $payRate, 2)
                        : $amountOriginal;

                    $paidUsd += $amountUsd;

                    $paymentsData[] = [
                        'business_id' => $businessId,
                        'payment_method_id' => $payment['payment_method_id'],
                        'amount_original' => $amountOriginal,
                        'currency' => $currency,
                        'amount_usd' => $amountUsd,
                        'exchange_rate' => $payRate,
                        'exchange_rate_date' => $exchangeRateDate,
                        'reference' => $payment['reference'] ?? null,
                        'notes' => $payment['notes'] ?? null,
                    ];
                }
            }

            $pendingUsd = max(0, round($totalSubtotalUsd - $paidUsd, 2));
            $paymentStatus = 'pending';
            if ($pendingUsd <= 0.001) {
                $paymentStatus = 'paid';
            } elseif ($paidUsd > 0) {
                $paymentStatus = 'partial';
            }

            $saleType = $data['sale_type'] ?? ($paymentStatus === 'paid' ? 'cash' : 'credit');

            // 4. Crear cabecera de la venta
            /** @var Sale $sale */
            $sale = Sale::create([
                'business_id' => $businessId,
                'user_id' => $userId,
                'customer_id' => $data['customer_id'] ?? null,
                'status' => 'completed',
                'sale_type' => $saleType,
                'payment_status' => $paymentStatus,
                'total_usd' => $totalSubtotalUsd,
                'total_bs' => $totalBs,
                'paid_usd' => $paidUsd,
                'pending_usd' => $pendingUsd,
                'exchange_rate' => $exchangeRate,
                'exchange_rate_date' => $exchangeRateDate,
                'discount_bs' => $discountBs,
                'cost_usd' => $totalCostUsd,
                'margin_usd' => $totalMarginUsd,
                'reinvestment_usd' => $totalReinvestmentUsd,
                'profit_usd' => $totalProfitUsd,
            ]);

            // 5. Guardar ítems y pagos
            $sale->items()->createMany($itemsData);
            if (!empty($paymentsData)) {
                $sale->payments()->createMany($paymentsData);
            }

            // 6. Impactar el inventario usando el InventoryService
            foreach ($itemsData as $itemData) {
                // Al usar type 'sale' (que no está en los INCREMENT_TYPES), descontará el stock
                $this->inventoryService->registerMovement([
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'type' => 'sale',
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                ], $businessId, $userId);
            }

            return $sale->load(['items', 'payments', 'customer']);
        });
    }

    /**
     * Registra un pago adicional a una venta a crédito existente.
     */
    public function addPayment(Sale $sale, array $paymentData): SalePayment
    {
        return DB::transaction(function () use ($sale, $paymentData) {
            $amountOriginal = (float) $paymentData['amount_original'];
            $currency = strtoupper($paymentData['currency']);
            $rate = (float) ($paymentData['exchange_rate'] ?? $sale->exchange_rate);

            $amountUsd = $currency === 'VES' ? round($amountOriginal / $rate, 2) : $amountOriginal;

            $payment = $sale->payments()->create([
                'business_id' => $sale->business_id,
                'payment_method_id' => $paymentData['payment_method_id'],
                'amount_original' => $amountOriginal,
                'currency' => $currency,
                'amount_usd' => $amountUsd,
                'exchange_rate' => $rate,
                'exchange_rate_date' => $paymentData['exchange_rate_date'] ?? now(),
                'reference' => $paymentData['reference'] ?? null,
                'notes' => $paymentData['notes'] ?? null,
            ]);

            // Recalcular saldo de la venta
            $sale->paid_usd = round($sale->payments()->sum('amount_usd'), 2);
            $sale->pending_usd = max(0, round($sale->total_usd - $sale->paid_usd, 2));

            if ($sale->pending_usd <= 0.001) {
                $sale->payment_status = 'paid';
            } else {
                $sale->payment_status = 'partial';
            }

            $sale->save();

            return $payment;
        });
    }

    /**
     * Anula una venta y restituye el stock al inventario.
     */
    public function cancelSale(Sale $sale): bool
    {
        return DB::transaction(function () use ($sale) {
            if ($sale->status === 'cancelled') {
                return true;
            }

            // Devolver stock usando InventoryService (type: 'return')
            foreach ($sale->items as $item) {
                if ($item->product_id) {
                    $this->inventoryService->registerMovement([
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'type' => 'return',
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => 'Devolución por anulación de venta',
                    ], $sale->business_id, auth()->id() ?? $sale->user_id);
                }
            }

            $sale->update([
                'status' => 'cancelled',
            ]);

            return true;
        });
    }

    private function getLatestExchangeRate(string $businessId): float
    {
        return (float) (app()->bound('current_exchange_rate') ? app('current_business_rate') : 1.0);
    }
}
