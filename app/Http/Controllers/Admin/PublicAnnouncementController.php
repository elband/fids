<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AudioService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicAnnouncementController extends Controller
{
    public function __construct(protected AudioService $audioService) {}

    public function index()
    {
        // Auto-cleanup: hapus pengumuman yang sudah mencapai batas pemutaran (sisa putar = 0)
        Announcement::whereColumn('broadcast_count', '>=', 'max_broadcasts')->delete();

        $announcements = Announcement::latest()->paginate(10);

        return Inertia::render('Admin/PublicAnnouncement/Index', [
            'announcements'      => $announcements,
            'missingDependencies' => $this->audioService->getMissingDependencies(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul'            => 'required|string|max:255',
            'isi_pengumuman'   => ['required', 'string', 'regex:/^[a-zA-Z0-9\s,\.]+$/u'],
            'bahasa'           => 'required|string',
            'target'           => 'required|string',
            'mode'             => 'required|string',
            'max_broadcasts'   => 'required|integer|min:1|max:99',
            'interval_pemutaran' => 'required|integer|min:1|max:60',
        ], [
            'isi_pengumuman.regex' => 'Isi pengumuman hanya boleh mengandung huruf, angka, spasi, koma (,), dan titik (.).',
        ]);

        Announcement::create([
            'judul'              => $request->judul,
            'isi_pengumuman'     => $request->isi_pengumuman,
            'bahasa'             => $request->bahasa,
            'target'             => $request->target,
            'mode'               => $request->mode,
            'max_broadcasts'     => $request->max_broadcasts,
            'interval_pemutaran' => $request->interval_pemutaran,
            'tipe'               => 'pas',
            'kategori'           => 'PAS',
            'mulai_tayang'       => now(),
            'status_aktif'       => true,
            'broadcast_count'    => 0,
        ]);

        return redirect()->back()->with('success', 'Pengumuman berhasil dibuat.');
    }

    public function update(Request $request, Announcement $public_announcement)
    {
        $request->validate([
            'judul'            => 'required|string|max:255',
            'isi_pengumuman'   => ['required', 'string', 'regex:/^[a-zA-Z0-9\s,\.]+$/u'],
            'bahasa'           => 'required|string',
            'target'           => 'required|string',
            'mode'             => 'required|string',
            'max_broadcasts'   => 'required|integer|min:1|max:99',
            'interval_pemutaran' => 'required|integer|min:1|max:60',
        ], [
            'isi_pengumuman.regex' => 'Isi pengumuman hanya boleh mengandung huruf, angka, spasi, koma (,), dan titik (.).',
        ]);

        $public_announcement->update([
            'judul'              => $request->judul,
            'isi_pengumuman'     => $request->isi_pengumuman,
            'bahasa'             => $request->bahasa,
            'target'             => $request->target,
            'mode'               => $request->mode,
            'max_broadcasts'     => $request->max_broadcasts,
            'interval_pemutaran' => $request->interval_pemutaran,
            // reset count when rules change
            'broadcast_count'    => 0,
            'last_broadcast_at'  => null,
        ]);

        return redirect()->back()->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Announcement $public_announcement)
    {
        $public_announcement->delete();
        return redirect()->back()->with('success', 'Pengumuman berhasil dihapus.');
    }

    public function broadcast(Announcement $public_announcement)
    {
        $public_announcement->update([
            'last_broadcast_at' => now()->subMinutes(10),
            'broadcast_count'   => 0,
        ]);

        return redirect()->back()->with('success', 'Pengumuman telah dijadwalkan untuk siaran segera.');
    }

    public function incrementCount(Announcement $public_announcement)
    {
        $public_announcement->increment('broadcast_count');
        $public_announcement->update(['last_broadcast_at' => now()]);

        // Auto-delete when play count reaches the max
        if ($public_announcement->broadcast_count >= $public_announcement->max_broadcasts) {
            $public_announcement->delete();
            return response()->json(['success' => true, 'deleted' => true]);
        }

        return response()->json(['success' => true, 'deleted' => false]);
    }
}
