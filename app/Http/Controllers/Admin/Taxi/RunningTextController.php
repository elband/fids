<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiRunningText;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RunningTextController extends Controller
{
    public function index(): Response
    {
        $texts = TaxiRunningText::orderByDesc('prioritas')->orderBy('id')->get();

        return Inertia::render('Admin/Taxi/RunningTexts', [
            'texts' => $texts->map(fn (TaxiRunningText $t) => [
                ...$t->only(['id', 'pesan', 'pesan_en', 'warna', 'prioritas', 'is_active']),
                // Format datetime-local agar langsung bisa dipakai input HTML.
                'mulai_at' => $t->mulai_at?->format('Y-m-d\TH:i'),
                'selesai_at' => $t->selesai_at?->format('Y-m-d\TH:i'),
                'sedang_tayang' => $t->is_active
                    && ($t->mulai_at === null || $t->mulai_at->isPast())
                    && ($t->selesai_at === null || $t->selesai_at->isFuture()),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        TaxiRunningText::create($this->validated($request));

        return back()->with('success', 'Running text berhasil ditambahkan.');
    }

    public function update(Request $request, TaxiRunningText $running_text)
    {
        $running_text->update($this->validated($request));

        return back()->with('success', 'Running text berhasil diperbarui.');
    }

    public function destroy(TaxiRunningText $running_text)
    {
        $running_text->delete();

        return back()->with('success', 'Running text berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'pesan' => 'required|string|max:1000',
            'pesan_en' => 'nullable|string|max:1000',
            'warna' => 'required|string|max:20',
            'prioritas' => 'nullable|integer|min:0|max:999',
            'mulai_at' => 'nullable|date',
            'selesai_at' => 'nullable|date|after_or_equal:mulai_at',
            'is_active' => 'required|boolean',
        ]);

        $data['prioritas'] = $data['prioritas'] ?? 0;

        return $data;
    }
}
