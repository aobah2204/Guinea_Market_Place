import { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link,
  HashRouter,
} from 'react-router-dom';
import { Analytics, track } from "@vercel/analytics/react";


import supabase from './lib/supabaseClient';
import ClientPage from './pages/ClientPage';
import MerchantPage from './pages/MerchantPage';
import ShopPage from './pages/ShopPage';
import { v4 as uuidv4 } from 'uuid';


class FormData {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  role = 'customer';
};



// Table mapping and helpers
const MERCHANT_TABLE = 'users_merchant';
const CUSTOMER_TABLES = 'users_customers';

async function findProfileByEmail(email) {
  // try merchant first
  try {
    const { data: m } = await supabase.from(MERCHANT_TABLE).select('*').eq('email', email).maybeSingle();
    if (m) return { profile: m, table: MERCHANT_TABLE, role: 'merchant' };
  } catch (e) {
    // ignore
  }

  //for (const t of CUSTOMER_TABLES) {
    try {
      const { data } = await supabase.from(CUSTOMER_TABLES).select('*').eq('email', email).maybeSingle();
      if (data) return { profile: data, table: CUSTOMER_TABLES, role: 'customer' };
    } catch (e) {
      // ignore and try next
    }
  //}

  return { profile: null, table: null, role: null };
}

function getProfileTable(role) {
  return role === 'merchant' ? MERCHANT_TABLE : CUSTOMER_TABLES;
}

async function findProfileByEmailAndRole(email, role) {
  const table = getProfileTable(role);
  try {
    const { data } = await supabase.from(table).select('*').eq('email', email).maybeSingle();
    return { profile: data, table, role };
  } catch (error) {
    return { profile: null, table, role };
  }
}

async function findProfileById(id) {
  try {
    const { data: m } = await supabase.from(MERCHANT_TABLE).select('*').eq('id', id).maybeSingle();
    if (m) return { profile: m, table: MERCHANT_TABLE, role: 'merchant' };
  } catch (e) {}

  //for (const t of CUSTOMER_TABLES) {
    try {
      const { data } = await supabase.from(CUSTOMER_TABLES).select('*').eq('id', id).maybeSingle();
      if (data) return { profile: data, table: CUSTOMER_TABLES, role: 'customer' };
    } catch (e) {}
  //}

  return { profile: null, table: null, role: null };
}

