<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Business;
use App\Models\BusinessSetting;
use App\Models\Role;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    use ApiResponse;

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

    return $this->successResponse([
        'access_token' => $data['token'],
        'token_type'   => 'Bearer',
        'expires_at'   => $data['expires_at']->toIso8601String(),
        'user'         => $this->formatUserData($data['user']),
        'business'     => $this->formatBuisnessData($data['user']),
    ], 'Registro completado con éxito.', 201);
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

        $user->load( 'roles', 'permissions', 'business.settings');

        $remember  = $request->boolean('remember');
        $expiresAt = $remember ? now()->addDays(30) : now()->addHours(8);

        $token = $user->createToken(
            name: $remember ? 'remember_token' : 'session_token',
            abilities: ['*'],
            expiresAt: $expiresAt
        )->plainTextToken;

        return $this->successResponse([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt->toIso8601String(),
            'user'         => $this->formatUserData($user),
            'business'     => $this->formatBuisnessData($user),
        ], 'Inicio de sesión exitoso.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->successResponse(null, 'Sesión cerrada correctamente.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => $this->formatUserData($request->user()),
        ]);
    }

    public function checkStatus(Request $request): JsonResponse
    {
        return $this->successResponse([
            'access_token' => $request->bearerToken(),
            'token_type'   => 'Bearer',
            'expires_at'   => $request->user()->currentAccessToken()->expires_at->toIso8601String(),
            'user'         => $this->formatUserData($request->user()),
            'business'     => $this->formatBuisnessData($request->user()),
        ],  'Registro completado con éxito.',  201);
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

        return $this->successResponse([
            'access_token' => $newToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt->toIso8601String(),
        ],  'Token renovado correctamente.');
    }

    private function formatUserData(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
    private function formatBuisnessData(User $user): array
    {
        return [
            'id'   => $user->business->id,
            'name' => $user->business->name,
            'slug' => $user->business->slug,
            'niche'  =>  $user->business->niche,
            'status' =>  $user->business->status,            
            'bcv_mode'                        =>  $user->business->settings->bcv_mode,
            'default_profit_percentage'       => $user->business->settings->default_profit_percentage,
            'default_reinvestment_percentage' => $user->business->settings->default_reinvestment_percentage,
            'print_ticket_on_sale'            => $user->business->settings->print_ticket_on_sale,
            'ticket_header_notes'             => $user->business->settings->ticket_header_notes,
            'ticket_footer_notes'             => $user->business->settings->ticket_footer_notes,
        ];
    }
}