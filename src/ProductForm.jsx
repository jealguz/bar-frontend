// src/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductForm.css';

function ProductForm({ onProductAdded, productToEdit, onProductUpdated, onCancelEdit }) {
  const initialFormState = {
    referencia_articulo: '',
    descripcion: '',
    unidad: '',
    presentacion: '',
    stock_minimo_base: 0, // Nuevo campo
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
  }, [productToEdit]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const response = await axios.get('http://localhost:5000/api/suppliers');
        setSuppliers(response.data);
      } catch (err) {
        console.error("Error al obtener los proveedores para el formulario:", err);
        setSuppliersError("No se pudieron cargar los proveedores.");
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === 'stock_minimo' || name === 'inventario_actual') {
      newFormData[name] = parseInt(value) || 0;
    }

    // Si se edita stock_minimo, también actualizamos stock_minimo_base en el formulario
    // para que se guarde correctamente la primera vez o si el usuario lo modifica manualmente.
    if (name === 'stock_minimo' && !productToEdit) { // Solo al crear o si no es una edición de un producto existente para no sobrescribir stock_minimo_base
         newFormData.stock_minimo_base = newFormData.stock_minimo;
    } else if (name === 'stock_minimo' && productToEdit) {
        // En edición, si el usuario cambia el stock_minimo, se asume que esa es la nueva base
        // para futuros cálculos. Pero en este caso, el backend ya tiene la lógica con el hook.
        // Aquí no tocamos stock_minimo_base a menos que sea el campo stock_minimo_base el que se edite (que no lo es).
    }


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
      delete dataToSend.Supplier;

      let response;
      if (productToEdit) {
        response = await axios.put(`http://localhost:5000/api/products/${productToEdit.id}`, dataToSend);
        if (onProductUpdated) onProductUpdated(response.data);
        setMessage('Producto actualizado con éxito!');
      } else {
        response = await axios.post('http://localhost:5000/api/products', dataToSend);
        if (onProductAdded) onProductAdded(response.data);
        setMessage('Producto añadido con éxito!');
        setFormData(initialFormState);
      }
      console.log('Respuesta de la API:', response.data);
    } catch (err) {
      console.error("Error al guardar el producto:", err.response ? err.response.data : err.message);
      setError(err.response && err.response.data && err.response.data.error
                  ? err.response.data.error
                  : 'Error al guardar el producto.');
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
            disabled={!!productToEdit}
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