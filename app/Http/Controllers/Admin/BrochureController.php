<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DisplaySetting;
use Barryvdh\DomPDF\Facade\Pdf;

class BrochureController extends Controller
{
    public function download()
    {
        $setting = DisplaySetting::first();

        $pdf = Pdf::loadView('brochure', [
            'nama_bandara' => $setting?->nama_bandara ?? 'Airport FIDS',
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download('FIDS_Brosur_' . date('Y') . '.pdf');
    }
}
