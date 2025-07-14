// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ProductForm from './ProductForm';
import SupplierList from './SupplierList';
import InventoryHistory from './InventoryHistory'; // ¡NUEVA IMPORTACIÓN! ASUME QUE ESTÁ EN LA MISMA CARPETA QUE App.jsx
// Si InventoryHistory está en una subcarpeta como 'components', sería:
// import InventoryHistory from './components/InventoryHistory.jsx';

import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [currentView, setCurrentView] = useState('products'); // Estado para controlar la vista actual
  const [editingCell, setEditingCell] = useState(null);
  const [tempCellValue, setTempCellValue] = useState('');

  const [suppliersForNav, setSuppliersForNav] = useState([]);
  const [suppliersNavLoading, setSuppliersNavLoading] = useState(true);
  const [suppliersNavError, setSuppliersNavError] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [message, setMessage] = useState(''); // Estado para mensajes de éxito/error globales

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error al obtener los productos:", err);
      setError("No se pudieron cargar los productos. Asegúrate de que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliersForNav = useCallback(async () => {
    try {
      setSuppliersNavLoading(true);
      const response = await axios.get('http://localhost:5000/api/suppliers');
      setSuppliersForNav(response.data);
      setSuppliersNavError(null);
    } catch (err) {
      console.error("Error al obtener proveedores para la navegación:", err);
      setSuppliersNavError("No se pudieron cargar los proveedores para la navegación.");
    } finally {
      setSuppliersNavLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliersForNav();
  }, [fetchSuppliersForNav]);

  useEffect(() => {
    if (currentView === 'products' || currentView === 'products_to_order') {
      fetchProducts();
    }
    // No necesitamos fetchProducts si la vista es 'history' o 'suppliers' ya que esos componentes se encargan de sus propios datos
  }, [currentView, selectedSupplierId, fetchProducts]);

  const handleProductAdded = (newProduct) => {
    fetchProducts();
    setShowProductForm(false);
    setProductToEdit(null);
  };

  const handleProductUpdated = (updatedProduct) => {
    fetchProducts();
    setShowProductForm(false);
    setProductToEdit(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${productId}`);
        setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId));
        console.log(`Producto con ID ${productId} eliminado.`);
      } catch (err) {
        console.error("Error al eliminar el producto:", err.response ? err.response.data : err.message);
        alert('Error al eliminar el producto.');
      }
    }
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setShowProductForm(true);
    setEditingCell(null);
  };

  const handleCancelProductEdit = () => {
    setProductToEdit(null);
    setShowProductForm(false);
  };

  // Solo Stock Mínimo e Inventario Actual son editables en línea para que los calculados se actualicen.
  const editableFields = ['stock_minimo', 'inventario_actual'];

  const handleDoubleClick = (productId, fieldName, currentValue) => {
    if (editableFields.includes(fieldName)) {
      setEditingCell({ productId, fieldName });
      setTempCellValue(currentValue);
    }
  };

  const handleChange = (e) => {
    setTempCellValue(e.target.value);
  };

  const handleSaveInlineEdit = async (productId, fieldName, newValue) => {
    try {
      const parsedValue = parseInt(newValue);
      if (isNaN(parsedValue)) {
        alert('Por favor, ingresa un número válido.');
        setEditingCell(null);
        fetchProducts(); // Refrescar para restaurar el valor original
        return;
      }

      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        throw new Error('Producto no encontrado para actualización en línea.');
      }

      let updateData = { ...productToUpdate, [fieldName]: parsedValue };

      // Recalcular Stock Máximo y Cantidad Solicitada en el Frontend
      updateData.stock_maximo = Math.ceil(updateData.stock_minimo * 1.30);
      updateData.cantidad_solicitada = Math.max(0, updateData.stock_maximo - updateData.inventario_actual);

      // Eliminar el objeto Supplier anidado antes de enviar la actualización
      // para evitar errores con Sequelize que espera solo el supplierId
      delete updateData.Supplier;

      await axios.put(`http://localhost:5000/api/products/${productId}`, updateData);

      fetchProducts(); // Vuelve a obtener los productos para reflejar los cambios y los cálculos del backend
      setEditingCell(null);
      setMessage('¡Producto actualizado exitosamente!');
    } catch (err) {
      console.error("Error al actualizar el producto en línea:", err.response ? err.response.data : err.message);
      setError('Error al guardar el cambio. Verifica que el valor sea válido y el backend esté funcionando.');
      fetchProducts(); // Refrescar para restaurar el valor original en caso de error
      setEditingCell(null);
    } finally {
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  const handleBlur = (productId, fieldName) => {
    handleSaveInlineEdit(productId, fieldName, tempCellValue);
  };

  const handleKeyDown = (e, productId, fieldName) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      // Restaurar el valor original si se cancela la edición
      setTempCellValue(products.find(p => p.id === productId)?.[fieldName] || '');
    }
  };

  // === NUEVAS FUNCIONES PARA AJUSTES ESTACIONALES ===
  const handleActivateHighSeason = async () => {
    if (window.confirm('¿Estás seguro de que quieres activar la temporada alta (aumentar Stock Mínimo en 30% para todos los productos)? Esto también ajustará el Stock Máximo y la Cantidad Solicitada.')) {
      try {
        setLoading(true);
        await axios.post('http://localhost:5000/api/products/activate-high-season');
        setMessage('¡Temporada alta activada y productos ajustados!');
        await fetchProducts(); // Refrescar los productos después del ajuste
      } catch (err) {
        console.error("Error al activar temporada alta:", err.response ? err.response.data : err.message);
        setError('Error al activar la temporada alta.');
      } finally {
        setLoading(false);
        setTimeout(() => { setMessage(''); setError(''); }, 5000);
      }
    }
  };

  const handleDeactivateHighSeason = async () => {
    if (window.confirm('¿Estás seguro de que quieres desactivar la temporada alta (restaurar Stock Mínimo a valores base para todos los productos)? Esto también ajustará el Stock Máximo y la Cantidad Solicitada.')) {
      try {
        setLoading(true);
        await axios.post('http://localhost:5000/api/products/deactivate-high-season');
        setMessage('¡Temporada alta desactivada y productos restaurados!');
        await fetchProducts(); // Refrescar los productos después del ajuste
      } catch (err) {
        console.error("Error al desactivar temporada alta:", err.response ? err.response.data : err.message);
        setError('Error al desactivar la temporada alta.');
      } finally {
        setLoading(false);
        setTimeout(() => { setMessage(''); setError(''); }, 5000);
      }
    }
  };
  // === FIN DE FUNCIONES DE AJUSTES ESTACIONALES ===

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = selectedSupplierId
    ? products.filter(product => product.supplierId === selectedSupplierId)
    : products;

  const selectedSupplierName = selectedSupplierId
    ? suppliersForNav.find(s => s.id === selectedSupplierId)?.name || 'Desconocido'
    : 'Todos los Productos';

  const productsToOrder = products.filter(product => product.cantidad_solicitada > 0);


  return (
    <div className="App">
      <header className="App-header">
        <h1>Inventario Restaurante</h1>
      </header>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="button-group-top">
        <button
          onClick={handleActivateHighSeason}
          className="seasonal-button high-season-button"
          disabled={loading}
        >
          Activar Temporada Alta (+30% Stock Mínimo)
        </button>
        <button
          onClick={handleDeactivateHighSeason}
          className="seasonal-button low-season-button"
          disabled={loading}
        >
          Desactivar Temporada Alta (Volver a Stock Base)
        </button>
      </div>

      <div className="print-button-container">
        <button
          onClick={handlePrint}
          className="print-button"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <nav className="main-nav">
        <button
          className={currentView === 'products' && !selectedSupplierId ? 'nav-button active' : 'nav-button'}
          onClick={() => {
            setCurrentView('products');
            setShowProductForm(false);
            setProductToEdit(null);
            setSelectedSupplierId(null);
          }}
        >
          Todos los Productos
        </button>

        <button
          className={currentView === 'products_to_order' ? 'nav-button active' : 'nav-button'}
          onClick={() => {
            setCurrentView('products_to_order');
            setShowProductForm(false);
            setProductToEdit(null);
            setSelectedSupplierId(null);
          }}
        >
          Productos Pendientes de Compra
        </button>

        {/* ¡NUEVO BOTÓN DE NAVEGACIÓN PARA EL HISTORIAL! */}
        <button
          className={currentView === 'history' ? 'nav-button active' : 'nav-button'}
          onClick={() => {
            setCurrentView('history');
            setShowProductForm(false);
            setProductToEdit(null);
            setSelectedSupplierId(null); // Asegurarse de que no haya un proveedor seleccionado al ver el historial
          }}
        >
          Historial de Movimientos
        </button>

        {suppliersNavLoading ? (
          <span className="nav-loading">Cargando proveedores...</span>
        ) : suppliersNavError ? (
          <span className="nav-error">Error al cargar proveedores.</span>
        ) : (
          suppliersForNav.map(supplier => (
            <button
              key={supplier.id}
              className={currentView === 'products' && selectedSupplierId === supplier.id ? 'nav-button active' : 'nav-button'}
              onClick={() => {
                setCurrentView('products');
                setShowProductForm(false);
                setProductToEdit(null);
                setSelectedSupplierId(supplier.id);
              }}
            >
              {supplier.name}
            </button>
          ))
        )}

        <button
          className={currentView === 'suppliers' ? 'nav-button active' : 'nav-button'}
          onClick={() => setCurrentView('suppliers')}
        >
          Gestión de Proveedores
        </button>
      </nav>

      <main>
        {currentView === 'products' && (
          <>
            {!showProductForm && (
              <button className="add-product-button" onClick={() => setShowProductForm(true)}>
                Añadir Nuevo Producto
              </button>
            )}

            {showProductForm && (
              <ProductForm
                onProductAdded={handleProductAdded}
                productToEdit={productToEdit}
                onProductUpdated={handleProductUpdated}
                onCancelEdit={handleCancelProductEdit}
                // Asegúrate de pasar los proveedores al ProductForm si los necesita para el selector
                suppliers={suppliersForNav} // Pasa los proveedores al formulario
              />
            )}

            {!showProductForm && (
              <>
                <h2>Lista de Productos - {selectedSupplierName}</h2>
                {loading && !message && !error ? (
                  <p>Cargando productos...</p>
                ) : error ? (
                  <p style={{ color: 'red' }}>{error}</p>
                ) : filteredProducts.length === 0 ? (
                  <p>No hay productos en el inventario {selectedSupplierId ? `para ${selectedSupplierName}` : ''}. ¡Añade algunos!</p>
                ) : (
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Ref. Artículo</th>
                        <th>Descripción</th>
                        <th>Unidad</th>
                        <th>Presentación</th>
                        <th>Stock Mínimo Base</th>
                        <th>Stock Mínimo</th>
                        <th>Stock Máximo</th>
                        <th>Inventario Actual</th>
                        <th>Cantidad Solicitada</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>{product.referencia_articulo}</td>
                          <td>{product.descripcion}</td>
                          <td>{product.unidad}</td>
                          <td>{product.presentacion}</td>
                          <td>{product.stock_minimo_base}</td>
                          <td
                            onDoubleClick={() => handleDoubleClick(product.id, 'stock_minimo', product.stock_minimo)}
                            className="editable-cell"
                          >
                            {editingCell && editingCell.productId === product.id && editingCell.fieldName === 'stock_minimo' ? (
                              <input
                                type="number"
                                value={tempCellValue}
                                onChange={handleChange}
                                onBlur={() => handleBlur(product.id, 'stock_minimo')}
                                onKeyDown={(e) => handleKeyDown(e, product.id, 'stock_minimo')}
                                autoFocus
                              />
                            ) : (
                              product.stock_minimo
                            )}
                          </td>
                          <td>{product.stock_maximo}</td>
                          <td
                            onDoubleClick={() => handleDoubleClick(product.id, 'inventario_actual', product.inventario_actual)}
                            className="editable-cell"
                          >
                            {editingCell && editingCell.productId === product.id && editingCell.fieldName === 'inventario_actual' ? (
                              <input
                                type="number"
                                value={tempCellValue}
                                onChange={handleChange}
                                onBlur={() => handleBlur(product.id, 'inventario_actual')}
                                onKeyDown={(e) => handleKeyDown(e, product.id, 'inventario_actual')}
                                autoFocus
                              />
                            ) : (
                              product.inventario_actual
                            )}
                          </td>
                          <td>{product.cantidad_solicitada}</td>
                          <td>{product.Supplier ? product.Supplier.name : 'N/A'}</td>
                          <td>
                            <button
                              className="action-button edit-button"
                              onClick={() => handleEditProduct(product)}
                            >
                              Editar
                            </button>
                            <button
                              className="action-button delete-button"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}

        {currentView === 'products_to_order' && (
          <div className="products-to-order-section">
            <h2>Productos Pendientes de Compra ({productsToOrder.length})</h2>
            {loading && <p>Cargando productos...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && productsToOrder.length === 0 ? (
              <p>¡No hay productos pendientes de compra en este momento!</p>
            ) : (
              <p>Estos son los productos que necesitan ser solicitados a sus proveedores:</p>
            )}
            {!loading && !error && productsToOrder.length > 0 && (
                <table className="inventory-table order-table">
                  <thead>
                    <tr>
                      <th>Ref. Artículo</th>
                      <th>Descripción</th>
                      <th>Cantidad a Solicitar</th>
                      <th>Unidad</th>
                      <th>Presentación</th>
                      <th>Proveedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsToOrder.map(product => (
                      <tr key={product.id}>
                        <td>{product.referencia_articulo}</td>
                        <td>{product.descripcion}</td>
                        <td>{product.cantidad_solicitada}</td>
                        <td>{product.unidad}</td>
                        <td>{product.presentacion}</td>
                        <td>{product.Supplier ? product.Supplier.name : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </div>
        )}

        {currentView === 'suppliers' && (
          <SupplierList onSupplierChange={fetchSuppliersForNav} />
        )}

        {/* ¡NUEVO: Renderizar el componente InventoryHistory! */}
        {currentView === 'history' && (
          <InventoryHistory />
        )}
      </main>
    </div>
  );
}

export default App;