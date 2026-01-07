<?php

namespace App\Http\Controllers;

use App\Events\VideoCallAnswer;
use App\Events\VideoCallCandidate;
use App\Events\VideoCallOffer;
use Illuminate\Http\Request;

class VideoCallController extends Controller
{
    public function offer(Request $request)
    {
        $data = $request->validate([
            'offer' => 'required',
            'to_user_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        broadcast(new VideoCallOffer(
            $data['offer'], 
            $data['to_user_id'], 
            $user->id,
            [
                'name' => $user->name,
                'avatar' => $user->avatar_url,
            ]
        ));

        return response()->json(['status' => 'Offer sent']);
    }

    public function answer(Request $request)
    {
        $data = $request->validate([
            'answer' => 'required',
            'to_user_id' => 'required|exists:users,id',
        ]);

        broadcast(new VideoCallAnswer($data['answer'], $data['to_user_id'], $request->user()->id));

        return response()->json(['status' => 'Answer sent']);
    }

    public function candidate(Request $request)
    {
        $data = $request->validate([
            'candidate' => 'required',
            'to_user_id' => 'required|exists:users,id',
        ]);

        broadcast(new VideoCallCandidate($data['candidate'], $data['to_user_id'], $request->user()->id));

        return response()->json(['status' => 'Candidate sent']);
    }

    public function end(Request $request)
    {
        $data = $request->validate([
            'to_user_id' => 'required|exists:users,id',
        ]);

        broadcast(new \App\Events\VideoCallEnd($data['to_user_id'], $request->user()->id));

        return response()->json(['status' => 'Call ended']);
    }
}
