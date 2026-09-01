<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BaggageClaim;
use App\Models\CctvCamera;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CctvCameraController extends Controller
{
    public function index()
    {
        $cameras = CctvCamera::with('baggageClaim:id,nomor_belt,terminal,area')
            ->orderBy('grup')
            ->orderBy('urutan')
            ->orderBy('id')
            ->get();

        $baggageClaims = BaggageClaim::orderBy('nomor_belt')
            ->get(['id', 'nomor_belt', 'terminal', 'area']);

        return Inertia::render('Admin/CctvCameras/Index', [
            'cameras' => $cameras,
            'baggageClaims' => $baggageClaims,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        CctvCamera::create($data);

        return redirect()->back()->with('success', 'Kamera CCTV ditambahkan.');
    }

    public function update(Request $request, CctvCamera $cctvCamera)
    {
        $data = $this->validateData($request);
        $cctvCamera->update($data);

        return redirect()->back()->with('success', 'Kamera CCTV diperbarui.');
    }

    public function destroy(CctvCamera $cctvCamera)
    {
        $cctvCamera->delete();
        return redirect()->back()->with('success', 'Kamera CCTV dihapus.');
    }

    private function validateData(Request $request): array
    {
        $data = $request->validate([
            'nama'                 => 'required|string|max:120',
            'lokasi'               => 'nullable|string|max:160',
            'grup'                 => 'required|string|max:64',
            'baggage_claim_id'     => 'nullable|integer|exists:baggage_claims,id',
            'jenis_stream'         => 'required|in:iframe,mjpeg,youtube',
            'url_stream'           => 'required|string|max:1000',
            'aktif'                => 'boolean',
            'urutan'               => 'nullable|integer|min:0',
            // Jendela tampil per kamera, dalam menit sejak pesawat tiba.
            // Batas 1440 = satu hari; di atas itu tidak ada artinya karena
            // pemicunya hanya melihat penerbangan hari ini.
            'tampil_mulai_menit'   => 'nullable|integer|min:0|max:1440',
            'tampil_selesai_menit' => 'nullable|integer|min:1|max:1440',
        ], [], [
            'tampil_mulai_menit'   => 'menit mulai tampil',
            'tampil_selesai_menit' => 'menit berhenti tampil',
        ]);

        $data['tampil_mulai_menit'] = (int) ($data['tampil_mulai_menit'] ?? 0);

        // Kosong = tanpa batas akhir (kamera ikut umur status penerbangan).
        $data['tampil_selesai_menit'] = ($data['tampil_selesai_menit'] ?? null) !== null
            ? (int) $data['tampil_selesai_menit']
            : null;

        // Jendela terbalik membuat kamera tidak pernah tampil sama sekali, dan
        // dari layar TV itu tidak bisa dibedakan dari stream yang mati.
        if ($data['tampil_selesai_menit'] !== null
            && $data['tampil_selesai_menit'] <= $data['tampil_mulai_menit']) {
            throw ValidationException::withMessages([
                'tampil_selesai_menit' => 'Menit berhenti harus lebih besar dari menit mulai, jika tidak kamera tidak akan pernah tampil.',
            ]);
        }

        return $data;
    }
}
