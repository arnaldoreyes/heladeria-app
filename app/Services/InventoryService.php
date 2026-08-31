<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryService
{
    /**
     * Tipos de movimiento que incrementan el stock.
     */
    protected const INCREMENT_TYPES = [
        'initial_restock',
        'restock',
        'return',
        'adjustment_in',
    ];

    /**
     * Registra un movimiento de kardex y actualiza de forma atómica el stock del producto.
     */
    public function registerMovement(array $data, string $businessId, ?string $userId = null): InventoryMovement
    {
        return DB::transaction(function () use ($data, $businessId, $userId) {
            /** @var Product $product */
            $product = Product::where('business_id', $businessId)
                ->where('id', $data['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = (float) $product->stock;
            $quantity = abs((float) $data['quantity']);
            $type = $data['type'];

            $isIncrement = in_array($type, self::INCREMENT_TYPES, true);

            $newStock = $isIncrement
                ? $previousStock + $quantity
                : $previousStock - $quantity;

            if ($newStock < 0) {
                throw new InvalidArgumentException(
                    "Stock insuficiente para el producto '{$product->name}'. Stock actual: {$previousStock}, requerido: {$quantity}."
                );
            }

            // 1. Actualizar el stock base del producto
            $product->update(['stock' => $newStock]);

            // 2. Crear la entrada auditada en el Kardex
            return InventoryMovement::create([
                'business_id' => $businessId,
                'product_id' => $product->id,
                'user_id' => $userId,
                'type' => $type,
                'quantity' => $quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_type' => $data['reference_type'] ?? null, // ej: Sale::class, Restock::class
                'reference_id' => $data['reference_id'] ?? null,     // ej: UUID de la venta o compra
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }
}
