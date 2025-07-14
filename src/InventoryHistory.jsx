// src/components/InventoryHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InventoryHistory() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInventoryMovements();
    }, []);

    const fetchInventoryMovements = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/inventory-movements');
            setMovements(response.data);
            setError(null); // Limpiar cualquier error previo
        } catch (err) {
            console.error('Error fetching inventory movements:', err);
            setError('Error al cargar el historial de movimientos. Inténtalo de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

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