<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BaggageClaim;
use App\Models\CctvCamera;
use Illuminate\Http\Request;
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
        return $request->validate([
            'nama'             => 'required|string|max:120',
            'lokasi'           => 'nullable|string|max:160',
            'grup'             => 'required|string|max:64',
            'baggage_claim_id' => 'nullable|integer|exists:baggage_claims,id',
            'jenis_stream'     => 'required|in:iframe,mjpeg,youtube',
            'url_stream'       => 'required|string|max:1000',
            'aktif'            => 'boolean',
            'urutan'           => 'nullable|integer|min:0',
        ]);
    }
}
