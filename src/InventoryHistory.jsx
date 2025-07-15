// src/components/InventoryHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './InventoryHistory.css'; // Si tienes un archivo CSS específico para este componente

// MODIFICACIÓN CLAVE: Recibe API_BASE_URL como prop
function InventoryHistory({ API_BASE_URL }) {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // MODIFICACIÓN CLAVE: Añade API_BASE_URL a las dependencias de useEffect
    // y verifica que exista antes de hacer la llamada.
    useEffect(() => {
        const fetchInventoryMovements = async () => {
            if (!API_BASE_URL) {
                console.error("API_BASE_URL no está definida en InventoryHistory.");
                setError("La URL base de la API no está configurada. Por favor, contacta al soporte.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // MODIFICACIÓN CLAVE: Usa la prop API_BASE_URL para construir la URL
                const response = await axios.get(`${API_BASE_URL}/api/inventory-movements`);
                setMovements(response.data);
                setError(null); // Limpiar cualquier error previo
            } catch (err) {
                console.error('Error fetching inventory movements:', err);
                // Mejor manejo de errores para el usuario
                if (err.response) {
                    setError(`Error del servidor: ${err.response.status} - ${err.response.data.message || 'Error desconocido'}`);
                } else if (err.request) {
                    setError("No se pudo conectar con el servidor de historial. Asegúrate de que el backend esté funcionando y sea accesible.");
                } else {
                    setError(`Error al procesar la solicitud: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryMovements();
    }, [API_BASE_URL]); // <--- ¡MUY IMPORTANTE! Ejecutar de nuevo si la URL base cambia

    const formatMovementDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
        <div className="inventory-history-container">
            <h2>Historial de Movimientos de Inventario</h2>
            {loading && <p>Cargando historial de movimientos...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && movements.length === 0 && !error && (
                <p>No hay movimientos de inventario registrados aún.</p>
            )}
            {!loading && movements.length > 0 && (
                <table className="inventory-history-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Referencia Artículo</th>
                            <th>Descripción Producto</th>
                            <th>Tipo Movimiento</th>
                            <th>Cantidad</th>
                            <th>Stock Final</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map((movement) => (
                            <tr key={movement.id}>
                                <td>{formatMovementDate(movement.movementDate)}</td>
                                <td>{movement.Product ? movement.Product.referencia_articulo : 'N/A'}</td>
                                <td>{movement.Product ? movement.Product.descripcion : 'N/A'}</td>
                                <td>{movement.movementType}</td>
                                <td className={movement.quantity > 0 ? 'movement-positive' : 'movement-negative'}>
                                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                                </td>
                                <td>{movement.newStock}</td>
                                <td>{movement.description || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default InventoryHistory;