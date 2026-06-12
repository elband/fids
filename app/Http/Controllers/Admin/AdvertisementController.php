<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AdvertisementController extends Controller
{
    public function index()
    {
        $ads = Advertisement::orderBy('order_index')->get();
        return Inertia::render('Admin/AdvertisementManagement/Index', [
            'ads' => $ads
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,mp4,mov,avi|max:204800',
            'media_type' => 'required|in:image,video',
            'duration' => 'required|integer|min:1',
            'status' => 'required|string',
        ]);

        $data = $request->only(['title', 'media_type', 'duration', 'status']);
        
        if ($request->hasFile('media')) {
            $data['media_path'] = $request->file('media')->store('advertisements', 'public');
        }

        Advertisement::create($data);

        return redirect()->back()->with('success', 'Iklan berhasil ditambahkan.');
    }

    public function update(Request $request, Advertisement $advertisement)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,mp4,mov,avi|max:204800',
            'media_type' => 'required|in:image,video',
            'duration' => 'required|integer|min:1',
            'status' => 'required|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        $data = $request->only(['title', 'media_type', 'duration', 'status']);
        if ($request->filled('order_index')) {
            $data['order_index'] = (int) $request->input('order_index');
        }

        if ($request->hasFile('media')) {
            // Delete old media if exists
            if ($advertisement->media_path) {
                Storage::disk('public')->delete($advertisement->media_path);
            }
            $data['media_path'] = $request->file('media')->store('advertisements', 'public');
        }

        $advertisement->update($data);

        return redirect()->back()->with('success', 'Iklan berhasil diperbarui.');
    }

    public function destroy(Advertisement $advertisement)
    {
        if ($advertisement->media_path) {
            Storage::disk('public')->delete($advertisement->media_path);
        }
        $advertisement->delete();

        return redirect()->back()->with('success', 'Iklan berhasil dihapus.');
    }

    public function updateOrder(Request $request)
    {
        $orders = $request->input('orders'); // Array of {id, order_index}
        foreach ($orders as $order) {
            Advertisement::where('id', $order['id'])->update(['order_index' => $order['order_index']]);
        }
        return response()->json(['success' => true]);
    }
}
