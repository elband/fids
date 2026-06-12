<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAirlineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $airlineId = $this->route('airline')?->id;

        return [
            'kode_maskapai'  => "required|string|unique:airlines,kode_maskapai,{$airlineId}",
            'nama_maskapai'  => 'required|string',
            'logo'           => 'nullable|image|max:2048',
            'warna_identitas' => 'nullable|string',
            'status_aktif'   => 'boolean',
        ];
    }
}
