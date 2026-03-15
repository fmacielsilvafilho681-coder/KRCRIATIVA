// Client Side App

function WelcomeScreen({ onComplete }) {
    const [fadeOut, setFadeOut] = React.useState(false);

    const handleClick = () => {
        setFadeOut(true);
        setTimeout(onComplete, 500); // Wait for animation
    };

    React.useEffect(() => {
        // Auto dismiss after 3 seconds if not clicked
        const timer = setTimeout(() => {
            handleClick();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div 
            className={`fixed inset-0 z-[200] bg-gradient-to-br from-[#802EF2] via-[#B055EF] to-[#F24BE7] flex items-center justify-center transition-opacity duration-500 cursor-pointer ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={handleClick}
        >
            <div className="text-center text-white px-4 animate-[scaleIn_0.5s_ease-out]">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
                     <img 
                        src="https://app.trickle.so/storage/public/images/usr_1a01139ad8000001/0e497727-f245-46af-8b81-648d8c1212a8.png?w=3868&h=3160" 
                        alt="Logo" 
                        className="w-12 h-12 object-contain brightness-0 invert" 
                     />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-md">Seja bem-vindo(a)</h1>
                <p className="text-white/80 text-lg md:text-xl font-light">Sua papelaria criativa favorita</p>
                <div className="mt-12">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        </div>
    );
}

// Define ErrorBoundary locally to ensure availability
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="icon-triangle-alert text-3xl text-red-500"></div>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-500 mb-4">Ocorreu um erro inesperado na aplicação.</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gradient-to-r from-[#802EF2] to-[#F24BE7] text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
                Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [showWelcome, setShowWelcome] = React.useState(true);
  const [products, setProducts] = React.useState([]);
  const [filteredProducts, setFilteredProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Todos');
  const [categories, setCategories] = React.useState(['Todos']);
  const [selectedProduct, setSelectedProduct] = React.useState(null); 
  
  // Cart State
  const [cartItems, setCartItems] = React.useState([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  React.useEffect(() => {
    // Check if welcome screen has been shown this session to avoid annoyance on refresh?
    // For now, always show as requested "Ao abrir o site"
    
    loadProducts();
    const savedCart = localStorage.getItem('kr_cart');
    if (savedCart) {
        try {
            setCartItems(JSON.parse(savedCart));
        } catch (e) {
            console.error("Error loading cart", e);
        }
    }
  }, []);

  React.useEffect(() => {
      localStorage.setItem('kr_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
      
      if (data && data.length > 0) {
        const uniqueCats = ['Todos', ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCats);
      }
    } catch (error) {
      console.error("Failed to load products", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let result = products;
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) || 
        (p.description && p.description.toLowerCase().includes(term))
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  // Cart Functions
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // When adding to cart, try to use the first image if available
      let cartImg = 'https://via.placeholder.com/400x300?text=Sem+Imagem';
      try {
          if (product.images) {
              const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
              if (Array.isArray(imgs) && imgs.length > 0) cartImg = imgs[0];
          } else if (product.imageUrl) {
              cartImg = product.imageUrl;
          }
      } catch(e) { if(product.imageUrl) cartImg = product.imageUrl; }
      
      return [...prev, { ...product, imageUrl: cartImg, quantity: 1 }];
    });
    setIsCartOpen(true); // Open cart when adding
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen pb-10 md:pb-20 bg-white">
      {showWelcome && <WelcomeScreen onComplete={() => setShowWelcome(false)} />}
    
      <Header 
        isAdmin={false} 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />
      
      {/* Cart Component */}
      {typeof Cart !== 'undefined' ? (
        <Cart 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
            onClear={clearCart}
        />
      ) : null}
      
      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
            product={selectedProduct} 
            onClose={closeProductModal} 
            onAddToCart={addToCart}
        />
      )}
      
      {/* Hero Section */}
      <section className="relative px-4 py-12 md:py-28 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] bg-gradient-to-br from-[#802EF2]/5 to-[#F24BE7]/5 rounded-full blur-3xl z-0 pointer-events-none opacity-50"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 md:px-4 md:py-1.5 mb-4 md:mb-8 rounded-full bg-white border border-gray-100 shadow-sm">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#802EF2] to-[#F24BE7] text-xs md:text-sm font-bold tracking-wider uppercase">Papelaria Premium</span>
          </div>
          <h2 className="text-3xl md:text-7xl font-bold mb-4 md:mb-8 tracking-tight text-gray-900 leading-[1.1]">
            Ideias que ganham <br/>
            <span className="bg-gradient-to-r from-[#802EF2] to-[#F24BE7] bg-clip-text text-transparent relative inline-block mt-1 md:mt-2">
              vida e cor
            </span>
          </h2>
          <p className="text-base md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 md:mb-12 font-light leading-relaxed px-2">
            Encontre os melhores materiais para organizar sua rotina, estudar com estilo e deixar a criatividade fluir.
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 md:pl-6 flex items-center pointer-events-none">
              <div className="icon-search text-gray-400 group-focus-within:text-[#802EF2] transition-colors text-lg md:text-xl"></div>
            </div>
            <input
              type="text"
              placeholder="O que você procura hoje?"
              className="w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-5 rounded-full bg-white border border-gray-200 text-gray-800 placeholder-gray-400 outline-none focus:border-[#802EF2] focus:ring-4 focus:ring-[#802EF2]/10 shadow-lg md:shadow-xl shadow-gray-100/50 transition-all text-sm md:text-lg"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) setSelectedCategory('Todos');
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="px-4 md:px-8 py-4 md:py-8 mb-6 md:mb-12">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 border ${
                selectedCategory === cat 
                  ? 'bg-gradient-to-r from-[#802EF2] to-[#F24BE7] text-white border-transparent shadow-md md:shadow-lg shadow-[#802EF2]/25 transform scale-105' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-[#802EF2] hover:text-[#802EF2] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-10 md:py-20">
             <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-[#802EF2]"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isAdmin={false} 
                onClick={handleProductClick}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-24 bg-gray-50/50 rounded-2xl md:rounded-[2rem] border border-gray-100">
            <div className="bg-white w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm border border-gray-100">
               <div className="icon-package-open text-2xl md:text-4xl text-gray-300"></div>
            </div>
            <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 text-sm md:text-lg font-light">Tente buscar por outro termo ou categoria.</p>
            <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}}
                className="mt-6 md:mt-8 bg-gradient-to-r from-[#802EF2] to-[#F24BE7] bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity flex items-center gap-2 mx-auto uppercase tracking-wide text-xs md:text-sm"
            >
                <div className="icon-rotate-ccw text-[#802EF2]"></div> Limpar filtros
            </button>
          </div>
        )}
      </main>

      <footer className="mt-16 md:mt-40 py-6 md:py-12 border-t border-gray-100 text-center bg-gray-50/30">
        <div className="flex justify-center mb-4 md:mb-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img 
                src="https://app.trickle.so/storage/public/images/usr_1a01139ad8000001/0e497727-f245-46af-8b81-648d8c1212a8.png?w=3868&h=3160" 
                alt="KR Criativa" 
                className="h-8 md:h-10 w-auto"
            />
        </div>
        <p className="text-gray-400 text-xs md:text-sm">&copy; 2026 KR Criativa. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);