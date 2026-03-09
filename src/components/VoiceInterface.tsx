import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening';

interface VoiceInterfaceProps {
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
}

const VoiceInterface = ({ onTranscript }: VoiceInterfaceProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = useCallback((event: Record<string, unknown>) => {
    const eventType = event.type as string;
    
    if (eventType === 'response.audio.delta') {
      setStatus('speaking');
    } else if (eventType === 'response.audio.done') {
      setStatus('listening');
    } else if (eventType === 'input_audio_buffer.speech_started') {
      setStatus('listening');
    }
  }, []);

  const handleTranscript = useCallback((text: string, role: 'user' | 'assistant') => {
    onTranscript?.(text, role);
  }, [onTranscript]);

  const startConversation = async () => {
    setStatus('connecting');
    try {
      chatRef.current = new RealtimeChat(handleMessage, handleTranscript);
      await chatRef.current.init();
      setStatus('connected');

      toast({
        title: "Connected",
        description: "Voice interface is ready. Start speaking!",
      });

      // After a brief delay, set to listening
      setTimeout(() => setStatus('listening'), 500);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setStatus('disconnected');
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to start voice conversation',
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    await chatRef.current?.disconnect();
    chatRef.current = null;
    setStatus('disconnected');

    toast({
      title: "Disconnected",
      description: "Voice conversation ended",
    });
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'disconnected': return 'Click to start voice chat';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'listening': return 'Listening...';
      case 'speaking': return 'AI is speaking...';
    }
  };

  const isActive = status !== 'disconnected';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main microphone button */}
      <button
        onClick={isActive ? endConversation : startConversation}
        disabled={status === 'connecting'}
        className={`
          relative h-24 w-24 rounded-full flex items-center justify-center
          transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30
          ${isActive 
            ? 'bg-destructive hover:bg-destructive/90' 
            : 'bg-primary hover:bg-primary/90 animate-pulse-glow'
          }
          ${status === 'connecting' ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {isActive ? (
          <PhoneOff className="h-10 w-10 text-destructive-foreground" />
        ) : (
          <Mic className="h-10 w-10 text-primary-foreground" />
        )}
        
        {/* Pulsing ring when listening */}
        {status === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <span className="absolute inset-0 rounded-full border-4 border-primary/50 animate-pulse" />
          </>
        )}
        
        {/* Speaking animation */}
        {status === 'speaking' && (
          <span className="absolute inset-0 rounded-full border-4 border-accent animate-pulse" />
        )}
      </button>

      {/* Status text */}
      <p className="text-muted-foreground text-sm font-medium">
        {getStatusText()}
      </p>

      {/* Audio visualizer bars (visible when active) */}
      {isActive && (
        <div className="flex items-end gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-primary rounded-full transition-all duration-150 ${
                status === 'speaking' || status === 'listening' 
                  ? 'animate-wave' 
                  : 'h-2'
              }`}
              style={{
                height: status === 'speaking' || status === 'listening' 
                  ? `${Math.random() * 24 + 8}px` 
                  : '8px',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
