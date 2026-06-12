<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Remark;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RemarkController extends Controller
{
    public function index()
    {
        $remarks = Remark::latest()->get();
        return Inertia::render('Admin/Remarks/Index', [
            'remarks' => $remarks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:remarks',
            'nama_remark' => 'required|string',
            'status_aktif' => 'boolean',
        ]);

        Remark::create($validated);
        return redirect()->back()->with('success', 'Remark berhasil ditambahkan.');
    }

    public function update(Request $request, Remark $remark)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:remarks,kode,' . $remark->id,
            'nama_remark' => 'required|string',
            'status_aktif' => 'boolean',
        ]);

        $remark->update($validated);
        return redirect()->back()->with('success', 'Remark berhasil diupdate.');
    }

    public function destroy(Remark $remark)
    {
        $remark->delete();
        return redirect()->back()->with('success', 'Remark berhasil dihapus.');
    }
}
