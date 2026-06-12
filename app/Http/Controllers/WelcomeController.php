<?php

namespace App\Http\Controllers;

use App\Models\DisplaySetting;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $setting = DisplaySetting::first();
        $timezone = \App\Support\DisplayTimezone::get();

        return Inertia::render('Welcome', [
            'namaBandara' => $setting?->nama_bandara ?? 'FIDS Airport',
            'timezone' => $timezone,
        ]);
    }
}
