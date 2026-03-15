// Admin Side App

// Safe JSON Parse Helper
function safeParseItems(jsonString) {
    try {
        if (!jsonString) return [];
        if (typeof jsonString === 'object') return jsonString; 
        return JSON.parse(jsonString);
    } catch (e) {
        return [];
    }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error in Admin:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
            <h1 className="text-xl font-bold text-red-500 mb-2">Erro no Painel</h1>
            <button onClick={() => window.location.reload()} className="underline">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function OrderItem({ order, onUpdateOrder, onDeleteOrder }) {
  const items = safeParseItems(order.items);
  const history = safeParseItems(order.history);
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Data inválida';

  const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price || 0);

  const [showHistory, setShowHistory] = React.useState(false);

  const handleStatusChange = (newStatus) => {
      let actionDetails = `Status alterado para ${newStatus}`;
      const updates = { status: newStatus };
      onUpdateOrder(order.id, updates, actionDetails);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este pedido? Essa ação não pode ser desfeita.")) {
        onDeleteOrder(order.id);
    }
  };

  const statusColors = {
      'Não pago': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Pago': 'bg-green-100 text-green-700 border-green-200',
      'Entregue': 'bg-purple-100 text-purple-700 border-purple-200',
      'Cancelado': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative group">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 border-b border-gray-50 pb-4">
              <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">#{order.id ? order.id.slice(-6).toUpperCase() : '???'}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                          <div className="icon-calendar w-3 h-3"></div>
                          {date}
                      </span>
                      <button 
                        onClick={handleDelete}
                        className="ml-auto px-3 py-1 bg-red-500 text-white hover:bg-red-600 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                        title="Excluir Pedido"
                      >
                        Excluir
                      </button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{order.customer_name || 'Cliente sem nome'}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {order.customer_phone && (
                        <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g,'')}`} target="_blank" className="text-gray-500 hover:text-green-600 flex items-center gap-1">
                            <div className="icon-phone w-3 h-3"></div>
                            {order.customer_phone}
                        </a>
                    )}
                    <span className="text-gray-500 flex items-center gap-1">
                        <div className="icon-credit-card w-3 h-3"></div>
                        {order.payment_method || 'A Combinar'}
                    </span>
                  </div>
                  {order.address && (
                    <div className="mt-2 text-sm text-gray-500 flex items-start gap-1 bg-gray-50 p-2 rounded-lg">
                        <div className="icon-map-pin w-3 h-3 mt-1 flex-shrink-0"></div>
                        <span className="leading-tight">{order.address}</span>
                    </div>
                  )}
              </div>
              
              <div className="flex flex-col items-end gap-3 min-w-[200px] mt-6 md:mt-0">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 uppercase tracking-wide ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                  </div>
                  <div className="text-xl font-bold text-[#802EF2]">{formatPrice(order.total)}</div>
              </div>
          </div>

          {/* Action Buttons based on Status */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
             {order.status === 'Não pago' && (
                 <button onClick={() => handleStatusChange('Pago')} className="col-span-2 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                     <div className="icon-check w-3 h-3"></div> Confirmar Pagamento
                 </button>
             )}
             
             {order.status === 'Pago' && (
                 <button onClick={() => handleStatusChange('Entregue')} className="col-span-2 py-2 bg-[#802EF2] text-white rounded-lg text-xs font-bold hover:bg-[#6b21d1] transition-colors flex items-center justify-center gap-2">
                     <div className="icon-truck w-3 h-3"></div> Marcar como Entregue
                 </button>
             )}
             
             {order.status !== 'Cancelado' && order.status !== 'Entregue' && (
                 <button onClick={() => handleStatusChange('Cancelado')} className="py-2 bg-red-50 text-red-500 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                     Cancelar
                 </button>
             )}
             
             {/* Fallback Manual Change */}
             <div className="col-span-1 relative group">
                <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full h-full py-2 pl-2 pr-6 border border-gray-200 rounded-lg text-xs text-gray-500 appearance-none bg-white focus:border-[#802EF2] outline-none"
                >
                    <option value="Não pago">Não pago</option>
                    <option value="Pago">Pago</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="icon-chevron-down w-3 h-3 text-gray-400"></div>
                </div>
             </div>
          </div>

          {/* Items & History Toggle */}
          <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens do Pedido</h4>
                  <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-gray-400 hover:text-[#802EF2] flex items-center gap-1 transition-colors">
                      <div className={`icon-clock w-3 h-3 ${showHistory ? 'text-[#802EF2]' : ''}`}></div> 
                      {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
                  </button>
              </div>

              {showHistory ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                      {history.slice().reverse().map((entry, idx) => (
                          <div key={idx} className="flex gap-3 text-xs">
                              <span className="text-gray-400 whitespace-nowrap font-mono">{new Date(entry.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>
                              <div>
                                  <p className="font-bold text-gray-700">{entry.action}</p>
                                  {entry.details && <p className="text-gray-500">{entry.details}</p>}
                              </div>
                          </div>
                      ))}
                      {history.length === 0 && <p className="text-gray-400 text-xs italic">Sem histórico disponível.</p>}
                  </div>
              ) : (
                  <div className="space-y-2">
                      {items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                  <span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}
                              </span>
                              <span className="text-gray-500">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );
}

function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  
  const [activeTab, setActiveTab] = React.useState('orders'); 
  const [orderTab, setOrderTab] = React.useState('Não pago');
  
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [config, setConfig] = React.useState({ pix_key: '', whatsapp_number: '', id: null });
  
  const [loading, setLoading] = React.useState(false);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [productFormData, setProductFormData] = React.useState({});
  const [productImages, setProductImages] = React.useState([]);
  const [isEditingProduct, setIsEditingProduct] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'products') loadProducts();
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'config') loadConfig();
    }
  }, [isAuthenticated, activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try { setProducts(await fetchProducts()); } 
    catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try { setOrders(await fetchOrders()); } 
    catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
        const data = await getStoreConfig();
        if (data) setConfig(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '2022') setIsAuthenticated(true);
    else alert("Senha incorreta!");
  };

  const handleUpdateOrder = async (id, updates, actionDetails) => {
      try {
          // Optimistic update
          setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
          
          await updateOrder(id, updates, {
              action: updates.status ? `Status: ${updates.status}` : 'Atualização de Pedido',
              details: actionDetails
          });
          
          loadOrders();
      } catch (e) {
          alert("Erro ao atualizar pedido");
          loadOrders();
      }
  };

  const handleDeleteOrder = async (id) => {
      try {
          setOrders(prev => prev.filter(o => o.id !== id));
          await deleteOrder(id);
      } catch (e) {
          alert("Erro ao excluir pedido");
          loadOrders();
      }
  };

  // --- Product Handlers ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare Data
    const dataToSave = {
        ...productFormData,
        images: productImages
    };

    try {
      if (isEditingProduct) await updateProduct(productFormData.id, dataToSave);
      else await createProduct(dataToSave);
      await loadProducts();
      setShowProductForm(false);
    } catch (error) { alert("Erro ao salvar produto."); } 
    finally { setLoading(false); }
  };

  const handleProductDelete = async (id) => {
    if (confirm("Excluir este produto?")) {
      setLoading(true);
      try { await deleteProduct(id); await loadProducts(); } 
      catch (error) { alert("Erro ao excluir."); } 
      finally { setLoading(false); }
    }
  };

  const openProductForm = (product = null) => {
      if (product) {
          setProductFormData(product);
          // Parse images
          try {
              if (product.images) {
                  setProductImages(typeof product.images === 'string' ? JSON.parse(product.images) : product.images);
              } else if (product.imageUrl) {
                  setProductImages([product.imageUrl]);
              } else {
                  setProductImages([]);
              }
          } catch(e) { setProductImages([]); }
          
          setIsEditingProduct(true);
      } else {
          setProductFormData({ name: '', description: '', price: '', category: '' });
          setProductImages([]);
          setIsEditingProduct(false);
      }
      setShowProductForm(true);
  };

  const handleImageUpload = (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Limit check
      if (productImages.length + files.length > 10) {
          alert("Máximo de 10 fotos permitidas.");
          return;
      }

      files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
             // Basic compression via canvas could go here, but keeping it simple for now
             // directly storing base64
             setProductImages(prev => [...prev, reader.result]);
          };
          reader.readAsDataURL(file);
      });
  };

  const removeImage = (index) => {
      setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- Config Handler ---
  const handleConfigSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await saveStoreConfig(config, config.id);
        alert("Configurações salvas!");
        loadConfig();
    } catch (e) { alert("Erro ao salvar."); } 
    finally { setLoading(false); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <div className="icon-lock text-[#802EF2] text-2xl"></div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-6">Acesso Administrativo</h1>
            <form onSubmit={handleLogin}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (2022)" className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 focus:border-[#802EF2] outline-none" />
                <button type="submit" className="w-full py-3 rounded-xl bg-[#802EF2] text-white font-bold hover:opacity-90 transition-opacity">Entrar</button>
            </form>
        </div>
      </div>
    );
  }

  // Filter orders for current tab
  const filteredOrders = orders.filter(o => {
      // Normalizing status check
      const status = o.status || 'Não pago';
      return status === orderTab;
  });

  return (
    <div className="min-h-screen pb-20 bg-gray-50/50">
      <Header isAdmin={true} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Painel KR</h2>
              <div className="flex gap-4 text-sm text-gray-500">
                  <button onClick={() => setActiveTab('orders')} className={`hover:text-[#802EF2] ${activeTab === 'orders' ? 'text-[#802EF2] font-bold border-b-2 border-[#802EF2]' : ''}`}>Gestão de Pedidos</button>
                  <button onClick={() => setActiveTab('products')} className={`hover:text-[#802EF2] ${activeTab === 'products' ? 'text-[#802EF2] font-bold border-b-2 border-[#802EF2]' : ''}`}>Produtos</button>
                  <button onClick={() => setActiveTab('config')} className={`hover:text-[#802EF2] ${activeTab === 'config' ? 'text-[#802EF2] font-bold border-b-2 border-[#802EF2]' : ''}`}>Configurações</button>
              </div>
          </div>
          
          {activeTab === 'products' && (
              <button onClick={() => openProductForm()} className="bg-[#802EF2] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 flex items-center gap-2">
                  <div className="icon-plus-circle"></div> Novo Produto
              </button>
          )}
        </div>

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
            <div className="animate-[fadeIn_0.3s_ease-out]">
                {/* Order Status Tabs */}
                <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
                    {['Não pago', 'Pago', 'Entregue', 'Cancelado'].map(status => {
                        const count = orders.filter(o => (o.status || 'Não pago') === status).length;
                        return (
                            <button 
                                key={status}
                                onClick={() => setOrderTab(status)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${orderTab === status ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
                            >
                                {status}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${orderTab === status ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400">Carregando pedidos...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <div className="icon-inbox text-2xl text-gray-300"></div>
                        </div>
                        <h3 className="text-gray-900 font-bold">Nenhum pedido nesta aba</h3>
                        <p className="text-gray-400 text-sm">Os pedidos com status "{orderTab}" aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredOrders.map(order => (
                            <OrderItem 
                                key={order.id} 
                                order={order} 
                                onUpdateOrder={handleUpdateOrder} 
                                onDeleteOrder={handleDeleteOrder}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
                {products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        isAdmin={true}
                        onEdit={() => openProductForm(product)}
                        onDelete={handleProductDelete}
                    />
                ))}
            </div>
        )}

        {/* --- CONFIG TAB --- */}
        {activeTab === 'config' && (
            <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="icon-settings text-[#802EF2]"></div> Configurações de Atendimento
                    </h3>
                    <form onSubmit={handleConfigSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Número do WhatsApp</label>
                            <input 
                                type="tel" 
                                value={config.whatsapp_number} 
                                onChange={e => setConfig({...config, whatsapp_number: e.target.value})} 
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#802EF2] outline-none" 
                                placeholder="5511999999999" 
                            />
                            <p className="text-xs text-gray-400 mt-1">Digite apenas números, incluindo o código do país (ex: 55).</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chave PIX (Opcional)</label>
                            <input 
                                type="text" 
                                value={config.pix_key} 
                                onChange={e => setConfig({...config, pix_key: e.target.value})} 
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#802EF2] outline-none font-mono" 
                                placeholder="CPF, Email, etc..." 
                            />
                            <p className="text-xs text-gray-400 mt-1">Essa chave pode ser informada ao cliente manualmente.</p>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                            <div className="icon-save"></div> Salvar Alterações
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- PRODUCT FORM MODAL --- */}
        {showProductForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative animate-[slideUp_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setShowProductForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                        <div className="icon-x text-2xl"></div>
                    </button>
                    <h3 className="text-xl font-bold mb-6">{isEditingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                        <input name="name" required value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} placeholder="Nome do Produto" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                        <div className="flex gap-4">
                             <input name="price" type="number" step="0.01" required value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} placeholder="Preço" className="w-1/3 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                             <input name="category" list="cat-list" required value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} placeholder="Categoria" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                             <datalist id="cat-list">
                                <option value="Canetas"/>
                                <option value="Cadernos"/>
                                <option value="Garrafas"/>
                                <option value="Bottons"/>
                                <option value="Cadernetas"/>
                                <option value="Agendas"/>
                             </datalist>
                        </div>
                        
                        {/* Image Upload Section */}
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700">Fotos do Produto (Máx 10)</label>
                             <div className="flex flex-wrap gap-2 mb-2">
                                 {productImages.map((img, idx) => (
                                     <div key={idx} className="w-16 h-16 relative border rounded-lg overflow-hidden group">
                                         <img src={img} className="w-full h-full object-cover" />
                                         <button 
                                            type="button" 
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-red-500/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                         >
                                             <div className="icon-trash text-sm"></div>
                                         </button>
                                     </div>
                                 ))}
                                 {productImages.length < 10 && (
                                     <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#802EF2] text-gray-400 hover:text-[#802EF2] transition-colors">
                                         <div className="icon-plus text-xl"></div>
                                         <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                                     </label>
                                 )}
                             </div>
                             <p className="text-xs text-gray-400">Clique no botão "+" para adicionar fotos do seu dispositivo.</p>
                        </div>

                        <textarea name="description" rows="3" required value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} placeholder="Descrição" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none" />
                        
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setShowProductForm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancelar</button>
                            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#802EF2] text-white rounded-xl font-bold hover:opacity-90">{loading ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <AdminApp />
    </ErrorBoundary>
);