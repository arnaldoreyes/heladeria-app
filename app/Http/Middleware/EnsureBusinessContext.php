<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBusinessContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->hasRole('superadmin')) {
            return $next($request);
        }

        // Verificar que el usuario tenga un negocio asociado
        if (! $user || ! $user->business_id) {
            return response()->json([
                'message' => 'Acceso denegado. El usuario no está asociado a ningún negocio activo.'
            ], Response::HTTP_FORBIDDEN);
        }

        // Verificar si el negocio está activo/habilitado
        if ($user->business && isset($user->business->is_active) && ! $user->business->is_active) {
            return response()->json([
                'message' => 'El negocio se encuentra inactivo o suspendido.'
            ], Response::HTTP_FORBIDDEN);
        }

        // Registrar el business_id en el contenedor para acceso global rápido durante el Request
        app()->instance('current_business_id', $user->business_id);

        return $next($request);
    }
}
