<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SalePaymentRequest;
use App\Http\Requests\SaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    /**
     * Muestra el listado paginado de ventas del negocio con soporte para filtros, ordenamiento e inclusiones.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $sales = QueryBuilder::for(Sale::class)
            ->allowedFilters(
                // Búsqueda global (Ticket de venta)
                AllowedFilter::scope('search'),
                AllowedFilter::scope('ticket', 'searchTicket'),

                // Filtros exactos por estado
                AllowedFilter::exact('status'),
                AllowedFilter::exact('payment_status'),
                AllowedFilter::exact('sale_type'),
                AllowedFilter::exact('user_id'),

                // Scopes específicos de filtrado
                AllowedFilter::scope('customer', 'byCustomer'),
                AllowedFilter::scope('start_date', 'startDate'),
                AllowedFilter::scope('end_date', 'endDate'),
                AllowedFilter::scope('date_range', 'byDateRange'),
                AllowedFilter::scope('today'),
                AllowedFilter::scope('pending_payment', 'pendingPayment'),
                AllowedFilter::scope('completed'),
                AllowedFilter::scope('paid'),
            )
            ->allowedSorts(
                'ticket_number',
                'total_usd',
                'total_bs',
                'paid_usd',
                'pending_usd',
                'status',
                'payment_status',
                'created_at',
            )
            ->defaultSort('-created_at')
            ->allowedIncludes(
                'customer',
                'user',
                'business',
                'items',
                'items.product',
                'payments',
                'payments.method',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return SaleResource::collection($sales);
    }

    /**
     * Procesa y registra una nueva venta en el sistema.
     */
    public function store(SaleRequest $request): JsonResponse
    {
        $businessId = app()->bound('current_business_id')
            ? app('current_business_id')
            : $request->user()?->business_id;

        $sale = $this->saleService->createSale(
            $request->validated(),
            $businessId,
            $request->user()?->id
        );

        return (new SaleResource($sale->load(['customer', 'items.product', 'payments.method'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Obtiene el detalle completo de una venta.
     */
    public function show(Sale $sale): SaleResource
    {
        return new SaleResource($sale->load(['customer', 'user', 'business', 'items.product', 'payments.method']));
    }

    /**
     * Registra un pago posterior (abono) a una venta a crédito.
     */
    public function addPayment(SalePaymentRequest $request, Sale $sale): JsonResponse
    {
        $payment = $this->saleService->addPayment($sale, $request->validated());

        return response()->json([
            'message' => 'Pago registrado correctamente.',
            'data'    => $payment,
            'sale'    => new SaleResource($sale->fresh(['payments.method', 'customer'])),
        ], 201);
    }

    /**
     * Anula una venta y retorna el inventario.
     */
    public function destroy(Sale $sale): JsonResponse
    {
        $this->saleService->cancelSale($sale);

        return response()->json([
            'message' => 'La venta ha sido anulada y el inventario restituido.',
        ], 200);
    }
}
