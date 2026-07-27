<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiFare;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FareController extends Controller
{
    public function index(): Response
    {
        $fares = TaxiFare::orderBy('wilayah')->orderBy('order_index')->orderBy('tujuan')->get();

        return Inertia::render('Admin/Taxi/Fares', [
            'fares' => $fares->map(fn (TaxiFare $f) => [
                ...$f->only([
                    'id', 'wilayah', 'tujuan', 'jenis_kendaraan', 'tarif', 'tarif_sebelumnya',
                    'is_active', 'order_index',
                ]),
                'berlaku_mulai' => $f->berlaku_mulai?->toDateString(),
                'berlaku_sampai' => $f->berlaku_sampai?->toDateString(),
                'baru' => $f->isRecentlyChanged(),
            ]),
            'wilayahList' => $fares->pluck('wilayah')->unique()->sort()->values(),
        ]);
    }

    public function store(Request $request)
    {
        TaxiFare::create($this->validated($request));

        return back()->with('success', 'Tarif berhasil ditambahkan.');
    }

    public function update(Request $request, TaxiFare $fare)
    {
        // tarif_sebelumnya diisi otomatis oleh model saat nominal berubah.
        $fare->update($this->validated($request));

        return back()->with('success', 'Tarif berhasil diperbarui.');
    }

    public function destroy(TaxiFare $fare)
    {
        $fare->delete();

        return back()->with('success', 'Tarif berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'wilayah' => 'required|string|max:100',
            'tujuan' => 'required|string|max:150',
            'jenis_kendaraan' => 'required|string|max:100',
            'tarif' => 'required|integer|min:0|max:99999999',
            'berlaku_mulai' => 'nullable|date',
            'berlaku_sampai' => 'nullable|date|after_or_equal:berlaku_mulai',
            'is_active' => 'required|boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $data['order_index'] = $data['order_index'] ?? 0;

        return $data;
    }
}
