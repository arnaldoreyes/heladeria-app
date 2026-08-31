<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Restock;
use Illuminate\Support\Facades\DB;

class RestockService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Registra una nueva compra/reposición de inventario.
     */
    public function createRestock(array $data, string $businessId, ?string $userId): Restock
    {
        return DB::transaction(function () use ($data, $businessId, $userId) {
            $data['business_id'] = $businessId;
            $data['user_id'] = $userId;

            /** @var Restock $restock */
            $restock = Restock::create($data);

            if (!empty($data['items'])) {
                $this->processItemsAndStock($restock, $data['items']);
            }

            return $restock->load(['items.product', 'user']);
        });
    }

    /**
     * Actualiza una reposición existente ajustando deltas de inventario y costos.
     */
    public function updateRestock(Restock $restock, array $data): Restock
    {
        return DB::transaction(function () use ($restock, $data) {
            $previousStatus = $restock->status;

            // 1. Si la compra previa ya estaba completada, revertimos el stock anterior antes de aplicar cambios
            if ($previousStatus === 'completed') {
                $this->revertStockForRestock($restock);
            }

            // 2. Actualizar datos base del Restock
            $restock->update($data);

            // 3. Reemplazar o procesar ítems
            if (isset($data['items'])) {
                $restock->items()->delete();
                $this->processItemsAndStock($restock, $data['items']);
            } elseif ($previousStatus !== 'completed' && $restock->status === 'completed') {
                // Transición a completado usando los ítems ya almacenados previamente
                $this->applyStockForExistingItems($restock);
            }

            return $restock->load(['items.product', 'user']);
        });
    }

    /**
     * Elimina una reposición y revierte el stock si esta ya había sido completada.
     */
    public function deleteRestock(Restock $restock): bool
    {
        return DB::transaction(function () use ($restock) {
            if ($restock->status === 'completed') {
                $this->revertStockForRestock($restock);
            }

            $restock->items()->delete();
            return $restock->delete();
        });
    }

    /**
     * Procesa la creación de ítems con sus snapshots y actualiza stock/costos si está completado.
     */
    protected function processItemsAndStock(Restock $restock, array $itemsData): void
    {
        foreach ($itemsData as $itemData) {
            $product = Product::where('business_id', $restock->business_id)
                ->where('id', $itemData['product_id'])
                ->lockForUpdate()
                ->first();

            $unitCostUsd = (float) ($itemData['cost_usd'] ?? 0.0);
            $unitCostBs = (float) ($itemData['cost_bs'] ?? 0.0);
            $quantity = (float) $itemData['quantity'];

            $restock->items()->create([
                'business_id' => $restock->business_id,
                'product_id' => $product?->id,
                'product_name_snapshot' => $product?->name ?? 'Producto no encontrado',
                'quantity' => $quantity,
                'unit_cost_usd' => $unitCostUsd,
                'unit_cost_bs' => $unitCostBs,
                'subtotal_usd' => round($unitCostUsd * $quantity, 2),
                'subtotal_bs' => round($unitCostBs * $quantity, 2),
            ]);

            // Incrementar stock usando InventoryService y actualizar el costo
            if ($restock->status === 'completed' && $product) {
                $this->inventoryService->registerMovement([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'type' => 'restock',
                    'reference_type' => Restock::class,
                    'reference_id' => $restock->id,
                ], $restock->business_id, $restock->user_id);

                $product->update([
                    'cost_usd' => $unitCostUsd,
                    'cost_bs' => $unitCostBs,
                ]);
            }
        }
    }

    /**
     * Revierte el stock de una reposición completada previa.
     */
    protected function revertStockForRestock(Restock $restock): void
    {
        foreach ($restock->items as $item) {
            if ($item->product_id) {
                $this->inventoryService->registerMovement([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'type' => 'adjustment_out', // Tipo de movimiento negativo
                    'reference_type' => Restock::class,
                    'reference_id' => $restock->id,
                    'notes' => 'Reversión por modificación/eliminación de compra',
                ], $restock->business_id, $restock->user_id);
            }
        }
    }

    /**
     * Incrementa el stock utilizando los ítems previamente guardados en la BD.
     */
    protected function applyStockForExistingItems(Restock $restock): void
    {
        foreach ($restock->items as $item) {
            if ($item->product_id) {
                $this->inventoryService->registerMovement([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'type' => 'restock',
                    'reference_type' => Restock::class,
                    'reference_id' => $restock->id,
                ], $restock->business_id, $restock->user_id);

                Product::where('id', $item->product_id)->update([
                    'cost_usd' => $item->unit_cost_usd,
                    'cost_bs' => $item->unit_cost_bs,
                ]);
            }
        }
    }
}
