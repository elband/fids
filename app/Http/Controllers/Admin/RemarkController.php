<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Flight;
use App\Models\Remark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Master Remark = daftar status penerbangan pada dropdown Keberangkatan/Kedatangan.
 *
 * Remark sistem (status inti yang dibaca layar publik) tidak boleh diganti nama
 * atau dihapus; 'Scheduled' juga tidak boleh dinonaktifkan karena menjadi status
 * awal setiap penerbangan.
 */
class RemarkController extends Controller
{
    private const ALWAYS_ACTIVE = 'Scheduled';

    public function index()
    {
        $usage = Flight::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $remarks = Remark::orderByDesc('is_system')->orderBy('nama_remark')->get()
            ->each(fn (Remark $r) => $r->setAttribute('flights_count', (int) ($usage[$r->nama_remark] ?? 0)));

        return Inertia::render('Admin/Remarks/Index', [
            'remarks' => $remarks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:remarks',
            'nama_remark' => 'required|string|max:50|unique:remarks',
            'status_aktif' => 'boolean',
        ]);
        $validated['nama_remark'] = trim($validated['nama_remark']);

        Remark::create($validated);
        return redirect()->back()->with('success', 'Remark berhasil ditambahkan.');
    }

    public function update(Request $request, Remark $remark)
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:remarks,kode,' . $remark->id,
            'nama_remark' => 'required|string|max:50|unique:remarks,nama_remark,' . $remark->id,
            'status_aktif' => 'boolean',
        ]);
        $validated['nama_remark'] = trim($validated['nama_remark']);

        if ($remark->is_system && $validated['nama_remark'] !== $remark->nama_remark) {
            throw ValidationException::withMessages([
                'nama_remark' => 'Nama remark sistem tidak dapat diubah karena dipakai layar display.',
            ]);
        }

        if ($remark->nama_remark === self::ALWAYS_ACTIVE && array_key_exists('status_aktif', $validated) && ! $validated['status_aktif']) {
            throw ValidationException::withMessages([
                'status_aktif' => 'Remark Scheduled tidak dapat dinonaktifkan karena menjadi status awal penerbangan.',
            ]);
        }

        DB::transaction(function () use ($remark, $validated) {
            $oldName = $remark->nama_remark;
            $remark->update($validated);

            // Status disimpan sebagai teks, jadi ganti nama harus ikut ke penerbangan.
            if ($oldName !== $remark->nama_remark) {
                Flight::where('status', $oldName)->update(['status' => $remark->nama_remark]);
            }
        });

        return redirect()->back()->with('success', 'Remark berhasil diupdate.');
    }

    public function destroy(Remark $remark)
    {
        if ($remark->is_system) {
            return redirect()->back()->with('error', 'Remark sistem tidak dapat dihapus. Nonaktifkan saja bila tidak dipakai.');
        }

        if (($inUse = $remark->flightsInUse()) > 0) {
            return redirect()->back()->with('error', "Remark masih dipakai {$inUse} penerbangan. Ganti status penerbangan tersebut atau nonaktifkan remark ini.");
        }

        $remark->delete();
        return redirect()->back()->with('success', 'Remark berhasil dihapus.');
    }
}