function Header({ query, setQuery, search, setSearch, setAuthMode, setShowAuth, isConnected, setIsConnected, authForm, setCurrentRole, setCurrentUserId, setShowMerchantSetup, onToggleHeader }) {

  return (
    <header className="sticky top-0 z-50 bg-green-200 backdrop-blur border-b shadow-sm">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo et titre */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <button onClick={onToggleHeader} className="rounded-full border p-1 hover:ring-2 hover:ring-green-500 transition" aria-label="Afficher / masquer le header">
            <img
              src="https://media.licdn.com/dms/image/v2/C4E0BAQHMGG0XccZzgA/company-logo_200_200/company-logo_200_200/0/1671889785007?e=2147483647&v=beta&t=yJgczdSFOGYxyyB3zHq5xMdDI5Jo8lMWCjyHKlU8PDE"
              alt="Guinée Connect Logo"
              className="w-10 sm:w-12 h-10 sm:h-12 object-contain rounded-full shadow-md"
            />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl text-green-700 font-extrabold">Guinée Connect</h1>
            <p className="text-xs sm:text-sm text-gray-600">Marketplace + découverte locale</p>
          </div>
        </div>
        
        {/* Barre de recherche 
        <div className="flex gap-2 mb-4 sm:mb-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 px-3 sm:px-4 py-2 rounded-2xl border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="bg-green-600 text-white px-3 sm:px-5 py-2 rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap">Rechercher</button>
        </div>
          */}

        {/* Authentification - responsive */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mt-4 sm:mt-0">
          {isConnected ? (
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="font-semibold text-sm sm:text-base">Bienvenue {authForm.fullName}</div>
              <button onClick={async () => { await supabase.auth.signOut(); setIsConnected(false); setCurrentRole(null); setCurrentUserId(null); setShowMerchantSetup(false); }} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base w-full sm:w-auto">Déconnexion</button>
            
              <div className="flex gap-2 mb-4 sm:mb-0">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 px-3 sm:px-4 py-2 rounded-2xl border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="bg-green-600 text-white px-3 sm:px-5 py-2 rounded-2xl text-sm sm:text-base font-medium whitespace-nowrap">Rechercher</button>
              </div>
            </div>

            
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">              
              <div className="font-light text-sm sm:text-base">Connectez-vous ou créez un compte</div>
              <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="bg-white border px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base w-full sm:w-auto">Connexion</button>
              <button onClick={() => { setAuthMode('register'); setShowAuth(true); }} className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base w-full sm:w-auto">Inscription</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthSection({ authMode, setAuthMode, authForm, setAuthForm, setShowAuth, setShowMerchantSetup, setIsConnected, setCurrentRole, setCurrentUserId, setAccessMessage, setSuccessMessage, setErrorMessage, setCurrentUser, currentUser }) {
  const navigate = useNavigate();  

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAuthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();   

    try { 
      const email = authForm.email.trim().toLowerCase();
      const password = authForm.password;
      const role = authForm.role;

      if (authMode === 'register' && authForm.role === 'merchant') {

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant.');
        }

        const userId = uuidv4();

        const { error: insertError } = await supabase.from(MERCHANT_TABLE).insert([
            {
              id: userId, // UUID générée manuellement
              full_name: authForm.fullName,
              email,
              phone: authForm.phone,
              role: authForm.role,
          },
          ]);

          if (insertError) {
            throw insertError;
          }
          
          localStorage.setItem("currentUserEmail", authForm.email);
          localStorage.setItem("password", authForm.password);
          localStorage.setItem("userRole", authForm.role);

          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setAuthForm((prev) => ({
            ...prev,
            fullName: authForm.fullName || prev.fullName,
            role: authForm.role,
          }));
          setCurrentRole(authForm.role);
          setCurrentUserId(userId);
          setSuccessMessage('Création compte réussie.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');
          return;
      }
      
      if(authMode === 'register' && authForm.role === 'customer'){

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant.');
        }

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant.');
        }

        const userId = uuidv4();
        const { error: insertError } = await supabase.from(CUSTOMER_TABLES).insert([
            {
              id: userId,
              full_name: authForm.fullName,
              email,
              phone: authForm.phone,
              role: authForm.role,
          },
          ]);

          if (insertError) {
            throw insertError;
          }

          localStorage.setItem("currentUserEmail", authForm.email);
          localStorage.setItem("password", authForm.password);
          localStorage.setItem("userRole", authForm.role);
          

          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setAuthForm((prev) => ({
            ...prev,
            fullName: authForm.fullName || prev.fullName,
            role: authForm.role,
          }));
          setCurrentRole(authForm.role);
          setCurrentUserId(userId);
          setSuccessMessage('Création compte réussie.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');
          return;

      }

      if (authMode === 'login' && authForm.role === 'merchant') {

          const { data: existingUser , error: selectError} = await supabase
          .from(MERCHANT_TABLE)
          .select("id, full_name,email, phone, role")
          .eq("email", authForm.email.trim())
          .eq("phone", authForm.phone.trim())
          .maybeSingle();

          if (selectError) {
            throw selectError;
          }

          const { profile: currentRoleProfile, table: currentRoleTable } = await findProfileByEmailAndRole(email, authForm.role);

          // Set Current User
          if(currentRoleProfile){
            setCurrentUser({
              id: currentRoleProfile.id,
              fullName: currentRoleProfile.full_name,
              email: currentRoleProfile.email,
              phone: currentRoleProfile.phone,
              password: '',
              role: currentRoleProfile.role,
            });
          }
          
          localStorage.setItem("currentUserEmail", authForm.email);
          localStorage.setItem("password", authForm.password);
          localStorage.setItem("userRole", authForm.role);

          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setAuthForm((prev) => ({
            ...prev,
            fullName: authForm.fullName || prev.fullName,
            role: authForm.role,
          }));
          setCurrentRole(authForm.role);
          if (currentRoleProfile?.id) setCurrentUserId(currentRoleProfile.id);
          setSuccessMessage('Connexion réussie.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');

      }
      
      if(authMode === 'login' && authForm.role === 'customer'){

        const { data: user , error: selectError} = await supabase
          .from(CUSTOMER_TABLES)
          .select("id, full_name,email, phone, role")
          .eq("email", authForm.email.trim())
          .eq("phone", authForm.phone.trim())
          .maybeSingle();

          if (selectError) {
            throw selectError;
          }

          
        const { profile: existingUser, table: existingTable, role: existingRole } = await findProfileByEmail(email);
        const { profile: currentRoleProfile, table: currentRoleTable } = await findProfileByEmailAndRole(email, authForm.role);

          // Set Current User
          if(currentRoleProfile){
            setCurrentUser({
              id: currentRoleProfile.id,
              fullName: currentRoleProfile.full_name,
              email: currentRoleProfile.email,
              phone: currentRoleProfile.phone,
              password: '',
              role: currentRoleProfile.role,
            });            
          }

          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setAuthForm((prev) => ({
            ...prev,
            fullName: authForm.fullName || prev.fullName,
            role: authForm.role,
          }));
          setCurrentRole(authForm.role);
          //setCurrentUserId(user.id);
          if (currentRoleProfile?.id) setCurrentUserId(currentRoleProfile.id);
          setSuccessMessage('Connexion réussie.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');

      }

      localStorage.setItem("currentUserEmail", authForm.email);
      localStorage.setItem("password", authForm.password);
      localStorage.setItem("userRole", authForm.role);

    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      <div className="bg-white rounded-3xl shadow-2xl border p-6 sm:p-8">

        {/*
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setAuthMode('login')} className={`px-6 py-3 rounded-2xl ${authMode === 'login' ? 'bg-green-600 text-white' : 'border'}`}>
            Connexion
          </button>
          <button onClick={() => setAuthMode('register')} className={`px-6 py-3 rounded-2xl ${authMode === 'register' ? 'bg-black text-white' : 'border'}`}>
            Inscription
          </button>
        </div>
        */}

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
          {authMode === 'login' ? 'Connexion à votre compte' : 'Créer votre compte'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
          {authMode === 'register' && (
            <input type="text" name="fullName" placeholder="Nom complet" value={authForm.fullName} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          )}

          <input type="email" name="email" placeholder="Email" value={authForm.email} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />

          {authMode === 'register' && (
            <input type="tel" name="phone" placeholder="Téléphone" value={authForm.phone} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          )}

          <input type="password" name="password" placeholder="Mot de passe" value={authForm.password} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />

          <select name="role" value={authForm.role} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="customer">Utilisateur</option>
              <option value="merchant">Commerçant</option>
          </select>

          {/* Le select de rôle est maintenant toujours visible, mais la valeur par défaut est "customer". Si l'utilisateur choisit "merchant", il sera redirigé vers la configuration de la boutique après l'inscription. 
          {authMode === 'register' && (
            <select name="role" value={authForm.role} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3">
              <option value="customer">Utilisateur</option>
              <option value="merchant">Commerçant</option>
            </select>
          )}
          */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold text-sm sm:text-base hover:bg-green-700 transition">
              {authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
            <button type="button" onClick={() => { setShowAuth(false); setAuthMode(null); }} className="w-full border py-3 rounded-2xl font-bold text-sm sm:text-base hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function MerchantSetupSection({ setSuccessMessage, setErrorMessage, setShowMerchantSetup, currentUserId }) {
  const navigate = useNavigate();
  const [shopForm, setShopForm] = useState({
    business_name: '',
    category: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    description: '',
  });

  const handleShopChange = (e) => {
    setShopForm({ ...shopForm, [e.target.name]: e.target.value });
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prefer the `currentUserId` passed from parent; fallback to auth session if missing
      let userId = currentUserId;
      if (!userId) {
        const { data } = await supabase.auth.getSession();
        userId = data?.session?.user?.id;
      }

      if (!userId) throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');

      // Verify merchant profile exists
      console.log('=== SHOP CREATION DEBUG ===');
      console.log('Checking merchant profile for ID:', userId);
      console.log('Prop currentUserId:', currentUserId);
      
      const { data: merchantProfile, error: profileError } = await supabase.from('users_merchant').select('*').eq('id', userId).maybeSingle();
      
      console.log('Query result - Data:', merchantProfile);
      console.log('Query result - Error:', profileError);
      
      if (profileError) {
        console.error('Error checking profile:', profileError);
        throw new Error('Erreur lors de la vérification du profil: ' + profileError.message);
      }
      
      if (!merchantProfile) {
        console.error('No merchant profile found for ID:', userId);
        console.error('This could be a RLS policy issue. Check Supabase > users_merchant table RLS policies.');
        throw new Error('Aucun profil commerçant trouvé. Assurez-vous d\'avoir créé un compte commerçant et d\'être connecté.');
      }
      
      console.log('Merchant profile found:', merchantProfile.id, merchantProfile.email);

      const { error } = await supabase.from('businesses').insert([{
          owner_id: userId,
          business_name: shopForm.business_name,
          category: shopForm.category,
          address: shopForm.address,
          city: shopForm.city,
          phone: shopForm.phone,
          whatsapp: shopForm.whatsapp,
          description: shopForm.description,
          country: 'Guinée',
        },
      ]);

      if (error) throw error;

      setSuccessMessage('Boutique créée avec succès !');

      setShopForm({
        business_name: '',
        category: '',
        address: '',
        city: '',
        phone: '',
        whatsapp: '',
        description: '',
      });

      setShowMerchantSetup(false);
      navigate('/merchant');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const CloseCreateBoutique = () => {
    setShopForm({
      business_name: '',
      category: '',
      address: '',
      city: '',
      phone: '',
      whatsapp: '',
      description: '',
    });
    setShowMerchantSetup(false);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-3xl shadow-2xl border p-6 sm:p-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 text-green-700">Créer ma boutique</h2>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
          Félicitations, votre compte commerçant est créé. Configurez maintenant votre boutique.
        </p>
        <form onSubmit={handleShopSubmit} className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <input name="business_name" value={shopForm.business_name} onChange={handleShopChange} type="text" placeholder="Nom de la boutique" className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          <select name="category" value={shopForm.category} onChange={handleShopChange} className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Catégorie</option>
            <option value="Commerce">Commerce</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Loisirs">Loisirs</option>
            <option value="Hôpital">Hôpital</option>
            <option value="Services">Services</option>
          </select>
          <input name="address" value={shopForm.address} onChange={handleShopChange} type="text" placeholder="Adresse" className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <input name="city" value={shopForm.city} onChange={handleShopChange} type="text" placeholder="Ville" className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input name="phone" value={shopForm.phone} onChange={handleShopChange} type="tel" placeholder="Téléphone" className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <input name="whatsapp" value={shopForm.whatsapp} onChange={handleShopChange} type="tel" placeholder="WhatsApp" className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          <textarea name="description" value={shopForm.description} onChange={handleShopChange} placeholder="Description de votre activité" className="w-full border rounded-2xl px-4 py-3 min-h-[120px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold text-sm sm:text-base hover:bg-green-700 transition">
              Enregistrer ma boutique
            </button>
            <button type="button" onClick={CloseCreateBoutique} className="w-full border py-3 rounded-2xl font-bold text-sm sm:text-base hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Hero({ onCreateBoutique, results, featuredShops }) {
  return (
    
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8 sm:space-y-12">

      

      {/* Grille responsive */}
      <div className="rounded-3xl border hero">
        {/* Texte 
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 sm:mb-6">
            <span className="text-green-700">Guinée Connect</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
            Une super app nationale permettant <br />
            &nbsp;&nbsp;&nbsp;&nbsp;- aux commerçants, restaurants, services, hôpitaux et loisirs de créer leur présence digitale, <br />
            &nbsp;&nbsp;&nbsp;&nbsp;- aux utilisateurs de trouver en toute facilité ce qui leur convient.
          </p>
          
        </div>

        {/* Image 
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border">
          <div className="aspect-video rounded-2xl bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 flex flex-col items-center justify-center text-white">
            
            <img
              src="https://png.pngtree.com/png-clipart/20230802/original/pngtree-guinea-round-button-clip-art-black-shiny-vector-picture-image_9332151.png"
              alt="Guinée Connect"
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full shadow-md"
            />
            
          </div>
        </div>
          */}
        {/* Slogan */}
        <div>

          <h2 className="text-3xl sm:text-4xl lg:text-3xl font-extrabold leading-tight mb-4 sm:mb-6 text-black-500 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 bg-clip-text text-transparent">
              Trouvez. <br/>
              Découvrez. <br/>
          </h2> 

          <p className="text-lg sm:text-xl text-white mb-6 sm:mb-8">
            Toute la Guinée connectée à vous.
            Trouvez facilement les commerces,
            les lieux de loisirs et les hôpitaux.
          </p>

          {/* Barre de recherche 
          <div class="search">

            <input placeholder="Que recherchez-vous ?"/>

            <button>
            Rechercher
            </button>

          </div>    
          */}     

        </div>        
          
      </div>

      <div class="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border phone">


            <div class="screen">


                <h2>
                Guinée Connect
                </h2>


                <div class="map">

                <div class="pin">📍</div>

                </div>


                <h3>
                  Autour de vous
                </h3>


                <p>
                📍 Conakry, Guinée
                </p>


              </div>


        </div>

      {featuredShops?.length > 0 && (
        <div className="mb-10">

            <div>
              <h2>
                Nos services
              </h2>

              <div class="cards">

                <div class="card green">

                  <h3>
                  🛒 Commerces
                  </h3>

                  <p>
                  Découvrez les boutiques
                  et services proches de vous.
                  </p>
                </div>

                <div class="card orange">
                  <h3>
                  ⚽ Loisirs
                  </h3>

                  <p>
                  Restaurants, activités,
                  sorties et découvertes.
                  </p>
                </div>

                <div class="card blue">

                  <h3>🏥 Hôpitaux</h3>
                  <p>
                    Trouvez rapidement
                    les centres de santé.
                  </p>
                </div>
              </div>
              </div>
            <div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Boutiques / Services / Lieux en ligne</h3>
              <p className="text-sm text-gray-500">Faites défiler pour découvrir la première photo de chacune.</p>
            </div>
          </div>

          <div className="overflow-x-auto pb-3">
            <div className="flex gap-4 min-w-max">
              {featuredShops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.id}`}
                  className="min-w-[220px] max-w-[220px] bg-white border rounded-3xl shadow-sm overflow-hidden flex-shrink-0 cursor-pointer transition hover:-translate-y-0.5"
                >
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    {shop.first_photo_url ? (
                      <img src={shop.first_photo_url} alt={shop.business_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-sm text-gray-500">
                        Aucune photo
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-sm text-gray-900 mb-1 truncate">{shop.business_name}</div>
                    <div className="text-xs text-gray-500 truncate">{shop.category || 'Categorie'}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{shop.city || shop.address}</div>
                    <div className="text-xs text-gray-500 mt-2 truncate">{shop.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Résultats - fullwidth 
      <div className="relative">
        {results.length > 0 ? (
          <ul className="w-full bg-white border rounded-lg shadow-lg overflow-hidden">
            {results.map((r) => (
              <li key={r.id} className="p-4 sm:p-5 hover:bg-gray-50 border-b transition text-sm sm:text-base">
                <div className="font-semibold text-base sm:text-lg">{r.business_name}</div>
                <div className="text-xs sm:text-sm font-normal text-gray-500">Catégorie: {r.category}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{r.city} — {r.address}</div>
                <div className="text-xs sm:text-sm text-gray-700 mt-2">{r.description}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2">Tel: {r.phone}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg text-center">Aucun résultat</div>
        )}
      </div>
      */}

    </section>
  );
}

function DeconnexionButton({ setIsConnected, setCurrentRole, setCurrentUserId, setAccessMessage, setSuccessMessage, setErrorMessage }) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsConnected(false);
      setCurrentRole(null);
      setCurrentUserId(null);
      setAccessMessage('Vous êtes déconnecté.');
      setSuccessMessage('');
      setErrorMessage('');
      navigate('/');

      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("password");
      localStorage.removeItem("userRole");

    } catch (error) {
      console.error('Logout error:', error);
      setErrorMessage('Erreur lors de la déconnexion: ' + error.message);
    } 
  };

  return (
    <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
      Déconnexion
    </button>
  );
}
export default function GuineeMarketplaceApp() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  useEffect(() => {
    track('route_change', {
      path: location.pathname,
    });
  }, [location.pathname]);

  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMerchantSetup, setShowMerchantSetup] = useState(false);
  const [authForm, setAuthForm] = useState({fullName: '', email: '', phone: '', password: '', role: 'customer'});

  // Connexion variable d'environnement Supabase
  const [isConnected, setIsConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState(null); // 'customer' | 'merchant' | null
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const clearAccessMessage = () => setAccessMessage('');
  const clearSuccessMessage = () => setSuccessMessage('');
  const clearErrorMessage = () => setErrorMessage('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [results, setResults] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);

  const [currentUser, setCurrentUser] = useState({
    id: 0,
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });

  const lastScrollYRef = useRef(0);
  const toggleHeader = () => setShowHeader((prev) => !prev);
  const isClientOrMerchantPage = currentRole === 'merchant' || currentRole === 'customer';
  const shouldShowHeader = isClientOrMerchantPage ? showHeader : isHomePage ? showHeader : true;
  const showHomeRestoreButton = !showHeader && isHomePage && !isClientOrMerchantPage;

  useEffect(() => {
    if (currentRole === 'merchant' || currentRole === 'customer') {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  }, [currentRole]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isHomePage) return;

      const currentScrollY = window.scrollY;
      const isAtTop = currentScrollY <= 10;
      const threshold = 25;
      const hasScrolledDown = currentScrollY > lastScrollYRef.current + threshold;
      const hasScrolledUp = currentScrollY < lastScrollYRef.current - threshold;

      if (isAtTop && !showHeader) {
        setShowHeader(true);
      } else if (hasScrolledDown && showHeader && currentScrollY > 40) {
        setShowHeader(false);
      } else if (hasScrolledUp && !showHeader) {
        setShowHeader(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, showHeader]);

  useEffect(() => {
    if (accessMessage) {
      const timer = setTimeout(clearAccessMessage, 5000);
      return () => clearTimeout(timer);
    }
  }, [accessMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccessMessage, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(clearErrorMessage, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  

  useEffect(() => {
    const fetchResults = async () => {
      // if no query and no filters, clear
      {/*
      if (!query && !categoryFilter && !cityFilter) {
        setResults([]);
        return;
      }
      */}
    
      //setLoading(true);

      try {
        let sb = supabase
          .from('businesses')
          .select('id, business_name, category, city, address, phone, description')
          .order('business_name', { ascending: true })
          .limit(50);

        if (query) {
          const q = query.replace(/%/g, '\\%');
          const orStr = `business_name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,address.ilike.%${q}%`;
          sb = sb.or(orStr);
        }

        if (categoryFilter) sb = sb.eq('category', categoryFilter);
        if (cityFilter) sb = sb.eq('city', cityFilter);

        const { data, error } = await sb;

        if (error) {
          console.error('Search error:', error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (e) {
        console.error(e);
        setResults([]);
      }

      //setLoading(false);
    };

    const t = setTimeout(fetchResults, 250);
    return () => clearTimeout(t);
  }, [query, categoryFilter, cityFilter]);

  useEffect(() => {
    const loadFeaturedShops = async () => {
      try {
        const { data: shops, error: shopError } = await supabase
          .from('businesses')
          .select('id, business_name, category, city, address, description')
          .order('created_at', { ascending: false })
          .limit(12);

        if (shopError) {
          console.error('Error loading featured shops', shopError);
          return;
        }

        const shopIds = (shops || []).map((shop) => shop.id);
        if (!shopIds.length) {
          setFeaturedShops([]);
          return;
        }

        const { data: photos, error: photoError } = await supabase
          .from('business_photos')
          .select('business_id, photo_url')
          .in('business_id', shopIds)
          .order('id', { ascending: true })
          .limit(50);

        if (photoError) {
          console.error('Error loading shop photos', photoError);
        }

        const firstPhotos = (photos || []).reduce((acc, photo) => {
          if (!acc[photo.business_id]) acc[photo.business_id] = photo.photo_url;
          return acc;
        }, {});

        setFeaturedShops((shops || []).map((shop) => ({
          ...shop,
          first_photo_url: firstPhotos[shop.id] || null,
        })));
      } catch (loadError) {
        console.error('Unable to load featured shops', loadError);
      }
    };

    loadFeaturedShops();
  }, []);

  function ProtectedRoute({ allowedRole, children }) {
    if (isLoadingSession) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-screen">
          <div className="text-center text-gray-700">Vérification de la session en cours...</div>
        </div>
      );
    }

    if (!isConnected) {
      setAccessMessage('Veuillez vous connecter pour accéder à cette page.');
      return <Navigate to="/" replace />;
    }
    if (currentRole !== allowedRole) {
      const roleLabel = allowedRole === 'merchant' ? 'commerçants' : 'utilisateurs';
      setAccessMessage(`Accès réservé aux ${roleLabel}.`);
      return <Navigate to="/" replace />;
    }
    return children;
  }

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.info("Restoration session ...");

        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        const savedUser = localStorage.getItem("currentUserEmail");
        const savedRole = localStorage.getItem("userRole");

        const { profile: CurrentUser} = await findProfileByEmailAndRole(savedUser, savedRole);


        console.log('Restoring session:', CurrentUser?.id, 'role:', savedRole);

        if (!CurrentUser) {
          console.log('No profile found for session user');
          setIsLoadingSession(false);
          return;
        }

        setIsConnected(true);
        setAuthForm((prev) => ({
          ...prev,
          email: CurrentUser.email || prev.email,
          fullName: CurrentUser.full_name || prev.fullName,
          role: savedRole || prev.role,
        }));
        setCurrentUserId(CurrentUser.id);

        if (savedRole) {
          setCurrentRole(savedRole);
        } else {
          try {
            const { profile, role } = await findProfileById(CurrentUser.id);
            console.log('Profile found:', profile?.id, 'role:', role);
            if (role || profile?.role) {
              setCurrentRole(role || profile.role);
              setAuthForm((prev) => ({ ...prev, fullName: profile?.full_name || prev.fullName, role: role || profile.role }));
            } else {
              console.warn('No profile role found');
            }
          } catch (e) {
            console.error('Error loading profile on restore', e);
          }
        }

        setShowAuth(false);
      } catch (e) {
        console.error('Session restoration failed', e);
      } finally {
        setIsLoadingSession(false);
      }
    };

    restoreSession();

  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-yellow-50 text-gray-900">
        {shouldShowHeader && (
          <Header
            query={query}
            setQuery={setQuery}
            search={search}
            setSearch={setSearch}
            setAuthMode={setAuthMode}
            setShowAuth={setShowAuth}
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            authForm={authForm}
            setCurrentRole={setCurrentRole}
            setCurrentUserId={setCurrentUserId}
            setShowMerchantSetup={setShowMerchantSetup}
            setResults={setResults}
            setCurrentUser={setCurrentUser}
            onToggleHeader={toggleHeader}
          />
        )}

        {showHomeRestoreButton && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={toggleHeader}
              className="rounded-full border bg-white p-2 shadow-lg hover:ring-2 hover:ring-green-500 transition"
              aria-label="Afficher le header"
            >
              <img
                src="https://media.licdn.com/dms/image/v2/C4E0BAQHMGG0XccZzgA/company-logo_200_200/company-logo_200_200/0/1671889785007?e=2147483647&v=beta&t=yJgczdSFOGYxyyB3zHq5xMdDI5Jo8lMWCjyHKlU8PDE"
                alt="Logo Guinée Connect"
                className="w-10 h-10 object-contain rounded-full"
              />
            </button>
          </div>
        )}

        {!showHeader && isClientOrMerchantPage && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={toggleHeader}
              className="rounded-full border bg-white p-2 shadow-lg hover:ring-2 hover:ring-green-500 transition"
              aria-label="Afficher le header"
            >
              <img
                src="https://media.licdn.com/dms/image/v2/C4E0BAQHMGG0XccZzgA/company-logo_200_200/company-logo_200_200/0/1671889785007?e=2147483647&v=beta&t=yJgczdSFOGYxyyB3zHq5xMdDI5Jo8lMWCjyHKlU8PDE"
                alt="Logo Guinée Connect"
                className="w-10 h-10 object-contain rounded-full"
              />
            </button>
          </div>
        )}

        {showAuth && (
          <AuthSection
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            setShowAuth={setShowAuth}
            setShowMerchantSetup={setShowMerchantSetup}
            setIsConnected={setIsConnected}
            setCurrentRole={setCurrentRole}
            setCurrentUserId={setCurrentUserId}
            setAccessMessage={setAccessMessage}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
            setCurrentUser={setCurrentUser}
          />
        )}

        {successMessage && (
          <div className="max-w-7xl mx-auto px-6 mt-4">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>{successMessage}</div>
                <button onClick={clearSuccessMessage} className="text-sm text-green-800 underline">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {accessMessage && (
          <div className="max-w-7xl mx-auto px-6 mt-4">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>{accessMessage}</div>
                <button onClick={clearAccessMessage} className="text-sm text-yellow-800 underline">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="max-w-7xl mx-auto px-6 mt-4">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>{errorMessage}</div>
                <button onClick={clearErrorMessage} className="text-sm text-red-800 underline">Fermer</button>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/client"
            element={<ProtectedRoute allowedRole="customer"><ClientPage setAccessMessage={setAccessMessage} setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} /></ProtectedRoute>}
          />
          <Route
            path="/merchant"
            element={<ProtectedRoute allowedRole="merchant">{showMerchantSetup ? <MerchantSetupSection setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} setShowMerchantSetup={setShowMerchantSetup} currentUserId={currentUserId} /> : <MerchantPage onCreateBoutique={() => setShowMerchantSetup(true)} currentUserId={currentUserId} setAccessMessage={setAccessMessage} setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} />}</ProtectedRoute>}
          />
          <Route
            path="/shop/:shopId"
            element={<ShopPage setAccessMessage={setAccessMessage} setErrorMessage={setErrorMessage} />}
          />
          <Route
            path="/"
            element={
              isLoadingSession ? (
                <div className="max-w-7xl mx-auto px-6 py-16 flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-4">Chargement...</div>
                  </div>
                </div>
              ) : showMerchantSetup ? (
                <MerchantSetupSection setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} setShowMerchantSetup={setShowMerchantSetup} currentUserId={currentUserId} />
              ) : isConnected ? (
                currentRole === 'merchant' ? (
                  <MerchantPage onCreateBoutique={() => setShowMerchantSetup(true)} currentUserId={currentUserId} setAccessMessage={setAccessMessage} setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} />
                ) : (
                  <ClientPage setAccessMessage={setAccessMessage} setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} />
                ) 
              ) : (
                <Hero onCreateBoutique={() => setShowMerchantSetup(true)} results={results} featuredShops={featuredShops} query={query} />
              )
            }
          />
        </Routes>
        <Analytics />

        
        {/*
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl border p-8 shadow-sm">
            <h3 className="text-3xl font-bold mb-4">Progression projet</h3>
            <div className="space-y-2 text-lg">
              <p>✅ Base de données Supabase</p>
              <p>✅ Auth UI modulaire</p>
              <p>✅ Supabase Auth réel</p>
              <p>✅ Création boutique commerçant</p>
              <p>🔜 Dashboard CRUD produits/services</p>
              <p>✅ Businesses connectées à Supabase</p>
            </div>
          </div>
        </section>
        */}

      {/* Contact Section 
      <section className="bg-green-200 text-white py-16 px-4 sm:px-8 mt-16">       
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          
                   
          <div>
            <h2 className="text-3xl font-bold mb-4 text-black">Contact & Prise de contact</h2>
            <p className="mb-6 text-black">
              Une question sur les publications, les inscriptions ou autre ?
              Envoyez-nous directement votre message.
            </p>

            <form
              action="mailto:aobah34@gmail.com"
              method="POST"
              encType="text/plain"
              className="space-y-4"
            >
              <input
                type="text"
                name="Nom"
                placeholder="Votre nom"
                className="bg-gray-300 w-full p-3 rounded-lg text-black"
                required
              />

              <input
                type="email"
                name="Email"
                placeholder="Votre email"
                className="bg-gray-300 w-full p-3 rounded-lg text-black"
                required
              />

              <textarea
                name="Message"
                placeholder="Votre message"
                rows={5}
                className="bg-gray-300 w-full p-3 rounded-lg text-black"
                required
              />

              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg w-full"
              >
                Envoyer le message
              </button>
            </form>
          </div>
          

          <div className="flex flex-col justify-center">
            <h3 className="text-2xl font-semibold mb-4 text-black">Réjoignez nous sur</h3>
            <div className="flex gap-5 flex-wrap items-center text-lg">
              
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-10 h-10 hover:scale-110 transition" />
              </a>
              
              <a href="https://t.me" target="_blank" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" className="w-10 h-10 hover:scale-110 transition" />
              </a>
              <a href="https://wa.me/0000000000" target="_blank" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" className="w-10 h-10 hover:scale-110 transition" />
              </a>
              
            </div>            
          </div>
        </div>
      </section>
      */}


      </div>

      <footer className="bg-green-700 text-white py-6 mt-12">        
          <div className="max-w-7xl mx-auto px-6 text-center">            
            &copy; {new Date().getFullYear()} Guinée Connect. Tous droits réservés.
          </div>
      </footer>
    </>
  );
}
