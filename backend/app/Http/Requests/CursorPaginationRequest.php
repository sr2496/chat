<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CursorPaginationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'limit' => 'integer|min:1|max:100',
            'after_id' => 'nullable|integer',
            'before_id' => 'nullable|integer',
        ];
    }

    public function getLimit(int $default = 20): int
    {
        return (int) $this->get('limit', $default);
    }

    public function getAfterId(): ?int
    {
        return $this->get('after_id') ? (int) $this->get('after_id') : null;
    }

    public function getBeforeId(): ?int
    {
        return $this->get('before_id') ? (int) $this->get('before_id') : null;
    }
}
