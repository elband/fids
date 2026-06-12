<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAirlineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kode_maskapai'  => 'required|string|unique:airlines',
            'nama_maskapai'  => 'required|string',
            'logo'           => 'nullable|image|max:2048',
            'warna_identitas' => 'nullable|string',
            'status_aktif'   => 'boolean',
        ];
    }
}
