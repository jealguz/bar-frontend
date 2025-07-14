// src/SupplierList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SupplierList.css';

// Acepta la nueva prop onSupplierChange
function SupplierList({ onSupplierChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null); // supplier object being edited
  const [editedSupplierName, setEditedSupplierName] = useState('');
  const [editedSupplierContact, setEditedSupplierContact] = useState('');
  const [message, setMessage] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/suppliers');
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al obtener los proveedores:", err);
      setError("No se pudieron cargar los proveedores. Asegúrate de que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!newSupplierName.trim()) {
      setError('El nombre del proveedor no puede estar vacío.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/suppliers', {
        name: newSupplierName,
        contact: newSupplierContact,
      });
      if (response.status === 201) {
        setMessage('Proveedor añadido con éxito!');
        setNewSupplierName('');
        setNewSupplierContact('');
        fetchSuppliers(); // Recarga la lista local
        if (onSupplierChange) { // Llama a la función de callback
          onSupplierChange();
        }
      }
    } catch (err) {
      console.error("Error al añadir el proveedor:", err.response ? err.response.data : err.message);
      setError(err.response && err.response.data && err.response.data.error
                  ? err.response.data.error
                  : 'Error al añadir el proveedor.');
    }
  };

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setEditedSupplierName(supplier.name);
    setEditedSupplierContact(supplier.contact || '');
    setMessage('');
    setError('');
  };

  const handleUpdateSupplier = async (supplierId) => {
    setMessage('');
    setError('');
    if (!editedSupplierName.trim()) {
      setError('El nombre del proveedor no puede estar vacío.');
      return;
    }
    try {
      const response = await axios.put(`http://localhost:5000/api/suppliers/${supplierId}`, {
        name: editedSupplierName,
        contact: editedSupplierContact,
      });
      if (response.status === 200) {
        setMessage('Proveedor actualizado con éxito!');
        setEditingSupplier(null);
        fetchSuppliers(); // Recarga la lista local
        if (onSupplierChange) { // Llama a la función de callback
          onSupplierChange();
        }
      }
    } catch (err) {
      console.error("Error al actualizar el proveedor:", err.response ? err.response.data : err.message);
      setError(err.response && err.response.data && err.response.data.error
                  ? err.response.data.error
                  : 'Error al actualizar el proveedor.');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor? Esto también desvinculará los productos asociados.')) {
      setMessage('');
      setError('');
      try {
        await axios.delete(`http://localhost:5000/api/suppliers/${supplierId}`);
        setMessage('Proveedor eliminado con éxito!');
        fetchSuppliers(); // Recarga la lista local
        if (onSupplierChange) { // Llama a la función de callback
          onSupplierChange();
        }
      } catch (err) {
        console.error("Error al eliminar el proveedor:", err.response ? err.response.data : err.message);
        setError(err.response && err.response.data && err.response.data.error
                    ? err.response.data.error
                    : 'Error al eliminar el proveedor.');
      }
    }
  };

  return (
    <div className="supplier-list-container">
      <h3>Gestión de Proveedores</h3>
      <form onSubmit={handleAddSupplier} className="add-supplier-form">
        <h4>Añadir Nuevo Proveedor</h4>
        <div className="form-group">
          <label htmlFor="new-supplier-name">Nombre:</label>
          <input
            type="text"
            id="new-supplier-name"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            placeholder="Nombre del proveedor"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="new-supplier-contact">Contacto:</label>
          <input
            type="text"
            id="new-supplier-contact"
            value={newSupplierContact}
            onChange={(e) => setNewSupplierContact(e.target.value)}
            placeholder="Email o teléfono"
          />
        </div>
        <button type="submit" className="add-supplier-button">Añadir Proveedor</button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Cargando proveedores...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : suppliers.length === 0 ? (
        <p>No hay proveedores registrados. ¡Añade uno!</p>
      ) : (
        <table className="supplier-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.id}</td>
                {editingSupplier && editingSupplier.id === supplier.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editedSupplierName}
                        onChange={(e) => setEditedSupplierName(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedSupplierContact}
                        onChange={(e) => setEditedSupplierContact(e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="action-button save-button" onClick={() => handleUpdateSupplier(supplier.id)}>Guardar</button>
                      <button className="action-button cancel-button" onClick={() => setEditingSupplier(null)}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{supplier.name}</td>
                    <td>{supplier.contact}</td>
                    <td>
                      <button className="action-button edit-button" onClick={() => handleEditClick(supplier)}>Editar</button>
                      <button className="action-button delete-button" onClick={() => handleDeleteSupplier(supplier.id)}>Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SupplierList;