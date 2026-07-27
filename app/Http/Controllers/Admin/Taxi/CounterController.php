<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiCounter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CounterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Taxi/Counters', [
            'counters' => TaxiCounter::orderBy('order_index')->orderBy('nomor')->get(),
            'arrows' => TaxiCounter::ARROWS,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['order_index'] = $data['order_index'] ?? ((int) TaxiCounter::max('order_index') + 1);

        TaxiCounter::create($data);

        return back()->with('success', 'Counter taksi berhasil ditambahkan.');
    }

    public function update(Request $request, TaxiCounter $counter)
    {
        $counter->update($this->validated($request));

        return back()->with('success', 'Counter taksi berhasil diperbarui.');
    }

    public function destroy(TaxiCounter $counter)
    {
        $counter->delete();

        return back()->with('success', 'Counter taksi berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'nomor' => 'required|string|max:10',
            'nama_operator' => 'required|string|max:120',
            'jenis_layanan' => 'nullable|string|max:60',
            'arah' => ['required', Rule::in(TaxiCounter::ARROWS)],
            'is_active' => 'required|boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        // order_index kosong berarti "biarkan apa adanya" — kolomnya NOT NULL.
        if (($data['order_index'] ?? null) === null) {
            unset($data['order_index']);
        }

        return $data;
    }
}
