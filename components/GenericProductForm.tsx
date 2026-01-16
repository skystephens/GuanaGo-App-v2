import React, { useState } from 'react';

interface GenericProductFormProps {
  onSubmit: (data: any) => void;
  type: string; // tipo de socio: alojamiento, artista, transporte, restaurante, etc.
}

const PRODUCT_FIELDS: Record<string, Array<{ name: string; label: string; type: string; required?: boolean }>> = {
  alojamiento: [
    { name: 'nombre', label: 'Nombre del Alojamiento', type: 'text', required: true },
    { name: 'habitaciones', label: 'Número de Habitaciones', type: 'number', required: true },
    { name: 'capacidad', label: 'Capacidad Máxima', type: 'number', required: true },
    { name: 'distribucion', label: 'Distribución de Habitaciones', type: 'text' },
    { name: 'precio_noche', label: 'Precio por Noche', type: 'number', required: true },
    { name: 'precio_total', label: 'Precio Total del Apto', type: 'number' },
    { name: 'precio_pareja', label: 'Precio por Pareja', type: 'number' },
    { name: 'disponibilidad', label: 'Disponibilidad (fechas)', type: 'text' },
    { name: 'promos', label: 'Promociones/Descuentos', type: 'text' },
    { name: 'icall', label: 'Clave ICALL/Reserva', type: 'text' },
    { name: 'puntos', label: '¿Permite redimir/otorgar puntos?', type: 'checkbox' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'imagenes', label: 'Imágenes', type: 'file' },
  ],
  artista: [
    { name: 'nombre', label: 'Nombre del Producto/Show', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo de Producto', type: 'text', required: true },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'imagenes', label: 'Imágenes', type: 'file' },
    { name: 'promos', label: 'Promociones/Descuentos', type: 'text' },
    { name: 'puntos', label: '¿Permite redimir/otorgar puntos?', type: 'checkbox' },
  ],
  restaurante: [
    { name: 'nombre', label: 'Nombre del Plato/Servicio', type: 'text', required: true },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'promos', label: 'Promociones/Descuentos', type: 'text' },
    { name: 'puntos', label: '¿Permite redimir/otorgar puntos?', type: 'checkbox' },
    { name: 'imagenes', label: 'Imágenes', type: 'file' },
  ],
  transporte: [
    { name: 'nombre', label: 'Nombre del Servicio', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo de Vehículo', type: 'text' },
    { name: 'capacidad', label: 'Capacidad', type: 'number' },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'disponibilidad', label: 'Disponibilidad (fechas/horas)', type: 'text' },
    { name: 'promos', label: 'Promociones/Descuentos', type: 'text' },
    { name: 'puntos', label: '¿Permite redimir/otorgar puntos?', type: 'checkbox' },
    { name: 'imagenes', label: 'Imágenes', type: 'file' },
  ],
  // ...otros tipos
};

const GenericProductForm: React.FC<GenericProductFormProps> = ({ onSubmit, type }) => {
  const fields = PRODUCT_FIELDS[type] || PRODUCT_FIELDS['alojamiento'];
  const [form, setForm] = useState<any>({});
  const [images, setImages] = useState<FileList | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType, checked, files } = e.target as any;
    if (inputType === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (inputType === 'file') {
      setImages(files);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, images });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm text-gray-400 mb-1">{field.label}{field.required && ' *'}</label>
          {field.type === 'textarea' ? (
            <textarea name={field.name} required={field.required} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3" onChange={handleChange} />
          ) : field.type === 'checkbox' ? (
            <input type="checkbox" name={field.name} className="mr-2" onChange={handleChange} />
          ) : field.type === 'file' ? (
            <input type="file" name={field.name} multiple className="w-full" onChange={handleChange} />
          ) : (
            <input type={field.type} name={field.name} required={field.required} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3" onChange={handleChange} />
          )}
        </div>
      ))}
      <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-4 rounded-xl mt-4">Registrar Producto/Servicio</button>
    </form>
  );
};

export default GenericProductForm;
