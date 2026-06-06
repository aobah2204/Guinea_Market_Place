import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  HashRouter,
} from 'react-router-dom';



import supabase from './lib/supabaseClient';
import ClientPage from './pages/ClientPage';
import MerchantPage from './pages/MerchantPage';
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

function Header({ query, setQuery, search, setSearch, setAuthMode, setShowAuth, isConnected, setIsConnected, authForm, setCurrentRole, setCurrentUserId, setShowMerchantSetup }) {

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b shadow-sm">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo et titre */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <img
            src="https://media.licdn.com/dms/image/v2/C4E0BAQHMGG0XccZzgA/company-logo_200_200/company-logo_200_200/0/1671889785007?e=2147483647&v=beta&t=yJgczdSFOGYxyyB3zHq5xMdDI5Jo8lMWCjyHKlU8PDE"
            alt="Guinée Connect Logo"
            className="w-10 sm:w-12 h-10 sm:h-12 object-contain rounded-full shadow-md"
          /> 
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
              <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="border px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base w-full sm:w-auto">Connexion</button>
              <button onClick={() => { setAuthMode('register'); setShowAuth(true); }} className="bg-black text-white px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base w-full sm:w-auto">Inscription</button>
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
          if(existingUser){
            setCurrentUser({
              id: existingUser.id,
              fullName: existingUser.full_name,
              email: existingUser.email,
              phone: existingUser.phone,
              password: '',
              role: existingUser.role,
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
          if(user){
            setCurrentUser({
              id: user.id,
              fullName: user.full_name,
              email: user.email,
              phone: user.phone,
              password: '',
              role: user.role,
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

  const handleSubmit_old = async (e) => {
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
          
          console.log('New role profile created for existing user:', authForm.role, 'user:', existingUser.id);

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

        const profileTable = authForm.role === 'merchant' ? MERCHANT_TABLE : CUSTOMER_TABLES;
        console.log('=== PROFILE CREATION ===');
        console.log('Table:', profileTable);
        console.log('User ID:', data.user.id);
        
        const { error: profileError } = await supabase.from(profileTable).upsert([
          {
            id: data.user.id,
            full_name: authForm.fullName,
            email,
            phone: authForm.phone,
            role: authForm.role,
          },
        ]);

        if (profileError) {
          console.error('Profile upsert error:', profileError);
          throw new Error('Erreur lors de la création du profil: ' + profileError.message);
        }

        console.log('Profile upsert succeeded, now verifying...');
        
        // Verify profile was created
        const { data: verifyProfile, error: verifyError } = await supabase.from(profileTable).select('*').eq('id', data.user.id).maybeSingle();
        console.log('Verification result - Data:', verifyProfile);
        console.log('Verification result - Error:', verifyError);
        
        if (!verifyProfile) {
          console.error('Profile not found after creation!', verifyError);
          throw new Error('Le profil n\'a pas pu être créé. Vérifiez la table ' + profileTable + ' dans Supabase.');
        }
        console.log('Profile verified:', verifyProfile.id, verifyProfile.email);

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setSuccessMessage('Compte créé. Vérifiez votre email puis connectez-vous après confirmation.');
        } else {
          setSuccessMessage('Compte créé et connexion réussie.');
          setShowAuth(false);
          setAuthMode(null);
          setIsConnected(true);
          setCurrentRole(authForm.role);
          setCurrentUserId(data.user.id);
          
          if (authForm.role === 'merchant') {
            setShowMerchantSetup(true);
            //navigate('/merchant');
          } else {
            navigate('/client');
          }
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
        console.log('=== LOGIN DEBUG ===');
        console.log('Email:', email);
        console.log('Role:', authForm.role);
        
        const { profile: userRecord, table: userTable, role: userRole } = await findProfileByEmailAndRole(email, authForm.role);

        console.log('Profile found:', userRecord?.id, userRecord?.email);
        console.log('Role found:', userRole);

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
        console.log('=== LOGIN COMPLETE ===');
        console.log('Setting currentRole to:', userRole);
        console.log('Setting currentUserId to:', userRecord.id);
        console.log('Session auth user ID:', data.session?.user?.id);
        
        setCurrentRole(userRole);
        setCurrentUserId(userRecord.id);
        setSuccessMessage('Connexion réussie');
        setIsConnected(true);
        console.log('About to navigate to:', userRole === 'merchant' ? '/merchant' : '/client');
        navigate(userRole === 'merchant' ? '/merchant' : '/client');
      }
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

function Hero({ onCreateBoutique, results }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Grille responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center mb-8">
        {/* Texte */}
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 sm:mb-6">
            Digitalisez toute la <span className="text-green-700">Guinée</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
            Une super app nationale permettant aux commerçants, restaurants, services, hôpitaux et loisirs de créer leur présence digitale.
          </p>
          {/*
          <div className="flex flex-wrap gap-4">
            <button onClick={onCreateBoutique} className="bg-green-600 text-white px-6 py-3 rounded-2xl text-lg">Créer ma boutique</button>
            <button className="border border-green-600 text-green-700 px-6 py-3 rounded-2xl text-lg">Télécharger l'app</button>
          </div>
          */}
        </div>
        
        {/* Image */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border">
          <div className="aspect-video rounded-2xl bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 flex flex-col items-center justify-center text-white">
            <img
              src="https://png.pngtree.com/png-clipart/20230802/original/pngtree-guinea-round-button-clip-art-black-shiny-vector-picture-image_9332151.png"
              alt="Guinée Connect"
              className="w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 object-contain rounded-full shadow-md"
            />           
          </div>
        </div>
      </div>

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
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const clearAccessMessage = () => setAccessMessage('');
  const clearSuccessMessage = () => setSuccessMessage('');
  const clearErrorMessage = () => setErrorMessage('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [results, setResults] = useState([]);

  const [currentUser, setCurrentUser] = useState({
    id: 0,
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
  });

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


      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      const savedUser = localStorage.getItem("currentUserEmail");
      const savedRole = localStorage.getItem("userRole");

      const CurrentUser = await findProfileByEmailAndRole(savedUser, savedRole);

      console.log('Restoring session:', CurrentUser?.id);

      if (CurrentUser) {
        setIsConnected(true);
        setAuthForm((prev) => ({
          ...prev,
          email: CurrentUser.email || prev.email,
          fullName: CurrentUser.full_name || prev.fullName,
        }));
        setCurrentUserId(CurrentUser.id);

        // derive role from session metadata first (avoids RLS read issues), fallback to profile lookup
        const metaRole = CurrentUser?.role;
        if (metaRole) {
          setCurrentRole(metaRole);
          setAuthForm((prev) => ({ ...prev, role: metaRole }));
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
      } else {
        console.log('No session found');
      }
      setIsLoadingSession(false);
    };

    restoreSession();

    }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-yellow-50 text-gray-900">
        <Header query={query} setQuery={setQuery} search={search} setSearch={setSearch} setAuthMode={setAuthMode} setShowAuth={setShowAuth} isConnected={isConnected} setIsConnected={setIsConnected} authForm={authForm} setCurrentRole={setCurrentRole} setCurrentUserId={setCurrentUserId} setShowMerchantSetup={setShowMerchantSetup} setResults={setResults} setCurrentUser={setCurrentUser} />

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
            element={<ProtectedRoute allowedRole="customer"><ClientPage /></ProtectedRoute>}
          />
          <Route
            path="/merchant"
            element={<ProtectedRoute allowedRole="merchant">{showMerchantSetup ? <MerchantSetupSection setSuccessMessage={setSuccessMessage} setErrorMessage={setErrorMessage} setShowMerchantSetup={setShowMerchantSetup} currentUserId={currentUserId} /> : <MerchantPage onCreateBoutique={() => setShowMerchantSetup(true)} currentUserId={currentUserId} />}</ProtectedRoute>}
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
                  <MerchantPage onCreateBoutique={() => setShowMerchantSetup(true)} currentUserId={currentUserId} />
                ) : (
                  <ClientPage />
                ) 
              ) : (
                <Hero onCreateBoutique={() => setShowMerchantSetup(true)} results={results} query={query} />
              )
            }
          />
        </Routes>

        
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

        
      </div>

      <footer className="bg-green-700 text-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            &copy; {new Date().getFullYear()} Guinée Connect. Tous droits réservés.
          </div>
      </footer>

    </Router>
  );
}
