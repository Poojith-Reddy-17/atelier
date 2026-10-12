import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    ShoppingBag, ShoppingCart, Search, Heart, User, Sparkles, ShieldCheck,
    Truck, CreditCard, Package, BarChart3, TrendingUp, Plus, Trash2, Edit3, X,
    Check, ChevronRight, ChevronDown, SlidersHorizontal, Sun, Moon, Lock,
    ExternalLink, Star, RefreshCw, Gift, MessageSquare, DollarSign, Clock, Zap,
    CheckCircle2, Printer, Download, ArrowRight, Tag, Sliders, Filter, Eye,
    Award, RefreshCcw, Send, Layers, CheckCircle, AlertCircle, ChevronLeft
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { initializeApp } from 'firebase/app';
import {
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc
} from 'firebase/firestore';

let db = null;
let auth = null;
let appId = 'aura-luxury-store';

try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        const firebaseConfig = JSON.parse(__firebase_config);
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        if (typeof __app_id !== 'undefined' && __app_id) {
            appId = __app_id;
        }
    }
} catch (e) {
    console.warn("Firebase initialization skipped or running in fallback mode:", e);
}

const INITIAL_PRODUCTS = [
    {
        id: 'prod-1',
        title: 'Chronograph Royal Oak Obsidian',
        category: 'Timepieces',
        price: 18500,
        comparePrice: 21000,
        rating: 4.9,
        reviewsCount: 38,
        stock: 5,
        isFeatured: true,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
        description: 'Forged in black ceramic with a matte black grand tapisserie dial, sapphire crystal, and integrated luxury bracelet. Precision automatic movement.',
        colors: ['Onyx Black', 'Rose Gold Accent', 'Titanium Grey'],
        sizes: ['41mm', '39mm']
    },
    {
        id: 'prod-2',
        title: 'Elysian 18K Rose Gold Diamond Cuff',
        category: 'High Jewelry',
        price: 6200,
        comparePrice: 7000,
        rating: 5.0,
        reviewsCount: 19,
        stock: 8,
        isFeatured: true,
        isNew: false,
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80',
        description: 'Handcrafted in 18-karat rose gold, set with 2.4 carats of brilliant-cut pavé diamonds. A symbol of timeless elegance.',
        colors: ['Rose Gold', 'Yellow Gold', 'White Gold'],
        sizes: ['Small (15cm)', 'Medium (17cm)', 'Large (19cm)']
    },
    {
        id: 'prod-3',
        title: 'Monogram Handcrafted Calfskin Weekender',
        category: 'Leather Goods',
        price: 3800,
        comparePrice: 4200,
        rating: 4.8,
        reviewsCount: 42,
        stock: 12,
        isFeatured: true,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        description: 'Full-grain Italian calfskin luggage with hand-burnished edges, palladium hardware, and removable shoulder strap.',
        colors: ['Cognac Brown', 'Midnight Black', 'Espresso'],
        sizes: ['Standard 48cm']
    },
    {
        id: 'prod-4',
        title: 'AURA Studio Wireless ANC Headphones - Brass Edition',
        category: 'Audio & Tech',
        price: 850,
        comparePrice: 950,
        rating: 4.7,
        reviewsCount: 86,
        stock: 25,
        isFeatured: false,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
        description: 'Custom 40mm beryllium drivers, active acoustic noise cancelling, machined aluminum and lambskin headband.',
        colors: ['Champagne Brass', 'Obsidian Black', 'Matte Silver'],
        sizes: ['One Size']
    },
    {
        id: 'prod-5',
        title: 'Silk Tailored Double-Breasted Tuxedo Jacket',
        category: 'Designer Apparel',
        price: 2900,
        comparePrice: 3400,
        rating: 4.9,
        reviewsCount: 15,
        stock: 6,
        isFeatured: true,
        isNew: false,
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
        description: 'Pure Mulberry silk and virgin wool blend with satin lapels, tailored fit, and custom jacquard lining.',
        colors: ['Midnight Navy', 'Jet Black'],
        sizes: ['48EU / 38US', '50EU / 40US', '52EU / 42US', '54EU / 44US']
    },
    {
        id: 'prod-6',
        title: 'Italian Carrara Marble & Brass Table Lamp',
        category: 'Home & Living',
        price: 1450,
        comparePrice: 1700,
        rating: 4.8,
        reviewsCount: 27,
        stock: 9,
        isFeatured: false,
        isNew: false,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
        description: 'Solid Carrara marble base accented with brushed brass alloy and hand-blown frosted glass sphere diffuser.',
        colors: ['White Marble', 'Nero Marquina Black'],
        sizes: ['Standard 45cm']
    },
    {
        id: 'prod-7',
        title: 'Tourbillon Skeleton Grand Complication',
        category: 'Timepieces',
        price: 32000,
        comparePrice: 36000,
        rating: 5.0,
        reviewsCount: 9,
        stock: 2,
        isFeatured: true,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
        description: 'Manual-winding mechanical movement with flying tourbillon at 6 oclock, sapphire front and back case.',
        colors: ['Rose Gold', 'Platinum Silver'],
        sizes: ['42mm']
    },
    {
        id: 'prod-8',
        title: 'Emerald Cut Ceylon Sapphire Ring',
        category: 'High Jewelry',
        price: 14000,
        comparePrice: 15500,
        rating: 4.9,
        reviewsCount: 14,
        stock: 4,
        isFeatured: false,
        isNew: false,
        image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80',
        description: 'A unheated 4.2 carat Ceylon blue sapphire flanked by tapered baguette diamonds set in 950 Platinum.',
        colors: ['Platinum'],
        sizes: ['6 US', '7 US', '8 US']
    }
];

