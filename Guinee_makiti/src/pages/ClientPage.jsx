import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function ClientPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {

        {/*
        if(categories.length === 0) {
          const { data: catData, error: catError } = await supabase.from('businesses').select('category'); 
          if (catError) {
            console.error('Category load error:', catError);
          } else {
            setCategories(catData.map(c => c.category).filter(Boolean).sort());
          }
        }

        if(cities.length === 0) {
          const { data: cityData, error: cityError } = await supabase.from('businesses').select('city'); 
          if (cityError) {
            console.error('City load error:', cityError);
          } else {
            setCities(cityData.map(c => c.city).filter(Boolean).sort());
          }
        }
        */}

        const { data: catData } = await supabase.from('businesses').select('category').not('category', 'is', null).limit(1000);
        const uniqCats = Array.from(new Set((catData || []).map((c) => c.category).filter(Boolean)));
        setCategories(uniqCats.sort());

        const { data: cityData } = await supabase.from('businesses').select('city').not('city', 'is', null).limit(1000);
        const uniqCities = Array.from(new Set((cityData || []).map((c) => c.city).filter(Boolean)));
        setCities(uniqCities.sort());

      } catch (e) {
        console.error('Filter load error', e);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      // if no query and no filters, clear
      {/*
      if (!query && !categoryFilter && !cityFilter) {
        setResults([]);
        return;
      }
      */}
    
      setLoading(true);

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

      setLoading(false);
    };

    const t = setTimeout(fetchResults, 250);
    return () => clearTimeout(t);
  }, [query, categoryFilter, cityFilter]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold mb-4">Recherche de boutiques et lieux</h2>

      <div className="flex gap-3 items-center mb-4">
        <div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-2xl px-4 py-2">
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="border rounded-2xl px-4 py-2">
            <option value="">Toutes villes</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <input
            className="w-full border rounded-2xl px-4 py-3"
            placeholder="Rechercher (nom, catégorie, ville, adresse...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div>
          <button onClick={() => { setQuery(''); setCategoryFilter(''); setCityFilter(''); }} className="border px-4 py-2 rounded-2xl">Effacer</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600 mb-2">Chargement...</div>}

      <div className="relative max-w-3xl">
        {results.length > 0 ? (
          <ul className="absolute z-50 w-full bg-white border rounded-md mt-2 max-h-96 overflow-auto shadow-lg">
            {results.map((r) => (
              <li key={r.id} className="p-3 hover:bg-gray-50 border-b">
                <div className="font-semibold">{r.business_name} <span className="text-sm font-normal text-gray-500">· {r.category}</span></div>
                <div className="text-sm text-gray-600">{r.city} — {r.address}</div>
                <div className="text-sm text-gray-700 mt-1">{r.description}</div>
                <div className="text-sm text-gray-500 mt-1">Tel: {r.phone}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-600">Aucun résultat</div>
        )}
      </div>
    </section>
  );
}
