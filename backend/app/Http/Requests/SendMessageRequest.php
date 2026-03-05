<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    public function rules(): array
    {
        return [
            'message' => 'nullable|string|max:5000',
            'file' => 'nullable|mimes:jpg,jpeg,png,gif,mp4,webm,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar,7z,tar,weba,wav,m4a,mp3,oga,ogg,opus|max:51200',
            'reply_to_message_id' => 'nullable|integer|exists:messages,id',
        ];
    }
}
