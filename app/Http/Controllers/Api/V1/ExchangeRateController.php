<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExchangeRateRequest;
use App\Http\Resources\ExchangeRateResource;
use App\Models\ExchangeRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExchangeRateController extends Controller
{
    /**
     * Muestra el historial de tasas de cambio con filtros por tipo, fecha y estado.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $rates = QueryBuilder::for(ExchangeRate::class)
            ->allowedFilters(
                // Filtro directo por columna tipo
                AllowedFilter::exact('type'),
                AllowedFilter::scope('by_type', 'byType'),

                // Filtro por tasa activa (por scope o columna)
                AllowedFilter::scope('current'),
                AllowedFilter::scope('current_only', 'current'),
                AllowedFilter::exact('is_current'),

                // Filtro histórico por fecha efectiva
                AllowedFilter::scope('effective_on', 'effectiveOn'),
            )
            ->allowedSorts(
                'rate',
                'type',
                'effective_at',
                'created_at',
            )
            ->defaultSort('-effective_at', '-created_at')
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return ExchangeRateResource::collection($rates);
    }

    /**
     * Registra una nueva tasa de cambio y la establece como activa opcionalmente.
     */
    public function store(ExchangeRateRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! isset($data['is_current'])) {
            $data['is_current'] = true;
        }

        $exchangeRate = DB::transaction(fn () => ExchangeRate::create($data));

        return (new ExchangeRateResource($exchangeRate))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Obtiene los detalles de un registro de tasa histórico.
     */
    public function show(ExchangeRate $exchangeRate): ExchangeRateResource
    {
        return new ExchangeRateResource($exchangeRate);
    }

    /**
     * Obtiene la tasa de cambio actualmente activa para un tipo específico (ej. BCV).
     */
    public function current(Request $request): JsonResponse|ExchangeRateResource
    {
        $type = $request->query('type', 'BCV');
        $rate = ExchangeRate::getActiveRate($type);

        if (! $rate) {
            return response()->json([
                'message' => "No se encontró una tasa de cambio activa para el tipo: {$type}.",
            ], 404);
        }

        return new ExchangeRateResource($rate);
    }

    /**
     * Actualiza un registro de tasa de cambio.
     */
    public function update(ExchangeRateRequest $request, ExchangeRate $exchangeRate): ExchangeRateResource
    {
        DB::transaction(fn () => $exchangeRate->update($request->validated()));

        return new ExchangeRateResource($exchangeRate);
    }

    /**
     * Elimina un registro de tasa de cambio.
     */
    public function destroy(ExchangeRate $exchangeRate): JsonResponse
    {
        if ($exchangeRate->is_current) {
            return response()->json([
                'message' => 'No se puede eliminar la tasa de cambio que se encuentra actualmente activa.',
            ], 422);
        }

        $exchangeRate->delete();

        return response()->json(null, 204);
    }
}