const INITIAL_ORDERS = [
    {
        id: 'ORD-9821',
        date: '2026-10-10',
        total: 19350,
        status: 'Delivered',
        customerName: 'Eleanor Vance',
        email: 'eleanor.vance@luxury.com',
        items: [
            { id: 'prod-1', title: 'Chronograph Royal Oak Obsidian', price: 18500, quantity: 1, color: 'Onyx Black', size: '41mm' },
            { id: 'prod-4', title: 'AURA Studio Headphones', price: 850, quantity: 1, color: 'Champagne Brass', size: 'One Size' }
        ],
        shippingAddress: { street: '740 Park Avenue', city: 'New York', state: 'NY', zip: '10021' }
    },
    {
        id: 'ORD-9822',
        date: '2026-10-11',
        total: 3800,
        status: 'Shipped',
        customerName: 'Marcus Sterling',
        email: 'marcus@sterlingholdings.com',
        items: [
            { id: 'prod-3', title: 'Monogram Handcrafted Calfskin Weekender', price: 3800, quantity: 1, color: 'Cognac Brown', size: 'Standard 48cm' }
        ],
        shippingAddress: { street: '100 Rodeo Drive', city: 'Beverly Hills', state: 'CA', zip: '90210' }
    },
    {
        id: 'ORD-9823',
        date: '2026-10-12',
        total: 6200,
        status: 'Processing',
        customerName: 'Sophia Lorenzi',
        email: 'sophia@lorenzidesign.com',
        items: [
            { id: 'prod-2', title: 'Elysian 18K Rose Gold Diamond Cuff', price: 6200, quantity: 1, color: 'Rose Gold', size: 'Medium (17cm)' }
        ],
        shippingAddress: { street: '250 Eaton Square', city: 'London', state: 'UK', zip: 'SW1W 9EN' }
    }
];

const REVENUE_ANALYTICS = [
    { month: 'May', sales: 68000, orders: 18 },
    { month: 'Jun', sales: 94000, orders: 24 },
    { month: 'Jul', sales: 82000, orders: 21 },
    { month: 'Aug', sales: 115000, orders: 32 },
    { month: 'Sep', sales: 142000, orders: 39 },
    { month: 'Oct', sales: 188000, orders: 48 }
];

const CATEGORY_SALES = [
    { category: 'Timepieces', value: 85000 },
    { category: 'High Jewelry', value: 62000 },
    { category: 'Leather Goods', value: 41000 },
    { category: 'Designer Apparel', value: 29000 },
    { category: 'Audio & Tech', value: 18000 }
];

