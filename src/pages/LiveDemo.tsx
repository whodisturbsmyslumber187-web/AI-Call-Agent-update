import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, Mic, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validateReservationData } from "@/lib/validations";
import VoiceInterface from "@/components/VoiceInterface";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LiveDemo = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceTranscripts, setVoiceTranscripts] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    voiceScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceTranscripts]);

  const handleVoiceTranscript = (text: string, role: "user" | "assistant") => {
    setVoiceTranscripts(prev => [...prev, { role, content: text }]);
  };

  const processReservation = async (content: string) => {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) return;

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.action !== "create_reservation") return;

      // Validate the reservation data
      const validation = validateReservationData({
        name: parsed.name,
        email: parsed.email,
        date: parsed.date,
        time: parsed.time,
        guests: Number(parsed.guests),
      });

      if (!validation.success) {
        toast({
          title: "Invalid Reservation Data",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      const { data: config } = await supabase
        .from("agent_config")
        .select("restaurant_name")
        .limit(1)
        .maybeSingle();

      const { error } = await supabase.from("reservations").insert({
        name: validation.data!.name,
        email: validation.data!.email,
        date: validation.data!.date,
        time: validation.data!.time,
        guests: validation.data!.guests,
        status: "confirmed",
      });

      if (error) throw error;

      // Send confirmation email
      await supabase.functions.invoke("send-reservation-confirmation", {
        body: {
          name: validation.data!.name,
          email: validation.data!.email,
          date: validation.data!.date,
          time: validation.data!.time,
          guests: validation.data!.guests,
          restaurantName: config?.restaurant_name || "Restaurant",
        },
      });

      toast({
        title: "Reservation Created",
        description: `Booked for ${validation.data!.name} on ${validation.data!.date} at ${validation.data!.time}`,
      });
    } catch (e) {
      console.error("Failed to process reservation:", e);
      toast({
        title: "Reservation Failed",
        description: "Could not create reservation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIdx;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

          try {
            const parsed = JSON.parse(line.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Process any reservation in the response
      await processReservation(assistantContent);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessages = (msgList: Message[], ref: React.RefObject<HTMLDivElement>) => (
    <>
      {msgList.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Start a Conversation</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            Ask about our menu, hours, or make a reservation!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {msgList.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content.replace(/```json[\s\S]*?```/g, '').trim()}</p>
            </div>
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={ref} />
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">AI Voice Agent Demo</h1>
        <p className="text-muted-foreground mt-2">
          Chat with our AI restaurant receptionist via text or voice
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Text Chat
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {renderMessages(messages, scrollRef)}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 mt-4">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-secondary border-border"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            {/* Voice interface header */}
            <div className="p-6 flex flex-col items-center justify-center border-b border-border">
              <VoiceInterface onTranscript={handleVoiceTranscript} />
            </div>

            {/* Voice transcripts */}
            <ScrollArea className="flex-1 p-4">
              {renderMessages(voiceTranscripts, voiceScrollRef)}
            </ScrollArea>

            {/* Info text */}
            <div className="p-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Voice chat requires OPENAI_API_KEY to be configured
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveDemo;
