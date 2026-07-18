<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class FlightRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    protected function prepareForValidation(): void
    {
        // Normalisasi hari_operasi: terima string JSON, comma-separated, array, null
        $hari = $this->input('hari_operasi');
        if (is_string($hari)) {
            $trimmed = trim($hari);
            if ($trimmed === '' || strtolower($trimmed) === 'null') {
                $hari = null;
            } elseif ($trimmed[0] === '[') {
                $decoded = json_decode($trimmed, true);
                $hari = is_array($decoded) ? $decoded : [];
            } else {
                $hari = array_values(array_filter(array_map('trim', explode(',', $trimmed))));
            }
        }
        if ($hari !== null && !is_array($hari)) {
            $hari = [];
        }

        // Konversi string kosong → null untuk field nullable
        $emptyToNull = function ($v) {
            return ($v === '' || $v === '0' || $v === 0) ? null : $v;
        };

        $this->merge([
            'gate_id'             => $emptyToNull($this->gate_id),
            'baggage_claim_id'    => $emptyToNull($this->baggage_claim_id),
            'jam_estimasi'        => $this->jam_estimasi !== '' ? $this->jam_estimasi : null,
            'jam_aktual'          => $this->jam_aktual !== '' ? $this->jam_aktual : null,
            // '', '-', 'null' → null (master tanpa tanggal). Cegah gagal validasi date.
            'tanggal_penerbangan' => in_array((string) $this->tanggal_penerbangan, ['', '-', 'null'], true) ? null : $this->tanggal_penerbangan,
            'hari_operasi'        => $hari,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tanggal_penerbangan' => 'nullable|date', // Optional for master
            'nomor_penerbangan' => 'required|string',
            'airline_id' => 'required|exists:airlines,id',
            'airport_asal_id' => 'required|exists:airports,id',
            'airport_tujuan_id' => 'required|exists:airports,id',
            'jam_jadwal' => 'required',
            'jam_estimasi' => 'nullable',
            'jam_aktual' => 'nullable',
            'tipe_layanan' => 'required|in:domestik,internasional',
            'gate_id' => 'nullable|exists:gates,id',
            'checkin_counter_ids' => 'nullable|array',
            'checkin_counter_ids.*' => 'exists:checkin_counters,id',
            'baggage_claim_id' => 'nullable|exists:baggage_claims,id',
            'status' => 'sometimes|required|string', // Master often fixed to 'Scheduled'
            'catatan' => 'nullable|string',
            'hari_operasi' => 'nullable|array', // Required for master usually
            'frekuensi_per_minggu' => 'nullable|integer',
        ];
    }
}
