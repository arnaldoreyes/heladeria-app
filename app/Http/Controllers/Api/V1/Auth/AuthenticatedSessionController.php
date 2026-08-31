<?php

namespacesuperadmin App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $remember  = $request->boolean('remember');
        $expiresAt = $remember ? now()->addDays(30) : now()->addHours(8);

        // Generar Bearer Token para Sanctum
        $token = $user->createToken(
            name: $remember ? 'remember_token' : 'session_token',
            abilities: ['*'],
            expiresAt: $expiresAt
        )->plainTextToken;

        return response()->json([
            'message'      => 'Inicio de sesión exitoso.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt->toIso8601String(),
            'user'         => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'business_id' => $user->business_id,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Revocar el token actual del usuario
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'business_id' => $user->business_id,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $currentToken = $request->user()->currentAccessToken();
        $expiresAt = $currentToken->expires_at ?? now()->addHours(8);

        // 1. Eliminar el token actual que hizo la petición
        $currentToken->delete();

        // 2. Generar un nuevo token con nueva fecha de caducidad
        $newToken = $request->user()->createToken(
            name: 'session_token',
            abilities: ['*'],
            expiresAt: $expiresAt
        )->plainTextToken;

        return response()->json([
            'message'      => 'Token renovado correctamente.',
            'access_token' => $newToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt->toIso8601String(),
        ]);
    }
}
