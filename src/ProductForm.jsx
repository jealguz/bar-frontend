import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductForm.css';

// ELIMINAR ESTA LÍNEA: Ya no se necesita definir API_BASE_URL aquí,
// ya que se pasará como prop desde App.jsx
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// AJUSTE CLAVE: Añadir API_BASE_URL a las props desestructuradas
function ProductForm({ onProductAdded, productToEdit, onProductUpdated, onCancelEdit, API_BASE_URL }) {
  const initialFormState = {
    referencia_articulo: '',
    descripcion: '',
    unidad: '',
    presentacion: '',
    stock_minimo_base: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    inventario_actual: 0,
    cantidad_solicitada: 0,
    supplierId: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState(null);

  useEffect(() => {
    let currentData = productToEdit
      ? { ...productToEdit, supplierId: productToEdit.supplierId || '', stock_minimo_base: productToEdit.stock_minimo_base || productToEdit.stock_minimo || 0 }
      : initialFormState;

    setFormData(currentData);
  }, [productToEdit]); // Mantener initialFormState en dependencias si productToEdit puede ser null y quieres resetear completamente

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        // Usando la prop API_BASE_URL
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`);
        setSuppliers(response.data);
      } catch (err) {
        console.error("Error al obtener los proveedores para el formulario:", err);
        setSuppliersError("No se pudieron cargar los proveedores.");
      } finally {
        setSuppliersLoading(false);
      }
    };
    // Asegurarse de que API_BASE_URL esté definido antes de intentar la llamada
    if (API_BASE_URL) {
      fetchSuppliers();
    }
  }, [API_BASE_URL]); // Añadir API_BASE_URL como dependencia

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'stock_minimo' || name === 'inventario_actual') {
      newFormData[name] = parseInt(value) || 0;
    }

    if (name === 'stock_minimo' && !productToEdit) {
      // Solo establece stock_minimo_base si es un nuevo producto y stock_minimo está siendo cambiado
      newFormData.stock_minimo_base = newFormData.stock_minimo;
    }

    // Asegurarse de que stock_minimo y inventario_actual son números para los cálculos
    const currentStockMinimo = (name === 'stock_minimo' ? (parseInt(value) || 0) : newFormData.stock_minimo);
    const currentInventarioActual = (name === 'inventario_actual' ? (parseInt(value) || 0) : newFormData.inventario_actual);

    newFormData.stock_maximo = Math.ceil(currentStockMinimo * 1.30);
    newFormData.cantidad_solicitada = Math.max(0, newFormData.stock_maximo - currentInventarioActual);

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!formData.supplierId) {
      setError('Por favor, selecciona un proveedor.');
      return;
    }

    try {
      const dataToSend = { ...formData };
      // Eliminar 'Supplier' si viene del objeto de edición para evitar problemas con Sequelize
      // Al crear, 'Supplier' no debería existir de todas formas.
      if (dataToSend.Supplier) {
        delete dataToSend.Supplier;
      }
      // También podrías querer eliminar 'id' si estás enviando un nuevo producto
      // Aunque el backend suele ignorarlo para POST
      if (!productToEdit && dataToSend.id) {
          delete dataToSend.id;
      }

      let response;
      if (productToEdit) {
        // Usando la prop API_BASE_URL
        response = await axios.put(`${API_BASE_URL}/api/products/${productToEdit.id}`, dataToSend);
        if (onProductUpdated) onProductUpdated(response.data);
        setMessage('Producto actualizado con éxito!');
      } else {
        // Usando la prop API_BASE_URL
        response = await axios.post(`${API_BASE_URL}/api/products`, dataToSend);
        if (onProductAdded) onProductAdded(response.data);
        setMessage('Producto añadido con éxito!');
        setFormData(initialFormState); // Resetear el formulario para añadir otro
      }
      console.log('Respuesta de la API:', response.data);
    } catch (err) {
      console.error("Error al guardar el producto:", err.response ? err.response.data : err.message);
      setError(err.response && err.response.data && err.response.data.error
                  ? err.response.data.error
                  : 'Error al guardar el producto.');
    } finally {
        // Limpiar mensajes después de un tiempo
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 3000);
    }
  };

  return (
    <div className="product-form-container">
      <h3>{productToEdit ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="referencia_articulo">Ref. Artículo:</label>
          <input
            type="text"
            id="referencia_articulo"
            name="referencia_articulo"
            value={formData.referencia_articulo}
            onChange={handleChange}
            required
            disabled={!!productToEdit} // Deshabilita la edición de la referencia si se está editando un producto existente
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <input
            type="text"
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="unidad">Unidad:</label>
          <input
            type="text"
            id="unidad"
            name="unidad"
            value={formData.unidad}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="presentacion">Presentación:</label>
          <input
            type="text"
            id="presentacion"
            name="presentacion"
            value={formData.presentacion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock_minimo">Stock Mínimo:</label>
          <input
            type="number"
            id="stock_minimo"
            name="stock_minimo"
            value={formData.stock_minimo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock_maximo">Stock Máximo:</label>
          <input
            type="number"
            id="stock_maximo"
            name="stock_maximo"
            value={formData.stock_maximo}
            readOnly
            style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="inventario_actual">Inventario Actual:</label>
          <input
            type="number"
            id="inventario_actual"
            name="inventario_actual"
            value={formData.inventario_actual}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cantidad_solicitada">Cantidad Solicitada:</label>
          <input
            type="number"
            id="cantidad_solicitada"
            name="cantidad_solicitada"
            value={formData.cantidad_solicitada}
            readOnly
            style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="supplierId">Proveedor:</label>
          {suppliersLoading ? (
            <p>Cargando proveedores...</p>
          ) : suppliersError ? (
            <p style={{ color: 'red' }}>{suppliersError}</p>
          ) : suppliers.length === 0 ? (
            <p style={{ color: 'orange' }}>No hay proveedores registrados. Por favor, añade uno primero.</p>
          ) : (
            <select
              id="supplierId"
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button type="submit" className="submit-button">
          {productToEdit ? 'Actualizar Producto' : 'Añadir Producto'}
        </button>
        {productToEdit && (
          <button type="button" onClick={onCancelEdit} className="cancel-button">
            Cancelar Edición
          </button>
        )}

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default ProductForm;