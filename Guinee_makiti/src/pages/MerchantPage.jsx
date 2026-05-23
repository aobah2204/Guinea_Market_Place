import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function MerchantPage({ user }) {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(20);
        setBusinesses(data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-4">Tableau Commerçant</h2>
      <p className="mb-6 text-gray-600">Créer et gérer vos boutiques et articles depuis ce tableau.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-semibold mb-2">Vos boutiques</h3>
          <ul className="space-y-2">
            {businesses.map((b) => (
              <li key={b.id} className="p-3 border rounded-md">
                <div className="font-semibold">{b.business_name}</div>
                <div className="text-sm text-gray-600">{b.city} — {b.category}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-semibold mb-2">Actions</h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded-2xl">Créer une boutique</button>
          <div className="mt-4 text-sm text-gray-600">CRUD articles et gestion de stock à implémenter ici.</div>
        </div>
      </div>
    </section>
  );
}
