<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiDirection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DirectionController extends Controller
{
    /** Kolom gambar yang bisa diunggah beserta nama field pada form. */
    private const MEDIA_FIELDS = [
        'gambar' => 'gambar_path',
        'denah'  => 'denah_path',
        'qr'     => 'qr_path',
    ];

    public function index(): Response
    {
        return Inertia::render('Admin/Taxi/Directions', [
            'directions' => TaxiDirection::orderBy('order_index')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $this->syncMedia($request, $data);

        $data['order_index'] = $data['order_index'] ?? ((int) TaxiDirection::max('order_index') + 1);
        TaxiDirection::create($data);

        return back()->with('success', 'Petunjuk arah berhasil ditambahkan.');
    }

    public function update(Request $request, TaxiDirection $direction)
    {
        $data = $this->validated($request);
        $this->syncMedia($request, $data, $direction);

        $direction->update($data);

        return back()->with('success', 'Petunjuk arah berhasil diperbarui.');
    }

    public function destroy(TaxiDirection $direction)
    {
        foreach (self::MEDIA_FIELDS as $column) {
            if ($direction->{$column}) {
                Storage::disk('public')->delete($direction->{$column});
            }
        }
        $direction->delete();

        return back()->with('success', 'Petunjuk arah berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'judul_en' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'deskripsi_en' => 'nullable|string|max:2000',
            'gambar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
            'denah' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:10240',
            'qr' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:4096',
            'qr_url' => 'nullable|string|max:500',
            'jarak_meter' => 'nullable|integer|min:0|max:100000',
            'estimasi_menit' => 'nullable|integer|min:0|max:600',
            'is_active' => 'required|boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        return collect($validated)
            ->only(['judul', 'judul_en', 'deskripsi', 'deskripsi_en', 'qr_url',
                'jarak_meter', 'estimasi_menit', 'is_active', 'order_index'])
            // order_index kosong berarti "biarkan apa adanya" — kolomnya NOT NULL.
            ->reject(fn ($value, $key) => $key === 'order_index' && $value === null)
            ->all();
    }

    /** Simpan file baru dan hapus file lama yang digantikan. */
    private function syncMedia(Request $request, array &$data, ?TaxiDirection $existing = null): void
    {
        foreach (self::MEDIA_FIELDS as $field => $column) {
            if (! $request->hasFile($field)) {
                continue;
            }
            if ($existing?->{$column}) {
                Storage::disk('public')->delete($existing->{$column});
            }
            $data[$column] = $request->file($field)->store('taxi/directions', 'public');
        }
    }
}
