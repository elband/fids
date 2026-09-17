<?php

namespace App\Rules;

use App\Models\Remark;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Status penerbangan harus berupa remark aktif. Status yang sudah melekat pada
 * penerbangan tetap diterima walau remark-nya kini nonaktif, supaya penyuntingan
 * kolom lain tidak gagal hanya karena remark tersebut dimatikan.
 */
class ActiveRemarkStatus implements ValidationRule
{
    public function __construct(private ?string $currentStatus = null)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->currentStatus !== null && $value === $this->currentStatus) {
            return;
        }

        // Dicocokkan persis di PHP: collation MySQL tidak peka huruf besar, sedangkan
        // layar publik membandingkan teks status secara persis.
        if (! in_array($value, Remark::active()->pluck('nama_remark')->all(), true)) {
            $fail('Status harus dipilih dari daftar Remark yang aktif.');
        }
    }
}
