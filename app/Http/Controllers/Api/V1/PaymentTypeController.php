<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTypeResource;
use App\Models\PaymentType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentTypeController extends Controller
{
    use ApiResponse;
    /**
     * Lista los tipos de pago configurados con filtros, ordenamiento, relaciones y paginación.
     */
    public function index(Request $request): JsonResponse
    {
       $paymentTypes = PaymentType::query()
            ->active()
            ->orderBy('name')
            ->get();

         return $this->successResponse(
            PaymentTypeResource::collection($paymentTypes)->response()->getData(true),
            'Tipos de métodos de pago obtenidos exitosamente'
        );
    }
}
