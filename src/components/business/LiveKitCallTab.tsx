import { useState, useCallback, useRef } from "react";
import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Loader2, Mic, MicOff, Volume2 } from "lucide-react";

interface Props {
  businessId: string;
  businessName: string;
}

const LiveKitCallTab = ({ businessId, businessName }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startCall = useCallback(async () => {
    setStatus("connecting");
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get LiveKit token from edge function
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { businessId },
      });

      if (error || !data?.token || !data?.url) {
        throw new Error(error?.message || "Failed to get connection token");
      }

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          document.body.appendChild(el);
          audioRef.current = el as HTMLAudioElement;
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach().forEach((el) => el.remove());
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentIsSpeaking = speakers.some((s) => s.identity?.startsWith("agent-"));
        setAgentSpeaking(agentIsSpeaking);
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        setAgentSpeaking(false);
      });

      await room.connect(data.url, data.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setStatus("connected");
    } catch (err: any) {
      console.error("LiveKit connection error:", err);
      toast({
        title: "Connection Failed",
        description: err.message || "Could not connect to voice agent",
        variant: "destructive",
      });
      setStatus("idle");
    }
  }, [businessId, toast]);

  const endCall = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.remove();
      audioRef.current = null;
    }
    setStatus("idle");
    setAgentSpeaking(false);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return (
    <Card className="bg-card border-border max-w-md">
      <CardHeader>
        <CardTitle className="text-base">Browser Voice Call</CardTitle>
        <CardDescription>Test the agent live via your browser — powered by LiveKit WebRTC</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={status === "connected" ? "default" : "secondary"}>
            {status === "idle" ? "Ready" : status === "connecting" ? "Connecting..." : "Connected"}
          </Badge>
          {agentSpeaking && (
            <span className="flex items-center gap-1 text-primary">
              <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              Agent speaking
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {status === "idle" ? (
            <Button onClick={startCall} className="flex-1">
              <Phone className="mr-2 h-4 w-4" />
              Start Call
            </Button>
          ) : status === "connecting" ? (
            <Button disabled className="flex-1">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </Button>
          ) : (
            <>
              <Button variant="destructive" onClick={endCall} className="flex-1">
                <PhoneOff className="mr-2 h-4 w-4" />
                End Call
              </Button>
              <Button variant="outline" size="icon" onClick={toggleMute}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          This connects to the {businessName} agent via WebRTC. Your microphone audio is streamed directly to the AI agent.
        </p>
      </CardContent>
    </Card>
  );
};

export default LiveKitCallTab;
