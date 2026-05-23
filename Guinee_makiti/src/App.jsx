import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';


import supabase from './lib/supabaseClient';
import ClientPage from './pages/ClientPage';
import MerchantPage from './pages/MerchantPage';

class FormData {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  role = 'customer';
};

// Table mapping and helpers
const MERCHANT_TABLE = 'users_merchant';
const CUSTOMER_TABLES = ['users_customers'];

async function findProfileByEmail(email) {
  // try merchant first
  try {
    const { data: m } = await supabase.from(MERCHANT_TABLE).select('*').eq('email', email).maybeSingle();
    if (m) return { profile: m, table: MERCHANT_TABLE, role: 'merchant' };
  } catch (e) {
    // ignore
  }

  for (const t of CUSTOMER_TABLES) {
    try {
      const { data } = await supabase.from(t).select('*').eq('email', email).maybeSingle();
      if (data) return { profile: data, table: t, role: 'customer' };
    } catch (e) {
      // ignore and try next
    }
  }

  return { profile: null, table: null, role: null };
}

function getProfileTable(role) {
  return role === 'merchant' ? MERCHANT_TABLE : CUSTOMER_TABLES[0];
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

  for (const t of CUSTOMER_TABLES) {
    try {
      const { data } = await supabase.from(t).select('*').eq('id', id).maybeSingle();
      if (data) return { profile: data, table: t, role: 'customer' };
    } catch (e) {}
  }

  return { profile: null, table: null, role: null };
}

