import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, Upload, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
}

const KnowledgeBaseTab = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["knowledge-base", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_items")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (file) {
        setUploading(true);
        const ext = file.name.split(".").pop();
        const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("knowledge-base")
          .upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("knowledge-base")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileType = file.type;
        setUploading(false);
      }

      const { error } = await supabase.from("knowledge_base_items").insert({
        business_id: businessId,
        title: title.trim(),
        content: content.trim(),
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base", businessId] });
      setTitle("");
      setContent("");
      setFile(null);
      toast({ title: "Knowledge base item added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setUploading(false);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_base_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base", businessId] });
      toast({ title: "Item deleted" });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Add Knowledge</CardTitle>
          <CardDescription>Add text entries or upload files the AI agent will reference during calls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Menu, FAQ, Policies" />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste text content here..." rows={5} />
          </div>
          <div className="space-y-2">
            <Label>Or attach a file (PDF, DOCX, TXT)</Label>
            <Input type="file" accept=".pdf,.docx,.doc,.txt,.md,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={() => addItem.mutate()} disabled={!title.trim() || addItem.isPending || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Item
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Knowledge Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No knowledge base items yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{item.title}</span>
                      {item.file_name && <Badge variant="secondary" className="text-xs">{item.file_name}</Badge>}
                    </div>
                    {item.content && <p className="text-xs text-muted-foreground line-clamp-2 ml-6">{item.content}</p>}
                    {item.file_url && (
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-6">
                        View file
                      </a>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)} className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseTab;
