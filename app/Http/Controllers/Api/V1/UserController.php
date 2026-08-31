<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkActionRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest; // Archivo faltante sugerido
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService; // Sugerencia de servicio
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(private UserService $userService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $users = User::with(['business', 'roles', 'permissions'])->paginate(15);
        return UserResource::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request): UserResource
    {
        $user = $this->userService->createUser($request->validated());
        $user->load(['business', 'roles', 'permissions']);
        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): UserResource
    {
        $user->load(['business', 'roles', 'permissions']);
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user): UserResource
    {
        $user = $this->userService->updateUser($user, $request->validated());
        $user->load(['business', 'roles', 'permissions']);
        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->userService->deleteUser($user);
        return response()->json(null, 204);
    }

    /**
     * Eliminar múltiples usuarios en lote.
     */
    public function bulkDestroy(BulkActionRequest $request): JsonResponse
    {
        $deletedCount = $this->userService->bulkDelete($request->validated('ids'));
        return response()->json([
            'message' => "Se eliminaron {$deletedCount} usuarios correctamente.",
            'deleted_count' => $deletedCount,
        ], 200);
    }
}
