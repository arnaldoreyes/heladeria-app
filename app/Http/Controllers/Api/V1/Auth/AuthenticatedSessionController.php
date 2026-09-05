<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Business;
use App\Models\BusinessSetting;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
   public function register(RegisterRequest $request): JsonResponse
{
    // 1. Extraer los datos ya validados por RegisterRequest
    $validated = $request->validated();

    $data = DB::transaction(function () use ($validated) {
        // 2. Crear el Negocio
        $business = Business::create([
            'name'   => $validated['businessName'],
            'slug'   => Str::slug($validated['businessName']) . '-' . Str::lower(Str::random(5)),
            'niche'  => $validated['nicho'],
            'status' => 'active',
        ]);

        // 3. Crear las Configuraciones
        BusinessSetting::create([
            'business_id'                     => $business->id,
            'bcv_mode'                        => 'auto',
            'default_profit_percentage'       => $validated['personalProfitPercent'],
            'default_reinvestment_percentage' => $validated['businessFundPercent'],
            'print_ticket_on_sale'            => true,
        ]);

        // 4. Crear el Usuario Propietario
        $user = User::create([
            'name'        => $validated['ownerName'],
            'email'       => $validated['email'],
            'password'    => $validated['password'],
            'business_id' => $business->id,
        ]);

        // 5. Asignar Rol garantizando su existencia para el guard 'sanctum'
        $role =Role::where( 'name', 'owner')->first();
        $user->assignRole($role);

        // 6. Generar Bearer Token
        $expiresAt = now()->addHours(8);
        $token = $user->createToken(
            name: 'session_token',
            abilities: ['*'],
            expiresAt: $expiresAt
        )->plainTextToken;

        return [
            'user'       => $user,
            'token'      => $token,
            'expires_at' => $expiresAt,
        ];
    });

    return response()->json([
        'message'      => 'Registro completado con éxito.',
        'access_token' => $data['token'],
        'token_type'   => 'Bearer',
        'expires_at'   => $data['expires_at']->toIso8601String(),
        'user'         => $this->formatUserData($data['user']),
    ], 201);
}

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
            'user'         => $this->formatUserData($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUserData($request->user()),
        ]);
    }

    public function checkStatus(Request $request): JsonResponse
    {
        return response()->json([
            'user'  => $this->formatUserData($request->user()),
            'token' => $request->bearerToken(),
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $currentToken = $request->user()->currentAccessToken();
        $expiresAt    = $currentToken->expires_at ?? now()->addHours(8);

        $currentToken->delete();

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

    private function formatUserData(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'business_id' => $user->business_id,
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}