export default function App() {
    // Application Core State
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [products, setProducts] = useState(INITIAL_PRODUCTS);
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState(['prod-1', 'prod-2']);

    // Filters & Search State
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState(35000);
    const [sortBy, setSortBy] = useState('featured');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Modals & Drawers State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    // Admin Portal State
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminPinModal, setShowAdminPinModal] = useState(false);
    const [adminPinInput, setAdminPinInput] = useState('');
    const [adminTab, setAdminTab] = useState('analytics');
    const [editingProduct, setEditingProduct] = useState(null);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);

    // Form State
    const [promoCode, setPromoCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [activeOrderReceipt, setActiveOrderReceipt] = useState(null);

    // Checkout Form Fields
    const [checkoutData, setCheckoutData] = useState({
        fullName: 'Jane Davenport',
        email: 'jane.davenport@aura.com',
        phone: '+1 (555) 234-5678',
        street: '5th Avenue & 57th Street',
        city: 'New York',
        state: 'NY',
        zip: '10022',
        cardName: 'Jane Davenport',
        cardNumber: '4532 •••• •••• 8892',
        expDate: '08/28',
        cvv: '921'
    });

    // AI Concierge Chat State
    const [aiMessages, setAiMessages] = useState([
        {
            role: 'model',
            content: 'Welcome to AURA Luxury Store. I am your personal styling concierge. How may I assist your choices today? I can recommend bespoke gifts, pair outfits, or explain timepiece complications.'
        }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);

    useEffect(() => {
        if (!auth) return;
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Auth error:", err);
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    // Sync Products & Orders from Firestore if available
    useEffect(() => {
        if (!db || !user) return;

        // Public Products listener
        const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
        const unsubProducts = onSnapshot(productsRef, (snapshot) => {
            if (!snapshot.empty) {
                const loadedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(loadedProducts);
            }
        }, (err) => console.log("Products listener note:", err));

        // Public Orders listener
        const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
        const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
            if (!snapshot.empty) {
                const loadedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(loadedOrders);
            }
        }, (err) => console.log("Orders listener note:", err));

        return () => {
            unsubProducts();
            unsubOrders();
        };
    }, [user]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleAddToCart = (product, selectedSize = null, selectedColor = null, quantity = 1) => {
        const size = selectedSize || product.sizes?.[0] || 'Standard';
        const color = selectedColor || product.colors?.[0] || 'Default';

        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.productId === product.id && item.size === size && item.color === color
            );
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        cartItemId: `${product.id}-${size}-${color}-${Date.now()}`,
                        productId: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        size,
                        color,
                        quantity
                    }
                ];
            }
        });
        showToast(`Added ${product.title} to your bag`);
    };

    const handleRemoveFromCart = (cartItemId) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const handleUpdateQuantity = (cartItemId, delta) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.cartItemId === cartItemId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const toggleWishlist = (productId) => {
        setWishlist((prev) => {
            const exists = prev.includes(productId);
            if (exists) {
                showToast('Item removed from Wishlist');
                return prev.filter((id) => id !== productId);
            } else {
                showToast('Saved to your luxury Wishlist');
                return [...prev, productId];
            }
        });
    };

    const cartSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cart]);

    const discountAmount = useMemo(() => {
        return (cartSubtotal * discountPercent) / 100;
    }, [cartSubtotal, discountPercent]);

    const shippingCost = useMemo(() => {
        if (cartSubtotal === 0) return 0;
        return cartSubtotal > 1000 ? 0 : 50;
    }, [cartSubtotal]);

    const taxAmount = useMemo(() => {
        return (cartSubtotal - discountAmount) * 0.08;
    }, [cartSubtotal, discountAmount]);

    const cartTotal = useMemo(() => {
        return Math.max(0, cartSubtotal - discountAmount + shippingCost + taxAmount);
    }, [cartSubtotal, discountAmount, shippingCost, taxAmount]);

    const handleApplyPromo = (e) => {
        e.preventDefault();
        const code = promoCode.trim().toUpperCase();
        if (code === 'AURA10') {
            setDiscountPercent(10);
            setAppliedCoupon('AURA10 (10% Off)');
            showToast('Promotional Code AURA10 applied!');
        } else if (code === 'SUMMER20' || code === 'LUXURY20') {
            setDiscountPercent(20);
            setAppliedCoupon('LUXURY20 (20% Off Privileges)');
            showToast('Exclusive 20% discount activated!');
        } else {
            showToast('Invalid promotion code');
        }
    };

    const handlePlaceOrder = async () => {
        const newOrder = {
            id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            total: cartTotal,
            status: 'Processing',
            customerName: checkoutData.fullName,
            email: checkoutData.email,
            items: [...cart],
            shippingAddress: {
                street: checkoutData.street,
                city: checkoutData.city,
                state: checkoutData.state,
                zip: checkoutData.zip
            }
        };

        setOrders((prev) => [newOrder, ...prev]);

        // Persist to Firestore if available
        if (db && user) {
            try {
                const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', newOrder.id);
                await setDoc(orderRef, newOrder);
            } catch (err) {
                console.error("Error saving order to Firestore:", err);
            }
        }

        setActiveOrderReceipt(newOrder);
        setCart([]);
        setCheckoutStep(3); // Receipt Step
        showToast('Order confirmed! Receipt generated.');
    };

    const handleSendAiMessage = async (promptOverride = null) => {
        const queryText = promptOverride || aiInput;
        if (!queryText.trim() || isAiThinking) return;

        const userMsg = { role: 'user', content: queryText };
        const updatedHistory = [...aiMessages, userMsg];
        setAiMessages(updatedHistory);
        setAiInput('');
        setIsAiThinking(true);

        try {
            const systemInstruction = `You are "AURA Concierge", an ultra-exclusive AI Personal Shopping Assistant & Fashion Stylist for AURA Luxury Store.
Your tone is sophisticated, polite, high-end, and deeply knowledgeable about horology, fine jewelry, haute couture, and interior design.
Current Available Products in AURA catalog:
${JSON.stringify(products.map(p => ({ title: p.title, price: `$${p.price.toLocaleString()}`, category: p.category, desc: p.description, stock: p.stock })))}

Instructions:
1. Recommend items from the catalog above with specific prices.
2. Provide tailored gift suggestions or styling advice.
3. Be concise, stylish, and helpful. Keep responses under 3 paragraphs.`;

            const contentsPayload = updatedHistory.map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contentsPayload,
                    systemInstruction: { parts: [{ text: systemInstruction }] }
                })
            });

            if (!res.ok) throw new Error("API call failed");

            const data = await res.json();
            const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I am currently attending to another client. Allow me a moment to assist you further.";

            setAiMessages((prev) => [...prev, { role: 'model', content: replyText }]);
        } catch (err) {
            console.error("Gemini AI error:", err);
            setAiMessages((prev) => [
                ...prev,
                { role: 'model', content: "My apologies. I experienced a momentary disturbance in connection. Based on our collection, I recommend our Chronograph Royal Oak or Carrara Marble Lamp for a majestic touch." }
            ]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPrice = p.price <= priceRange;
            return matchesCategory && matchesSearch && matchesPrice;
        }).sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            return b.isFeatured ? 1 : -1;
        });
    }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

    const handleAdminToggle = () => {
        if (isAdminMode) {
            setIsAdminMode(false);
            showToast('Exited Admin Management Mode');
        } else {
            setShowAdminPinModal(true);
        }
    };

    const handleVerifyAdminPin = (e) => {
        e.preventDefault();
        if (adminPinInput === 'aura2026' || adminPinInput === 'admin' || adminPinInput === '1234') {
            setIsAdminMode(true);
            setShowAdminPinModal(false);
            setAdminPinInput('');
            showToast('Admin Access Granted');
        } else {
            showToast('Incorrect Passcode (Try: aura2026)');
        }
    };

    const handleSaveProduct = async (productData) => {
        let updatedProducts;
        if (editingProduct) {
            updatedProducts = products.map((p) => p.id === editingProduct.id ? { ...p, ...productData } : p);
            showToast('Product details updated');
        } else {
            const newProd = {
                id: `prod-${Date.now()}`,
                rating: 5.0,
                reviewsCount: 1,
                isFeatured: true,
                isNew: true,
                ...productData
            };
            updatedProducts = [newProd, ...products];
            showToast('New product added to inventory');
        }
        setProducts(updatedProducts);
        setEditingProduct(null);
        setIsAddProductOpen(false);

        // Sync to Firestore if available
        if (db && user) {
            try {
                const docId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
                const prodRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', docId);
                await setDoc(prodRef, productData, { merge: true });
            } catch (e) {
                console.error("Firestore sync error:", e);
            }
        }
    };

    const handleDeleteProduct = async (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Product removed from catalog');
        if (db && user) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
            } catch (e) {
                console.error("Firestore delete error:", e);
            }
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast(`Order ${orderId} status set to ${newStatus}`);
        if (db && user) {
            try {
                const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
                await updateDoc(orderRef, { status: newStatus });
            } catch (e) {
                console.error("Order status update error:", e);
            }
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b0c10] text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
            {/* Toast Notification Popup */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900/90 text-amber-300 border border-amber-500/30 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md text-sm font-medium animate-bounce">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Main Glassmorphic Navigation Bar */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${theme === 'dark' ? 'bg-[#0b0c10]/80 border-slate-800/80' : 'bg-white/80 border-slate-200'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCategory('All')}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <span className="text-slate-950 font-serif font-bold text-xl tracking-tighter">A</span>
                        </div>
                        <div>
                            <span className="font-serif text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                                AURA
                            </span>
                            <span className="block text-[9px] uppercase tracking-[0.3em] text-amber-500/80 font-mono -mt-1">
                                Luxury Store
                            </span>
                        </div>
                    </div>

                    {/* Search Bar with Instant Dropdown */}
                    <div className="relative flex-1 max-w-md hidden md:block">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search watches, high jewelry, leather..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                className={`w-full py-2.5 pl-10 pr-4 rounded-full text-sm border focus:outline-none transition-all ${theme === 'dark'
                                        ? 'bg-slate-900/60 border-slate-800 text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30'
                                        : 'bg-slate-100 border-slate-200 text-slate-800 focus:border-amber-500'
                                    }`}
                            />
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-amber-400">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Live Search Suggestions Dropdown */}
                        {isSearchFocused && searchQuery && (
                            <div className={`absolute left-0 right-0 top-12 rounded-2xl border shadow-2xl p-3 z-50 backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
                                }`}>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 px-3">Matching Inventory</p>
                                {filteredProducts.slice(0, 4).length > 0 ? (
                                    filteredProducts.slice(0, 4).map((prod) => (
                                        <div
                                            key={prod.id}
                                            onClick={() => {
                                                setSelectedProduct(prod);
                                                setSearchQuery('');
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-500/10 cursor-pointer transition-all"
                                        >
                                            <img src={prod.image} alt={prod.title} className="w-10 h-10 rounded-lg object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{prod.title}</p>
                                                <p className="text-[11px] text-amber-400">${prod.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 p-3 text-center">No luxury pieces match your query.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Icons & Controls */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* AI Concierge Launch Button */}
                        <button
                            onClick={() => setIsAiOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 transition-all shadow-lg shadow-amber-500/10"
                        >
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="hidden lg:inline">AI Stylist</span>
                        </button>

                        {/* Admin Portal Toggle */}
                        <button
                            onClick={handleAdminToggle}
                            className={`p-2.5 rounded-full border transition-all ${isAdminMode
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                    : theme === 'dark'
                                        ? 'border-slate-800 hover:border-amber-500/40 text-slate-300'
                                        : 'border-slate-200 hover:border-amber-500 text-slate-700'
                                }`}
                            title={isAdminMode ? 'Exit Admin Dashboard' : 'Admin Portal'}
                        >
                            <Lock className="w-4 h-4" />
                        </button>

                        {/* Dark / Light Mode Switch */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className={`p-2.5 rounded-full border transition-all ${theme === 'dark'
                                    ? 'border-slate-800 hover:border-amber-500/40 text-amber-400'
                                    : 'border-slate-200 hover:border-amber-500 text-slate-700'
                                }`}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        {/* Wishlist Button */}
                        <button
                            onClick={() => setIsWishlistOpen(true)}
                            className="relative p-2.5 rounded-full border border-slate-800/80 hover:border-amber-500/40 text-slate-300 transition-all"
                        >
                            <Heart className="w-4 h-4" />
                            {wishlist.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                                    {wishlist.length}
                                </span>
                            )}
                        </button>

                        {/* Shopping Cart Drawer Trigger */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 text-amber-400 border border-amber-400 text-[11px] font-bold flex items-center justify-center">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                </span>
                            )}
                        </button>

                        {/* User Profile / Orders Trigger */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="p-2.5 rounded-full border border-slate-800/80 hover:border-amber-500/40 text-slate-300 transition-all"
                        >
                            <User className="w-4 h-4" />
                        </button>

                    </div>
                </div>
            </header>

            { }
            {!isAdminMode && (
                <section className="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900 to-[#0b0c10] py-16 sm:py-24">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.08),transparent_50%)] pointer-events-none" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs tracking-widest uppercase font-mono">
                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                Autumn 2026 Haute Collection
                            </div>

                            <h1 className="text-4xl sm:text-6xl font-serif font-normal tracking-tight text-slate-100 leading-[1.1]">
                                Mastery in <br />
                                <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                                    Every Detail.
                                </span>
                            </h1>

                            <p className="text-slate-400 text-sm sm:text-base max-w-lg font-light leading-relaxed">
                                Discover exceptional timepieces, handcrafted jewelry, and fine leather goods curated for connoisseurs of uncompromised luxury.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        const elem = document.getElementById('catalog-section');
                                        elem?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-semibold text-sm tracking-wide shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-2"
                                >
                                    Explore Collection
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => setIsAiOpen(true)}
                                    className="px-6 py-3.5 rounded-full border border-slate-700 hover:border-amber-500/50 text-slate-200 text-sm font-medium transition-all backdrop-blur-md flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    Consult AI Concierge
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-slate-400 text-xs">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                                    <span>100% Certified Authentic</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-amber-400" />
                                    <span>Complimentary Express Shipping</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-amber-400" />
                                    <span>White Glove Returns</span>
                                </div>
                            </div>
                        </div>

                        {/* Featured Hero Product Showcase */}
                        <div className="relative group">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/30 to-yellow-500/10 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className={`relative rounded-3xl overflow-hidden border p-2 backdrop-blur-2xl ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                                }`}>
                                <img
                                    src={products[0].image}
                                    alt="Featured Chronograph"
                                    className="w-full h-[380px] sm:h-[440px] object-cover rounded-2xl transform group-hover:scale-105 transition duration-700"
                                />
                                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400">Featured Masterpiece</span>
                                        <h3 className="text-sm font-semibold text-slate-100">{products[0].title}</h3>
                                        <p className="text-xs text-amber-300 font-mono">${products[0].price.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProduct(products[0])}
                                        className="p-3 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            )}

            { }
            {isAdminMode ? (
                /* ================= ADMIN MANAGEMENT PORTAL ================= */
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                <h2 className="text-2xl font-serif font-bold text-amber-400">AURA Control Center</h2>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Real-time revenue analytics, order fulfillment & catalog management</p>
                        </div>

                        {/* Admin Tabs Toggle */}
                        <div className="flex items-center gap-2 p-1 rounded-full bg-slate-900 border border-slate-800">
                            <button
                                onClick={() => setAdminTab('analytics')}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${adminTab === 'analytics' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Analytics & Revenue
                            </button>
                            <button
                                onClick={() => setAdminTab('products')}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${adminTab === 'products' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Inventory CRUD ({products.length})
                            </button>
                            <button
                                onClick={() => setAdminTab('orders')}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${adminTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Fulfillment ({orders.length})
                            </button>
                        </div>
                    </div>

                    {/* Admin Analytics View */}
                    {adminTab === 'analytics' && (
                        <div className="space-y-8">
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                        <span>Total Sales Revenue</span>
                                        <DollarSign className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <p className="text-2xl font-bold font-mono text-amber-400">$689,000</p>
                                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> +24.8% from last month
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                        <span>Active Orders</span>
                                        <Package className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <p className="text-2xl font-bold font-mono text-slate-100">{orders.length}</p>
                                    <p className="text-[11px] text-amber-400 mt-1">3 Pending Dispatch</p>
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                        <span>Average Order Value</span>
                                        <BarChart3 className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <p className="text-2xl font-bold font-mono text-slate-100">$9,480</p>
                                    <p className="text-[11px] text-emerald-400 mt-1">+12% vs luxury benchmark</p>
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                        <span>VIP Conversion Rate</span>
                                        <Zap className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <p className="text-2xl font-bold font-mono text-slate-100">4.2%</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Top tier traffic performance</p>
                                </div>
                            </div>

                            {/* Recharts Analytics Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-200">Revenue Growth Trajectory ($ USD)</h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={REVENUE_ANALYTICS}>
                                                <defs>
                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="month" stroke="#64748b" />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                                <Area type="monotone" dataKey="sales" stroke="#d4af37" fillOpacity={1} fill="url(#colorSales)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-200">Sales Breakdown by Category</h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={CATEGORY_SALES}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                                <Bar dataKey="value" fill="#e5c158" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Inventory Management CRUD */}
                    {adminTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-serif font-semibold text-slate-100">Product Catalog Management</h3>
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setIsAddProductOpen(true);
                                    }}
                                    className="px-4 py-2 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Luxury Item
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                                        <tr>
                                            <th className="p-4">Item</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Stock</th>
                                            <th className="p-4">Rating</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-200">
                                        {products.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="p-4 flex items-center gap-3">
                                                    <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                                                    <span className="font-medium">{p.title}</span>
                                                </td>
                                                <td className="p-4 text-slate-400">{p.category}</td>
                                                <td className="p-4 font-mono text-amber-400">${p.price.toLocaleString()}</td>
                                                <td className="p-4 font-mono">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] ${p.stock < 5 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                                                        }`}>
                                                        {p.stock} units
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-yellow-400">★ {p.rating}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setIsAddProductOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg border border-slate-700 hover:border-amber-400 text-amber-400"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                        className="p-1.5 rounded-lg border border-slate-700 hover:border-red-400 text-red-400"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Admin Fulfillment Orders Management */}
                    {adminTab === 'orders' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-serif font-semibold text-slate-100">Customer Order Fulfillment</h3>
                            <div className="space-y-4">
                                {orders.map((ord) => (
                                    <div key={ord.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-amber-400 font-bold">{ord.id}</span>
                                                <span className="text-xs text-slate-400">• {ord.date}</span>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    {ord.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 font-medium">{ord.customerName} ({ord.email})</p>
                                            <p className="text-xs text-slate-400">{ord.shippingAddress?.street}, {ord.shippingAddress?.city}</p>
                                            <div className="text-xs text-slate-400">
                                                Items: {ord.items.map(i => `${i.title} (x${i.quantity})`).join(', ')}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Order Value</p>
                                                <p className="text-lg font-bold font-mono text-amber-400">${ord.total.toLocaleString()}</p>
                                            </div>

                                            <select
                                                value={ord.status}
                                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                                            >
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </main>
            ) : (
                /* ================= PUBLIC STOREFRONT CATALOG ================= */
                <main id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                    { }
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">

                        {/* Category Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                            {['All', 'Timepieces', 'High Jewelry', 'Leather Goods', 'Audio & Tech', 'Designer Apparel', 'Home & Living'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                                            : theme === 'dark'
                                                ? 'bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-slate-300'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Price Slider & Sorting Select */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Max Price Range Slider */}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>Max Price:</span>
                                <input
                                    type="range"
                                    min="500"
                                    max="35000"
                                    step="500"
                                    value={priceRange}
                                    onChange={(e) => setPriceRange(Number(e.target.value))}
                                    className="w-28 accent-amber-500"
                                />
                                <span className="font-mono text-amber-400 font-medium">${priceRange.toLocaleString()}</span>
                            </div>

                            {/* Sorting Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none ${theme === 'dark'
                                        ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500/50'
                                        : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                            >
                                <option value="featured">Sort by: Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Top Rated</option>
                            </select>
                        </div>
                    </div>

                    { }
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((prod) => {
                            const isWishlisted = wishlist.includes(prod.id);
                            return (
                                <div
                                    key={prod.id}
                                    className={`group relative rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-1.5 ${theme === 'dark'
                                            ? 'bg-slate-900/50 border-slate-800/80 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10'
                                            : 'bg-white border-slate-200 hover:shadow-xl'
                                        }`}
                                >
                                    {/* Product Thumbnail */}
                                    <div className="relative aspect-square overflow-hidden bg-slate-950">
                                        <img
                                            src={prod.image}
                                            alt={prod.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />

                                        {/* Stock & New Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                            {prod.isNew && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-amber-500 text-slate-950 font-bold shadow-md">
                                                    New
                                                </span>
                                            )}
                                            {prod.stock < 5 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-red-500/90 text-white font-bold backdrop-blur-md">
                                                    Only {prod.stock} Left
                                                </span>
                                            )}
                                        </div>

                                        {/* Wishlist Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlist(prod.id);
                                            }}
                                            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all ${isWishlisted
                                                    ? 'bg-amber-500 text-slate-950'
                                                    : 'bg-slate-950/60 text-slate-300 hover:text-amber-400'
                                                }`}
                                        >
                                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-slate-950' : ''}`} />
                                        </button>

                                        {/* Quick View Button */}
                                        <button
                                            onClick={() => setSelectedProduct(prod)}
                                            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-950/90 backdrop-blur-md text-amber-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950"
                                        >
                                            Quick View
                                        </button>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-5 space-y-2">
                                        <p className="text-[10px] uppercase font-mono tracking-widest text-amber-500/80">{prod.category}</p>
                                        <h3
                                            onClick={() => setSelectedProduct(prod)}
                                            className="text-sm font-semibold truncate cursor-pointer hover:text-amber-400 transition-colors"
                                        >
                                            {prod.title}
                                        </h3>

                                        <div className="flex items-center justify-between pt-1">
                                            <div>
                                                <span className="text-base font-bold font-mono text-amber-400">${prod.price.toLocaleString()}</span>
                                                {prod.comparePrice && (
                                                    <span className="ml-2 text-xs text-slate-500 line-through font-mono">
                                                        ${prod.comparePrice.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                <span>{prod.rating}</span>
                                            </div>
                                        </div>

                                        {/* Direct Add To Bag Action */}
                                        <button
                                            onClick={() => handleAddToCart(prod)}
                                            className="w-full mt-3 py-2.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                                        </button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20 space-y-3">
                            <Search className="w-10 h-10 text-slate-500 mx-auto" />
                            <h3 className="text-lg font-serif text-slate-300">No Luxury Items Found</h3>
                            <p className="text-xs text-slate-500">Try adjusting your category filters or max price threshold.</p>
                        </div>
                    )}

                </main>
            )}

            { }
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden shadow-2xl p-6 md:p-8 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 p-2 rounded-full border border-slate-700 text-slate-400 hover:text-amber-400"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-950 border border-slate-800">
                                <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <span className="text-xs uppercase tracking-widest font-mono text-amber-400">{selectedProduct.category}</span>
                                    <h2 className="text-2xl font-serif font-bold mt-1">{selectedProduct.title}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-2xl font-bold font-mono text-amber-400">${selectedProduct.price.toLocaleString()}</span>
                                        <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10">
                                            In Stock ({selectedProduct.stock} units)
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed">{selectedProduct.description}</p>

                                {/* Color Variants Selector */}
                                {selectedProduct.colors && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-semibold text-slate-300">Select Edition / Color:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.colors.map((c) => (
                                                <span key={c} className="px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-200 bg-amber-500/10">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selector */}
                                {selectedProduct.sizes && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-semibold text-slate-300">Select Dimension / Size:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.sizes.map((s) => (
                                                <span key={s} className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={() => {
                                            handleAddToCart(selectedProduct);
                                            setSelectedProduct(null);
                                        }}
                                        className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag className="w-4 h-4" /> Add to Shopping Bag
                                    </button>

                                    <button
                                        onClick={() => toggleWishlist(selectedProduct.id)}
                                        className="p-3.5 rounded-full border border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-400"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            { }
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className={`w-full max-w-md h-full flex flex-col border-l shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                        }`}>

                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-amber-400" />
                                <h2 className="text-lg font-serif font-bold">Your Shopping Bag ({cart.length})</h2>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-amber-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-800/60">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <div key={item.cartItemId} className="pt-4 flex gap-4 items-center">
                                        <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-slate-800" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-semibold truncate">{item.title}</h4>
                                            <p className="text-[11px] text-slate-400">{item.color} • {item.size}</p>
                                            <p className="text-xs font-mono font-bold text-amber-400 mt-1">${item.price.toLocaleString()}</p>

                                            {/* Quantity Controller */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                                                    className="w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center text-xs"
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-mono px-2">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                                                    className="w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center text-xs"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveFromCart(item.cartItemId)}
                                            className="text-slate-500 hover:text-red-400 p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 space-y-3">
                                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                                    <p className="text-sm text-slate-400">Your luxury bag is currently empty.</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Drawer Footer & Checkout Action */}
                        {cart.length > 0 && (
                            <div className="p-6 border-t border-slate-800 bg-slate-950/50 space-y-4">

                                {/* Coupon Code Input */}
                                <form onSubmit={handleApplyPromo} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon code (e.g. AURA10)"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                    <button type="submit" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold text-amber-300">
                                        Apply
                                    </button>
                                </form>

                                {appliedCoupon && (
                                    <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> Coupon Active: {appliedCoupon}
                                    </p>
                                )}

                                {/* Subtotal Calculation Summary */}
                                <div className="space-y-1.5 text-xs font-mono">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span>${cartSubtotal.toLocaleString()}</span>
                                    </div>
                                    {discountPercent > 0 && (
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Discount ({discountPercent}%)</span>
                                            <span>-${discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-400">
                                        <span>Complimentary Express Shipping</span>
                                        <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost}`}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Estimated Luxury Tax (8%)</span>
                                        <span>${taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-amber-400 pt-2 border-t border-slate-800">
                                        <span>Total Due</span>
                                        <span>${cartTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsCartOpen(false);
                                        setIsCheckoutOpen(true);
                                        setCheckoutStep(1);
                                    }}
                                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" /> Proceed to Secure Checkout
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            { }
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
                    <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 p-6 sm:p-8 shadow-2xl space-y-6 my-8">
                        <button
                            onClick={() => setIsCheckoutOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-amber-400"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Step Indicators */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full text-xs font-bold font-mono flex items-center justify-center ${checkoutStep >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                    }`}>1</span>
                                <span className="text-xs font-semibold">Shipping</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full text-xs font-bold font-mono flex items-center justify-center ${checkoutStep >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                    }`}>2</span>
                                <span className="text-xs font-semibold">Payment</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <div className="flex items-center gap-2">
                                <span className={`w-7 h-7 rounded-full text-xs font-bold font-mono flex items-center justify-center ${checkoutStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                    }`}>3</span>
                                <span className="text-xs font-semibold">Confirmation</span>
                            </div>
                        </div>

                        {/* Step 1: Shipping Address Form */}
                        {checkoutStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-semibold text-amber-400">Shipping & Delivery Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={checkoutData.fullName}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, fullName: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={checkoutData.email}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, email: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-slate-400 mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={checkoutData.street}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, street: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={checkoutData.city}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, city: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">State / Postal Code</label>
                                        <input
                                            type="text"
                                            value={checkoutData.zip}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, zip: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setCheckoutStep(2)}
                                    className="w-full mt-4 py-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
                                >
                                    Continue to Payment Method
                                </button>
                            </div>
                        )}

                        {/* Step 2: Payment Simulation */}
                        {checkoutStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-semibold text-amber-400">Payment Authorization</h3>
                                <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-tr from-slate-950 to-slate-900 space-y-3 font-mono text-xs">
                                    <div className="flex justify-between items-center text-amber-400">
                                        <CreditCard className="w-6 h-6" />
                                        <span>AURA VIP Encrypted</span>
                                    </div>
                                    <p className="text-base tracking-widest text-slate-200">{checkoutData.cardNumber}</p>
                                    <div className="flex justify-between text-slate-400">
                                        <span>HOLDER: {checkoutData.cardName}</span>
                                        <span>EXP: {checkoutData.expDate}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Cardholder Name</label>
                                        <input
                                            type="text"
                                            value={checkoutData.cardName}
                                            onChange={(e) => setCheckoutData({ ...checkoutData, cardName: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 mb-1">Expiration Date</label>
                                            <input
                                                type="text"
                                                value={checkoutData.expDate}
                                                onChange={(e) => setCheckoutData({ ...checkoutData, expDate: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1">CVV Security Code</label>
                                            <input
                                                type="password"
                                                value={checkoutData.cvv}
                                                onChange={(e) => setCheckoutData({ ...checkoutData, cvv: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => setCheckoutStep(1)}
                                        className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 text-xs font-semibold"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-xl shadow-amber-500/20"
                                    >
                                        Confirm Order (${cartTotal.toLocaleString()})
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation & Downloadable Receipt View */}
                        {checkoutStep === 3 && activeOrderReceipt && (
                            <div id="printable-receipt" className="space-y-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-serif font-bold text-slate-100">Order Confirmed</h3>
                                    <p className="text-xs text-slate-400">Order ID: <span className="font-mono text-amber-400 font-bold">{activeOrderReceipt.id}</span></p>
                                </div>

                                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 text-left space-y-3 text-xs font-mono">
                                    <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                                        <span>Customer: {activeOrderReceipt.customerName}</span>
                                        <span>Date: {activeOrderReceipt.date}</span>
                                    </div>

                                    {activeOrderReceipt.items.map((it) => (
                                        <div key={it.cartItemId || it.id} className="flex justify-between text-slate-200">
                                            <span>{it.title} (x{it.quantity})</span>
                                            <span>${(it.price * it.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}

                                    <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-amber-400 text-sm">
                                        <span>Total Amount Paid</span>
                                        <span>${activeOrderReceipt.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4 pt-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-6 py-2.5 rounded-full border border-slate-700 text-slate-300 text-xs font-semibold hover:border-amber-400 flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> Print Receipt
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCheckoutOpen(false);
                                            setIsProfileOpen(true);
                                        }}
                                        className="px-6 py-2.5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
                                    >
                                        Track Order Status
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            { }
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 text-slate-100 p-6 flex flex-col space-y-6 overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                                    JD
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Jane Davenport</h3>
                                    <p className="text-[11px] text-slate-400">VIP Club Member #8821</p>
                                </div>
                            </div>
                            <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-amber-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs uppercase font-mono tracking-widest text-amber-400">Your Order History & Live Tracking</h4>

                            {orders.map((ord) => (
                                <div key={ord.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-mono text-amber-400 font-bold">{ord.id}</span>
                                        <span className="text-[10px] text-slate-400">{ord.date}</span>
                                    </div>

                                    <p className="text-xs text-slate-300 font-medium">Total: ${ord.total.toLocaleString()}</p>

                                    {/* Status Progress Tracker */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                            <span>Status</span>
                                            <span className="text-amber-300 font-bold">{ord.status}</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                                                style={{
                                                    width:
                                                        ord.status === 'Processing' ? '33%' : ord.status === 'Shipped' ? '66%' : '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            { }
            {isWishlistOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-serif font-bold text-amber-400 flex items-center gap-2">
                                <Heart className="w-5 h-5 fill-amber-400" /> Saved Luxury Wishlist
                            </h3>
                            <button onClick={() => setIsWishlistOpen(false)} className="text-slate-400 hover:text-amber-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-3">
                            {wishlist.length > 0 ? (
                                products.filter(p => wishlist.includes(p.id)).map((p) => (
                                    <div key={p.id} className="p-3 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
                                        <img src={p.image} alt={p.title} className="w-12 h-12 rounded-xl object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{p.title}</p>
                                            <p className="text-xs font-mono text-amber-400">${p.price.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(p)}
                                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                                        >
                                            Move to Bag
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-8">Your Wishlist is currently empty.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            { }
            {isAiOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 text-slate-100 p-6 flex flex-col space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                <h3 className="text-lg font-serif font-bold text-amber-400">AURA AI Personal Stylist</h3>
                            </div>
                            <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-amber-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Prompt Suggestion Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                onClick={() => handleSendAiMessage("Suggest a timepiece under $20,000")}
                                className="px-3 py-1 rounded-full text-[10px] font-mono border border-amber-500/30 text-amber-300 bg-amber-500/10 whitespace-nowrap"
                            >
                                ⌚ Watches under $20k
                            </button>
                            <button
                                onClick={() => handleSendAiMessage("What accessories pair best with a navy tuxedo?")}
                                className="px-3 py-1 rounded-full text-[10px] font-mono border border-amber-500/30 text-amber-300 bg-amber-500/10 whitespace-nowrap"
                            >
                                👔 Black Tie Accessories
                            </button>
                        </div>

                        {/* Chat History Messages */}
                        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-950/50 rounded-2xl border border-slate-800">
                            {aiMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${msg.role === 'user'
                                            ? 'ml-auto bg-amber-500 text-slate-950 font-medium'
                                            : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            {isAiThinking && (
                                <div className="p-3 rounded-2xl text-xs text-amber-400 bg-slate-900 border border-slate-800 animate-pulse">
                                    Consulting catalog archives...
                                </div>
                            )}
                        </div>

                        {/* Chat Input Field */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ask for gift suggestions or outfit pairings..."
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                                className="flex-1 px-4 py-2.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            />
                            <button
                                onClick={() => handleSendAiMessage()}
                                className="p-2.5 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            { }
            {showAdminPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 space-y-4">
                        <h3 className="text-lg font-serif font-bold text-amber-400 flex items-center gap-2">
                            <Lock className="w-5 h-5" /> Admin Security Verification
                        </h3>
                        <p className="text-xs text-slate-400">Enter administrator passcode to access inventory management & sales analytics.</p>

                        <form onSubmit={handleVerifyAdminPin} className="space-y-3">
                            <input
                                type="password"
                                placeholder="Passcode (Default: aura2026)"
                                value={adminPinInput}
                                onChange={(e) => setAdminPinInput(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminPinModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                                >
                                    Unlock Portal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            { }
            {isAddProductOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-serif font-bold text-amber-400">
                            {editingProduct ? 'Edit Product Details' : 'Add New Luxury Item'}
                        </h3>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleSaveProduct({
                                    title: formData.get('title'),
                                    category: formData.get('category'),
                                    price: Number(formData.get('price')),
                                    stock: Number(formData.get('stock')),
                                    image: formData.get('image'),
                                    description: formData.get('description')
                                });
                            }}
                            className="space-y-3 text-xs"
                        >
                            <div>
                                <label className="block text-slate-400 mb-1">Product Title</label>
                                <input
                                    name="title"
                                    defaultValue={editingProduct?.title || ''}
                                    required
                                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Category</label>
                                    <select
                                        name="category"
                                        defaultValue={editingProduct?.category || 'Timepieces'}
                                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Timepieces">Timepieces</option>
                                        <option value="High Jewelry">High Jewelry</option>
                                        <option value="Leather Goods">Leather Goods</option>
                                        <option value="Audio & Tech">Audio & Tech</option>
                                        <option value="Designer Apparel">Designer Apparel</option>
                                        <option value="Home & Living">Home & Living</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-400 mb-1">Price ($ USD)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        defaultValue={editingProduct?.price || 1000}
                                        required
                                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Initial Stock Count</label>
                                <input
                                    name="stock"
                                    type="number"
                                    defaultValue={editingProduct?.stock || 10}
                                    required
                                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Image URL (Unsplash or direct image link)</label>
                                <input
                                    name="image"
                                    defaultValue={editingProduct?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80'}
                                    required
                                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    defaultValue={editingProduct?.description || ''}
                                    required
                                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProductOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                                >
                                    Save Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            { }
            <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                        <span className="font-serif text-lg font-bold text-amber-400 tracking-widest">AURA LUXURY</span>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                            Serving distinguished collectors and connoisseurs worldwide with certified luxury timepieces and fine jewelry.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-slate-200 font-semibold mb-3">Client Concierge</h4>
                        <ul className="space-y-2">
                            <li className="hover:text-amber-400 cursor-pointer">White Glove Delivery</li>
                            <li className="hover:text-amber-400 cursor-pointer">Authenticity Guarantee</li>
                            <li className="hover:text-amber-400 cursor-pointer">Private Consultations</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-200 font-semibold mb-3">Boutiques</h4>
                        <ul className="space-y-2 text-slate-400">
                            <li>5th Avenue, New York</li>
                            <li>Rodeo Drive, Beverly Hills</li>
                            <li>New Bond Street, London</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-200 font-semibold mb-3">VIP Newsletter</h4>
                        <p className="text-[11px] mb-2">Subscribe to receive private collection previews.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="vip@luxury.com"
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                            />
                            <button className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">Join</button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono">
                    © 2026 AURA Luxury Store. All Rights Reserved. Crafted with React, Tailwind CSS & Gemini AI.
                </div>
            </footer>

        </div>
    );
}