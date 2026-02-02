<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class adminController extends Controller
{
    // Ambil semua user berdasarkan role (opsional)
    public function index(Request $request)
    {
        $role = $request->query('role');
        
        if ($role) {
            $users = User::where('role', $role)->get();
        } else {
            $users = User::all();
        }
        
        return response()->json($users);
    }

    // Tambah user baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required',
            'role' => 'required|in:karyawan,admin,magang',
            'company_id' => 'nullable|exists:companies,id',
            'allowed_companies' => 'nullable|array'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'company_id' => $request->company_id,
            'allowed_companies' => $request->allowed_companies,
        ]);

        return response()->json($user, 201);
    }

    // Update user
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'email' => $request->email && $request->email !== $user->email 
                ? 'required|email|unique:users' 
                : 'required|email',
            'role' => 'required|in:karyawan,admin,magang',
            'allowed_companies' => 'nullable|array'
        ]);

        $updateData = [
            'name' => $request->name ?? $user->name,
            'email' => $request->email ?? $user->email,
            'role' => $request->role ?? $user->role,
            'company_id' => $request->company_id ?? $user->company_id,
            'allowed_companies' => $request->allowed_companies ?? $user->allowed_companies
        ];

        if ($request->password) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json($user);
    }

    // Hapus user
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        
        return response()->json([
            'message' => ucfirst($user->role) . ' berhasil dihapus'
        ]);
    }
}
