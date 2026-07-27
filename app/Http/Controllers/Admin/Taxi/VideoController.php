<?php

namespace App\Http\Controllers\Admin\Taxi;

use App\Http\Controllers\Controller;
use App\Models\TaxiVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class VideoController extends Controller
{
    public function index(): Response
    {
        $videos = TaxiVideo::orderBy('order_index')->orderBy('id')->get();

        return Inertia::render('Admin/Taxi/Videos', [
            'videos' => $videos->map(fn (TaxiVideo $v) => [
                ...$v->only([
                    'id', 'judul', 'durasi_detik', 'playlist', 'hari',
                    'is_active', 'order_index', 'play_count', 'total_play_seconds',
                ]),
                'url' => $v->file_path ? '/storage/' . $v->file_path : null,
                'thumbnail_url' => $v->thumbnail_path ? '/storage/' . $v->thumbnail_path : null,
                'last_played_at' => $v->last_played_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, required: true);

        $data['file_path'] = $request->file('video')->store('taxi/videos', 'public');
        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('taxi/thumbnails', 'public');
        }
        $data['order_index'] = $data['order_index'] ?? ((int) TaxiVideo::max('order_index') + 1);

        TaxiVideo::create($data);

        return back()->with('success', 'Video berhasil ditambahkan ke playlist.');
    }

    public function update(Request $request, TaxiVideo $video)
    {
        $data = $this->validated($request, required: false);

        if ($request->hasFile('video')) {
            Storage::disk('public')->delete($video->file_path);
            $data['file_path'] = $request->file('video')->store('taxi/videos', 'public');
        }
        if ($request->hasFile('thumbnail')) {
            if ($video->thumbnail_path) {
                Storage::disk('public')->delete($video->thumbnail_path);
            }
            $data['thumbnail_path'] = $request->file('thumbnail')->store('taxi/thumbnails', 'public');
        }

        $video->update($data);

        return back()->with('success', 'Video berhasil diperbarui.');
    }

    public function destroy(TaxiVideo $video)
    {
        Storage::disk('public')->delete(array_filter([$video->file_path, $video->thumbnail_path]));
        $video->delete();

        return back()->with('success', 'Video berhasil dihapus.');
    }

    /** Reset statistik pemutaran satu video. */
    public function resetStats(TaxiVideo $video)
    {
        $video->forceFill([
            'play_count' => 0,
            'total_play_seconds' => 0,
            'last_played_at' => null,
        ])->save();

        return back()->with('success', 'Statistik pemutaran direset.');
    }

    private function validated(Request $request, bool $required): array
    {
        $data = $request->validate([
            'judul' => 'required|string|max:255',
            // 200 MB — sejalan dengan batas unggah modul Advertisement.
            'video' => ($required ? 'required' : 'nullable') . '|file|mimetypes:video/mp4|max:204800',
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
            'durasi_detik' => 'nullable|integer|min:1|max:36000',
            'playlist' => 'required|in:all,pagi,siang,malam',
            'hari' => 'nullable|array',
            'hari.*' => 'integer|min:0|max:6',
            'is_active' => 'required|boolean',
            'order_index' => 'nullable|integer|min:0',
        ]);

        unset($data['video'], $data['thumbnail']);
        if (($data['order_index'] ?? null) === null) {
            unset($data['order_index']);
        }

        return $data;
    }
}