function Header({ search, setSearch, setAuthMode, setShowAuth, isConnected, setIsConnected, authForm, setCurrentRole, setCurrentUserId }) {

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b shadow-sm">
      
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="grid grid-cols-[25%_75%] items-center gap-[3%]">
            <img
              src="https://media.licdn.com/dms/image/v2/C4E0BAQHMGG0XccZzgA/company-logo_200_200/company-logo_200_200/0/1671889785007?e=2147483647&v=beta&t=yJgczdSFOGYxyyB3zHq5xMdDI5Jo8lMWCjyHKlU8PDE"
              alt="Guinée Connect Logo"
              className="w-14 h-14 object-contain rounded-full shadow-md "
            /> 
            <div>
              <h1 className="text-2xl text-green-700 font-extrabold rounded-xl p">Guinée Connect</h1>
              <p className="text-sm text-gray-600">Marketplace + découverte locale</p>
            </div>
        </span>
      
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher produits, services, lieux..."
            className="flex-1 md:w-96 px-4 py-2 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="bg-green-600 text-white px-5 py-2 rounded-2xl">Rechercher</button>
        </div>

        {/* Affichage conditionnel du message de bienvenue ou d'invitation à se connecter */}
        {/*
        <div className="hidden md:flex gap-4">
          {isConnected ? (
            <div>
              <span>Bienvenue {authForm.fullName}</span>
            </div>
          ) : (
            <div>
              <span>Connectez-vous pour accéder à votre compte</span>
            </div>
          )}
        </div>  
        */}

        <div className="flex items-center justify-center gap-2">
          {isConnected ? (
            <>
              <div className="font-semibold">Bienvenue {authForm.fullName}</div>
              <button onClick={async () => { await supabase.auth.signOut(); setIsConnected(false); setCurrentRole(null); setCurrentUserId(null); }} className="bg-red-600 text-white px-4 py-2 rounded-2xl">Déconnexion</button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="border px-4 py-2 rounded-2xl">Connexion</button>
              <button onClick={() => { setAuthMode('register'); setShowAuth(true); }} className="bg-black text-white px-4 py-2 rounded-2xl">Inscription</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function AuthSection({ authMode, setAuthMode, authForm, setAuthForm, setShowAuth, setShowMerchantSetup, setIsConnected, setCurrentRole, setCurrentUserId, setAccessMessage, setSuccessMessage, setErrorMessage }) {
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

      if (authMode === 'register') {
        

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant.');
        }

        const { profile: existingUser, table: existingTable, role: existingRole } = await findProfileByEmail(email);
        const { profile: currentRoleProfile, table: currentRoleTable } = await findProfileByEmailAndRole(email, authForm.role);

        if (currentRoleProfile) {
          const { error: updateError } = await supabase.from(currentRoleTable).update({
            full_name: authForm.fullName,
            phone: authForm.phone,
          }).eq('email', email);

          if (updateError) {
            throw updateError;
          }

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw signInError;
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
          if (currentRoleProfile?.id) setCurrentUserId(currentRoleProfile.id);
          setSuccessMessage('Connexion réussie. Vos informations ont été mises à jour.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');
          return;
        }

        if (existingUser) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw signInError;
          }

          const roleTable = getProfileTable(authForm.role);
          const { error: insertError } = await supabase.from(roleTable).insert([
            {
              id: existingUser.id,
              full_name: authForm.fullName,
              email,
              phone: authForm.phone,
              role: authForm.role,
            },
          ]);

          if (insertError) {
            throw insertError;
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
          setCurrentUserId(existingUser.id);
          setSuccessMessage('Profil créé pour le rôle sélectionné et connexion réussie.');
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            //emailRedirectTo: window.location.origin,
            data: {
              full_name: authForm.fullName,
              phone: authForm.phone,
              role: authForm.role,
            },
          },
        });

        console.log('Signup result:', data, error);

        if (error) throw error;

        if (!data.user?.id) {
          throw new Error('Compte Auth non créé correctement. Vérifiez Supabase Authentication > Users.');
        }

        const profileTable = authForm.role === 'merchant' ? MERCHANT_TABLE : CUSTOMER_TABLES[0];
        const { error: profileError } = await supabase.from(profileTable).upsert([
          {
            id: data.user.id,
            full_name: authForm.fullName,
            email,
            phone: authForm.phone,
            role: authForm.role,
          },
        ]);

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Auto login after signup:', signInData, signInError);

        if (profileError) {
          console.error('Users table error:', profileError);
        }

        if (authForm.role === 'merchant') {
          setShowAuth(false);
          setAuthMode(null);
          setShowMerchantSetup(true);
        }

        if (signInError) {
          setSuccessMessage('Compte créé. Vérifiez votre email puis connectez-vous après confirmation.');
        } else {
          setSuccessMessage('Compte créé et connexion réussie.');
          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setCurrentRole(authForm.role);
          setCurrentUserId(data.user.id);
          navigate(authForm.role === 'merchant' ? '/merchant' : '/client');
        }
        
        return;
      }

      if (authMode === 'login') {

        if (!email || !password) {
          setErrorMessage('Email ou mot de passe manquant. Vérifiez les champs du formulaire.');
          throw new Error('Email ou mot de passe manquant. Vérifiez les champs du formulaire.');
        }

        {/*
        console.log("FINAL LOGIN VALUES:", {
          rawEmail: authForm.email,
          rawPassword: authForm.password,
          email,
          passwordLength: password?.length,
        });
        */}

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Login result:', data, error);

        if (error) {
          setErrorMessage('Erreur de connexion : ' + error.message + ' ' + data?.user?.email);

          const errorMessage = error.message.toLowerCase();

          if (errorMessage.includes('invalid login credentials')) {
            throw new Error(
              "Identifiants invalides. Vérifiez : 1) email exact utilisé à l'inscription, 2) mot de passe exact, 3) email confirmé dans Supabase Authentication > Users."
            );
          }

          if (errorMessage.includes('email not confirmed')) {
            throw new Error(
              "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail puis cliquez sur le lien de confirmation."
            );
          }

          throw error;
        }

        // Vérifier l'existence de l'utilisateur dans la table users selon l'email ET le rôle choisi
        const { profile: userRecord, table: userTable, role: userRole } = await findProfileByEmailAndRole(email, authForm.role);

        if (!userRecord) {
          await supabase.auth.signOut();
          const msg = `Aucun profil ${authForm.role === 'merchant' ? 'Commerçant' : 'Utilisateur'} trouvé pour cet email. Créez un compte ou vérifiez que vous avez sélectionné le bon rôle.`;
          if (typeof setAccessMessage === 'function') setAccessMessage(msg);
          navigate('/');
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (!data.session && !sessionData.session) {
          throw new Error('Connexion échouée : session nulle. Vérifiez Supabase Authentication > Users.');
        }

        setShowAuth(false);
        setAuthMode(null);
        setAuthForm((prev) => ({
          ...prev,
          fullName: userRecord.full_name || prev.fullName,
          role: userRole || prev.role,
        }));
        // set current role and user id
        setCurrentRole(userRole);
        setCurrentUserId(userRecord.id);
        setSuccessMessage('Connexion réussie');
        setIsConnected(true);
        navigate(userRole === 'merchant' ? '/merchant' : '/client');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      
      <div className="bg-white rounded-3xl shadow-2xl border p-8">

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

        <h2 className="text-3xl font-bold text-center mb-6">
          {authMode === 'login' ? 'Connexion à votre compte' : 'Créer votre compte'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
          {authMode === 'register' && (
            <input type="text" name="fullName" placeholder="Nom complet" value={authForm.fullName} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3" />
          )}

          <input type="email" name="email" placeholder="Email" value={authForm.email} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3" />

          {authMode === 'register' && (
            <input type="tel" name="phone" placeholder="Téléphone" value={authForm.phone} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3" />
          )}

          <input type="password" name="password" placeholder="Mot de passe" value={authForm.password} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3" />

          <select name="role" value={authForm.role} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold">
              {authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
            <button type="button" onClick={() => { setShowAuth(false); setAuthMode(null); }} className="w-full border py-3 rounded-2xl font-bold">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function MerchantSetupSection({ setSuccessMessage, setErrorMessage, setShowMerchantSetup }) {
  const navigate = useNavigate();
  const [shopForm, setShopForm] = useState({
    business_name: '',
    category: '',
    address: '',
    city: '',
    phone: '',
    description: '',
  });

  const handleShopChange = (e) => {
    setShopForm({ ...shopForm, [e.target.name]: e.target.value });
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase.from('businesses').insert([
        {
          owner_id: user.id,
          business_name: shopForm.business_name,
          category: shopForm.category,
          address: shopForm.address,
          city: shopForm.city,
          phone: shopForm.phone,
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
      description: '',
    });
    setShowMerchantSetup(false);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-white rounded-3xl shadow-2xl border p-8">
        <h2 className="text-4xl font-bold text-center mb-6 text-green-700">Créer ma boutique</h2>
        <p className="text-center text-gray-600 mb-8">
          Félicitations, votre compte commerçant est créé. Configurez maintenant votre boutique.
        </p>
        <form onSubmit={handleShopSubmit} className="space-y-4 max-w-2xl mx-auto">
          <input name="business_name" value={shopForm.business_name} onChange={handleShopChange} type="text" placeholder="Nom de la boutique" className="w-full border rounded-2xl px-4 py-3" />
          <select name="category" value={shopForm.category} onChange={handleShopChange} className="w-full border rounded-2xl px-4 py-3">
            <option value="">Catégorie</option>
            <option value="Commerce">Commerce</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Loisirs">Loisirs</option>
            <option value="Hôpital">Hôpital</option>
            <option value="Services">Services</option>
          </select>
          <input name="address" value={shopForm.address} onChange={handleShopChange} type="text" placeholder="Adresse" className="w-full border rounded-2xl px-4 py-3" />
          <input name="city" value={shopForm.city} onChange={handleShopChange} type="text" placeholder="Ville" className="w-full border rounded-2xl px-4 py-3" />
          <input name="phone" value={shopForm.phone} onChange={handleShopChange} type="tel" placeholder="WhatsApp / Téléphone" className="w-full border rounded-2xl px-4 py-3" />
          <textarea name="description" value={shopForm.description} onChange={handleShopChange} placeholder="Description de votre activité" className="w-full border rounded-2xl px-4 py-3 min-h-[120px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold text-lg">
              Enregistrer ma boutique
            </button>
            <button type="button" onClick={CloseCreateBoutique} className="w-full border py-3 rounded-2xl font-bold">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Hero({ onCreateBoutique }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="text-5xl font-extrabold leading-tight mb-6">
          Digitalisez toute la <span className="text-green-700">Guinée</span>
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Une super app nationale permettant aux commerçants, restaurants, services, hôpitaux et loisirs de créer leur présence digitale.
        </p>
        <div className="flex flex-wrap gap-4">
          <button onClick={onCreateBoutique} className="bg-green-600 text-white px-6 py-3 rounded-2xl text-lg">Créer ma boutique</button>
          <button className="border border-green-600 text-green-700 px-6 py-3 rounded-2xl text-lg">Télécharger l'app</button>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-2xl p-8 border">
        <div className="aspect-video rounded-2xl bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 flex flex-col items-center justify-center text-white">
          <div className="text-2xl font-bold">Google Maps / OpenStreetMap</div>
          <div className="text-sm mt-2">Recherche géolocalisée en temps réel</div>
        </div>
      </div>
    </section>
  );
}

export default function GuineeMarketplaceApp() {
  
  const [search, setSearch] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMerchantSetup, setShowMerchantSetup] = useState(false);
  const [authForm, setAuthForm] = useState({fullName: '', email: '', phone: '', password: '', role: 'customer'});

  // Connexion variable d'environnement Supabase
  const [isConnected, setIsConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState(null); // 'customer' | 'merchant' | null
  const [currentUserId, setCurrentUserId] = useState(null);
  const [accessMessage, setAccessMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const clearAccessMessage = () => setAccessMessage('');
  const clearSuccessMessage = () => setSuccessMessage('');
  const clearErrorMessage = () => setErrorMessage('');

  // Auto-close messages after 5 seconds
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

  function ProtectedRoute({ allowedRole, children }) {
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
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        setIsConnected(true);
        setAuthForm((prev) => ({
          ...prev,
          email: session.user.email || prev.email,
          fullName: session.user.user_metadata?.full_name || prev.fullName,
        }));
        setCurrentUserId(session.user.id);

        // try load role from merchant/customer profile tables
        try {
          const { profile } = await findProfileById(session.user.id);
          if (profile?.role) {
            setCurrentRole(profile.role);
            setAuthForm((prev) => ({ ...prev, fullName: profile.full_name || prev.fullName, role: profile.role }));
          }
        } catch (e) {
          console.error('Error loading profile on restore', e);
        }
        setShowAuth(false);
      }
    };

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setIsConnected(false);
        setCurrentRole(null);
        setCurrentUserId(null);
      }

      if (session?.user) {
        setIsConnected(true);
        setAuthForm((prev) => ({
          ...prev,
          email: session.user.email || prev.email,
          fullName: session.user.user_metadata?.full_name || prev.fullName,
        }));

        // update role when auth state changes
        (async () => {
          try {
            const { profile } = await findProfileById(session.user.id);
            if (profile?.role) {
              setCurrentRole(profile.role);
              setAuthForm((prev) => ({ ...prev, fullName: profile.full_name || prev.fullName, role: profile.role }));
            }
            setCurrentUserId(session.user.id);
          } catch (e) {
            console.error('Error loading profile on auth change', e);
          }
        })();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-yellow-50 text-gray-900">
        <Header search={search} setSearch={setSearch} setAuthMode={setAuthMode} setShowAuth={setShowAuth} isConnected={isConnected} setIsConnected={setIsConnected} authForm={authForm} setCurrentRole={setCurrentRole} setCurrentUserId={setCurrentUserId} />

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
            element={<ProtectedRoute allowedRole="customer"><ClientPage /></ProtectedRoute>}
          />
          <Route
            path="/merchant"
            element={<ProtectedRoute allowedRole="merchant"><MerchantPage /></ProtectedRoute>}
          />
          <Route
            path="/"
            element={
              showMerchantSetup ? (
                <MerchantSetupSection setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} setShowMerchantSetup={setShowMerchantSetup} />
              ) : isConnected ? (
                currentRole === 'merchant' ? (
                  <MerchantPage />
                ) : currentRole === 'customer' ? (
                  <ClientPage />
                ) : (
                  <Hero onCreateBoutique={() => setShowMerchantSetup(true)} />
                )
              ) : (
                <Hero onCreateBoutique={() => setShowMerchantSetup(true)} />
              )
            }
          />
        </Routes>

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
      </div>
    </Router>
  );
}
