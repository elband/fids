<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reason;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReasonController extends Controller
{
    public function index()
    {
        $reasons = Reason::latest()->get();
        return Inertia::render('Admin/Reasons/Index', [
            'reasons' => $reasons,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:reasons',
            'deskripsi' => 'required|string',
            'kategori' => 'nullable|string',
            'status_aktif' => 'boolean',
        ]);

        Reason::create($validated);
        return redirect()->back()->with('success', 'Reason berhasil ditambahkan.');
    }

    public function update(Request $request, Reason $reason)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:reasons,kode,' . $reason->id,
            'deskripsi' => 'required|string',
            'kategori' => 'nullable|string',
            'status_aktif' => 'boolean',
        ]);

        $reason->update($validated);
        return redirect()->back()->with('success', 'Reason berhasil diupdate.');
    }

    public function destroy(Reason $reason)
    {
        $reason->delete();
        return redirect()->back()->with('success', 'Reason berhasil dihapus.');
    }
}
