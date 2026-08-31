<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExpenseController extends Controller
{
    /**
     * Muestra el listado de gastos con filtros, ordenamiento, relaciones y paginación.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $expenses = QueryBuilder::for(Expense::class)
            ->allowedFilters(
                // Filtro global por concepto o notas
                AllowedFilter::scope('search'),

                // Filtros exactos por categoría y método de pago
                AllowedFilter::exact('category'),
                AllowedFilter::exact('payment_method'),
                AllowedFilter::exact('user_id'),

                // Filtros por rango de fechas
                AllowedFilter::scope('start_date', 'startDate'),
                AllowedFilter::scope('end_date', 'endDate'),
                AllowedFilter::scope('date_range', 'byDateRange'),
            )
            ->allowedSorts(
                'expense_date',
                'amount_usd',
                'amount_bs',
                'concept',
                'category',
                'created_at',
            )
            ->defaultSort('-expense_date', '-created_at')
            ->allowedIncludes(
                'user',
            )
            ->paginate($request->integer('per_page', 15))
            ->appends($request->query());

        return ExpenseResource::collection($expenses);
    }

    /**
     * Registra un nuevo egreso/gasto.
     */
    public function store(ExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create($request->validated());

        return (new ExpenseResource($expense->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Muestra un gasto específico.
     */
    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($expense->load('user'));
    }

    /**
     * Actualiza un gasto existente.
     */
    public function update(ExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $expense->update($request->validated());

        return new ExpenseResource($expense->load('user'));
    }

    /**
     * Elimina un registro de gasto.
     */
    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(null, 204);
    }

    /**
     * Obtiene un resumen numérico totalizado de egresos por rango de fechas y categoría.
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());

        $totals = Expense::query()
            ->byDateRange($startDate, $endDate)
            ->byCategory($request->query('category'))
            ->selectRaw('SUM(amount_usd) as total_usd, SUM(amount_bs) as total_bs, COUNT(id) as count')
            ->first();

        return response()->json([
            'start_date'     => $startDate,
            'end_date'       => $endDate,
            'total_usd'      => (float) ($totals->total_usd ?? 0),
            'total_bs'       => (float) ($totals->total_bs ?? 0),
            'expenses_count' => (int) ($totals->count ?? 0),
        ]);
    }
}
