<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index()
    {
        return response()->json(Company::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_km' => 'required|integer',
            'time_in' => 'required',
            'time_late' => 'required',
            'time_out' => 'required',
        ]);

        $company = Company::create($validated);
        return response()->json($company, 201);
    }

    public function show($id)
    {
        return response()->json(Company::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'radius_km' => 'sometimes|integer',
            'time_in' => 'sometimes',
            'time_late' => 'sometimes',
            'time_out' => 'sometimes',
        ]);

        $company->update($validated);
        return response()->json($company);
    }

    public function destroy($id)
    {
        Company::destroy($id);
        return response()->json(['message' => 'Company deleted']);
    }
}
