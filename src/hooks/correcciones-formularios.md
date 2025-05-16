# Correcciones necesarias para los formularios y landing pages

## 1. Corregir en useMarketingForms.ts

Reemplazar todas las referencias a la tabla "marketing_formularios" por "formularios":

```typescript
// Cambiar en la función createForm
const { data, error } = await supabase
  .from("formularios") // en lugar de "marketing_formularios"
  .insert([...])

// Cambiar en la función deleteForm
const { error } = await supabase
  .from("formularios") // en lugar de "marketing_formularios"
  .delete()

// Cambiar en la función getFormById
const { data, error } = await supabase
  .from("formularios") // en lugar de "marketing_formularios"
  .select("*")
```

## 2. Corregir en useMarketingLandings.ts

Reemplazar todas las referencias a "marketing_landing_pages" por "landing_pages":

```typescript
// Cambiar en generateUniqueUrl
const { data, error } = await supabase
  .from("landing_pages") // en lugar de "marketing_landing_pages"
  .select("id")

// Cambiar el origen de la empresa_id en createLanding
const { data: userData, error: userError } = await supabase
  .from("profiles") // en lugar de "usuarios"
  .select("empresa_id")
  .eq("id", user.id) // en lugar de "user_id"

// Cambiar en createLanding
const { data, error } = await supabase
  .from("landing_pages") // en lugar de "marketing_landing_pages"
  .insert([...])

// Reemplazar "estado" por "is_active"
is_active: landing.is_active !== undefined ? landing.is_active : true, // en lugar de "estado: landing.estado || 'activo'"

// Cambiar en updateLanding
.from("landing_pages") // en lugar de "marketing_landing_pages"

// Cambiar en deleteLanding
.from("landing_pages") // en lugar de "marketing_landing_pages"

// Cambiar en getLandingById
.from("landing_pages") // en lugar de "marketing_landing_pages"

// Cambiar en registerVisit y registerConversion
.from("landing_pages") // en lugar de "marketing_landing_pages"
```

## 3. Corregir en MarketingFormularios.tsx

Corregir los manejadores de eventos:

```typescript
// Corregir handleCreateFormulario
const handleCreateFormulario = () => {
  setIsCreatingForm(true);
  setSelectedFormulario(null);
  setSelectedLandingPage(null);
  setShowIntegracion(false);

  // Usar los campos correctos según la interfaz CreateFormularioInput
  const nuevoFormulario = {
    nombre: "Nuevo Formulario",
    descripcion: "Descripción del nuevo formulario",
    pipeline_id: "550e8400-e29b-41d4-a716-446655440000", // Usar un valor predeterminado o solicitar al usuario
    stage_id: "550e8400-e29b-41d4-a716-446655440001", // Usar un valor predeterminado o solicitar al usuario
    codigo_integracion: "",
    redirect_url: "",
    is_active: true
  };
  
  try {
    createForm.mutate(nuevoFormulario, {
      // resto del código...
    });
  } catch (error) {
    // resto del código...
  }
};

// Corregir handleCreateLandingPage
const handleCreateLandingPage = () => {
  // verificaciones iniciales...
  
  // Usar los campos correctos según la interfaz CreateLandingPageInput
  const nuevaLandingPage = {
    nombre: "Nueva Landing Page",
    descripcion: "Descripción de la nueva landing page",
    formulario_id: formularios[0].id,
    configuracion_seguimiento: {
      analytics: {
        gtm_id: "",
        ga_id: ""
      },
      social: {
        og_title: "",
        og_description: "",
        og_image: ""
      }
    },
    is_active: true
  };
  
  try {
    createLanding.mutate(nuevaLandingPage, {
      // resto del código...
    });
  } catch (error) {
    // resto del código...
  }
};
```

Corregir las referencias incorrectas a variables:

```typescript
// En el menú desplegable de landing pages, cambiar:
<DropdownMenuItem onClick={() => handleFormularioClick(formulario)}>
  <Pencil className="h-4 w-4 mr-2" />
  Editar
</DropdownMenuItem>

// Por:
<DropdownMenuItem onClick={() => handleEditLandingPage(landingPage)}>
  <Pencil className="h-4 w-4 mr-2" />
  Editar
</DropdownMenuItem>

// Y cambiar:
<DropdownMenuItem 
  className="text-destructive"
  onClick={() => deleteForm.mutateAsync(formulario.id)}
>
  <Trash className="h-4 w-4 mr-2" />
  Eliminar
</DropdownMenuItem>

// Por:
<DropdownMenuItem 
  className="text-destructive"
  onClick={() => deleteLanding.mutateAsync(landingPage.id)}
>
  <Trash className="h-4 w-4 mr-2" />
  Eliminar
</DropdownMenuItem>
```

Corregir el acceso a propiedades inexistentes (usar las propiedades correctas de la interfaz LandingPage real):

```typescript
// Cambiar:
<Badge variant={landingPage.estado === "activo" ? "default" : "secondary"} className="mt-2">
  {landingPage.estado === "activo" ? "Activo" : "Inactivo"}
</Badge>

// Por:
<Badge variant={landingPage.is_active ? "default" : "secondary"} className="mt-2">
  {landingPage.is_active ? "Activo" : "Inactivo"}
</Badge>

// Otras propiedades a corregir:
// - landingPage.visitas → No existe, usar estadísticas si están disponibles o quitar
// - landingPage.tasa_conversion → No existe, usar estadísticas si están disponibles o quitar
// - landingPage.fecha_modificacion → Usar landingPage.updated_at
```
