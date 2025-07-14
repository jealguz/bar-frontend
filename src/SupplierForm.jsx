// src/SupplierForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SupplierForm.css';

// ¡LÍNEA CLAVE AJUSTADA! Define la URL base de tu API aquí.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SupplierForm({ onSupplierAdded, supplierToEdit, onSupplierUpdated, onCancelEdit }) {
  const initialFormState = {
    name: '',
    contact_info: '',
  };

  const [formData, setFormData] = useState(supplierToEdit || initialFormState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setFormData(supplierToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [supplierToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      let response;
      if (supplierToEdit) {
        // AJUSTE AQUÍ: Usando API_BASE_URL para PUT
        response = await axios.put(`${API_BASE_URL}/api/suppliers/${supplierToEdit.id}`, formData);
        if (onSupplierUpdated) onSupplierUpdated(response.data);
        setMessage('Proveedor actualizado con éxito!');
      } else {
        // AJUSTE AQUÍ: Usando API_BASE_URL para POST
        response = await axios.post(`${API_BASE_URL}/api/suppliers`, formData);
        if (onSupplierAdded) onSupplierAdded(response.data);
        setMessage('Proveedor añadido con éxito!');
        setFormData(initialFormState); // Limpiar el formulario después de añadir
      }
      console.log('Respuesta de la API:', response.data);
    } catch (err) {
      console.error("Error al guardar el proveedor:", err.response ? err.response.data : err.message);
      setError(err.response && err.response.data && err.response.data.error
                  ? err.response.data.error
                  : 'Error al guardar el proveedor.');
    }
  };

  return (
    <div className="supplier-form-container">
      <h3>{supplierToEdit ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}</h3>
      <form onSubmit={handleSubmit} className="supplier-form">
        <div className="form-group">
          <label htmlFor="name">Nombre del Proveedor:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_info">Información de Contacto:</label>
          <input
            type="text"
            id="contact_info"
            name="contact_info"
            value={formData.contact_info || ''}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-button">
          {supplierToEdit ? 'Actualizar Proveedor' : 'Añadir Proveedor'}
        </button>
        {supplierToEdit && (
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

export default SupplierForm;