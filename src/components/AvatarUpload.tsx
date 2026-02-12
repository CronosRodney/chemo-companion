import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  avatarUrl: string | null;
  userId: string;
  onAvatarChange: (url: string | null) => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-24 h-24",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export const AvatarUpload = ({ avatarUrl, userId, onAvatarChange, editable = false, size = "md" }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie uma imagem (JPG, PNG)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;

      // Remove old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onAvatarChange(url);
      toast({ title: "Foto atualizada!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      // List and remove all files in user folder
      const { data: files } = await supabase.storage.from("avatars").list(userId);
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(paths);
      }

      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
      onAvatarChange(null);
      toast({ title: "Foto removida" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary/20 flex items-center justify-center relative`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User className={`${iconSizes[size]} text-primary`} />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          </div>
        )}
      </div>

      {editable && (
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-3 w-3 mr-1" />
            {avatarUrl ? "Trocar" : "Foto"}
          </Button>
          {avatarUrl && (
            <Button variant="outline" size="sm" className="text-xs text-destructive" onClick={handleDelete} disabled={uploading}>
              <Trash2 className="h-3 w-3 mr-1" />
              Remover
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
