import { useEffect, useState } from 'react';

/* STEP-BY-STEP BUILD:
1. Supabase DB ✅
2. Auth UI ✅
3. Supabase Auth Integration 🔜
4. Merchant Shop Creation 🔜
*/

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);



function Header({ search, setSearch, setAuthMode, setShowAuth }) {

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-700">Guinée Connect</h1>
          <p className="text-sm text-gray-600">Marketplace national + découverte locale</p>
        </div>
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
        <div className="flex gap-2">
          <button onClick={() => { setAuthMode('login'); setShowAuth(true); }} className="border px-4 py-2 rounded-2xl">Connexion</button>
          <button onClick={() => { setAuthMode('register'); setShowAuth(true); }} className="bg-black text-white px-4 py-2 rounded-2xl">Inscription</button>
        </div>
      </div>
    </header>
  );
}

function AuthSection({ authMode, setAuthMode, authForm, setAuthForm, setShowAuth, setShowMerchantSetup }) {
  
  const handleChange = (e) => {
    const { name, value } = e.target;

    setAuthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //console.log('Auth:', authMode, authForm, import.meta.env.VITE_SUPABASE_URL);

    try {
      if (authMode === 'register') {
        const email = authForm.email.trim().toLowerCase();
        const password = authForm.password;

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant.');
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

        const { error: profileError } = await supabase.from('users').upsert([
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
          alert('Compte créé. Vérifiez votre email puis connectez-vous après confirmation.');
        } else {
          alert('Compte créé et connexion réussie.');
          setShowAuth(false);
          setAuthMode(null);
        }
        
        return;
      }

      if (authMode === 'login') {

        const email = authForm.email.trim().toLowerCase();
        const password = authForm.password;

        console.log('Login attempt:', { email, passwordLength: password?.length });

        if (!email || !password) {
          throw new Error('Email ou mot de passe manquant. Vérifiez les champs du formulaire.');
        }

        alert("FINAL LOGIN VALUES:"+ {
          rawEmail: authForm.email,
          rawPassword: authForm.password,
          email,
          passwordLength: password?.length,
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Login result:', data, error);

        if (error) {
          alert('Erreur de connexion : ' + error.message + ' ' + data.user?.email);

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

        const { data: sessionData } = await supabase.auth.getSession();

        if (!data.session && !sessionData.session) {
          throw new Error('Connexion échouée : session nulle. Vérifiez Supabase Authentication > Users.');
        }

        setShowAuth(false);
        setAuthMode(null);
        alert('Connexion réussie');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message);
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

          {authMode === 'register' && (
            <select name="role" value={authForm.role} onChange={handleChange} className="w-full border rounded-2xl px-4 py-3">
              <option value="customer">Utilisateur</option>
              <option value="merchant">Commerçant</option>
            </select>
          )}

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

function MerchantSetupSection() {
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

      alert('Boutique créée avec succès !');

      setShopForm({
        business_name: '',
        category: '',
        address: '',
        city: '',
        phone: '',
        description: '',
      });
    } catch (error) {
      alert(error.message);
    }
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
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold text-lg">
            Enregistrer ma boutique
          </button>
        </form>
      </div>
    </section>
  );
}

function Hero() {
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
          <button className="bg-green-600 text-white px-6 py-3 rounded-2xl text-lg">Créer ma boutique</button>
          <button className="border border-green-600 text-green-700 px-6 py-3 rounded-2xl text-lg">Télécharger l'app</button>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-2xl p-8 border">
        <div className="aspect-video rounded-2xl bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 flex flex-col items-center justify-center text-white">
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
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-yellow-50 text-gray-900">
      <Header search={search} setSearch={setSearch} setAuthMode={setAuthMode} setShowAuth={setShowAuth} />
      {showAuth && (
        <AuthSection
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          setShowAuth={setShowAuth}
          setShowMerchantSetup={setShowMerchantSetup}
        />
      )}
      {showMerchantSetup ? <MerchantSetupSection /> : <Hero />}

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
  );
}
