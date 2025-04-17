import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Agente } from "@/hooks/useAgentes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, UserPlus, Save, RefreshCcw, Eye, EyeOff, X } from "lucide-react";

interface AgenteEditDialogProps {
  agente?: Agente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: any, avatar?: File | null) => void;
  isLoading: boolean;
}

const formSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").min(1, "El email es requerido"),
  role: z.enum(["admin", "admin_empresa", "agente"]),
  is_active: z.boolean().default(true),
  password: z.string().optional(),
});

export function AgenteEditDialog({
  agente,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: AgenteEditDialogProps) {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!agente;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: agente?.full_name || "",
      email: agente?.email || "",
      role: (agente?.role as any) || "agente",
      is_active: agente?.is_active !== undefined ? agente.is_active : true,
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        full_name: agente?.full_name || "",
        email: agente?.email || "",
        role: (agente?.role as any) || "agente",
        is_active: agente?.is_active !== undefined ? agente.is_active : true,
        password: "",
      });
      setAvatarPreview(agente?.avatar_url || null);
      setAvatar(null);

      if (!isEditing) {
        generateRandomPassword();
      }
    }
  }, [agente, open, form, isEditing]);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(
      {
        ...values,
        id: agente?.id,
      },
      avatar
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full md:max-w-[500px] p-0 max-h-screen flex flex-col">
        <SheetHeader className="sticky top-0 z-20 bg-background px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">
                {isEditing ? "Editar agente" : "Crear nuevo agente"}
              </SheetTitle>
              <SheetDescription>
                {isEditing
                  ? "Actualiza la información del agente"
                  : "Crea un nuevo usuario en la plataforma"}
              </SheetDescription>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={avatarPreview || undefined}
                      alt={form.watch("full_name")}
                    />
                    <AvatarFallback className="text-xl">
                      {getInitials(form.watch("full_name") || "NA")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full"
                      asChild
                    >
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Subir avatar</span>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={removeAvatar}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar avatar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre y apellido" {...field} className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          {...field}
                          disabled={isEditing}
                          className="h-10"
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditing && "El correo electrónico no se puede modificar"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <div className="relative w-full">
                              <Input
                                type={showPassword ? "text" : "password"}
                                {...field}
                                className="h-10 pr-12"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-8 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-10 w-10"
                            onClick={generateRandomPassword}
                            title="Generar contraseña aleatoria"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormDescription>
                          Se generará automáticamente una contraseña para el nuevo usuario
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="admin_empresa">Admin Empresa</SelectItem>
                          <SelectItem value="agente">Agente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Define los permisos del usuario en la plataforma
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Estado de la cuenta</FormLabel>
                          <FormDescription>
                            {field.value
                              ? "El usuario puede acceder a la plataforma"
                              : "El usuario no puede acceder a la plataforma"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <div className="sticky bottom-0 border-t bg-background p-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              "Guardando..."
            ) : isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}