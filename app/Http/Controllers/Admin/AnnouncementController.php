<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $announcements = \App\Models\Announcement::latest()->get();
        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => $announcements
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'isi_pengumuman' => 'required|string',
            'kategori' => 'required|string',
            'prioritas' => 'required|integer',
            'status_aktif' => 'boolean',
            'bahasa' => 'required|string',
            'target' => 'required|string',
            'mode' => 'required|string',
            'tipe' => 'required|string',
            'max_broadcasts' => 'required|integer',
        ]);

        $validated['mulai_tayang'] = now();

        \App\Models\Announcement::create($validated);

        return redirect()->back()->with('success', 'Pengumuman berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
