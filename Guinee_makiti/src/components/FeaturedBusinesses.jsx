import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabaseClient';

export default function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadFeaturedBusinesses = async () => {
      try {
        const { data: listings, error: listingsError } = await supabase
          .from('businesses')
          .select('id, business_name, category, city, address, description')
          .order('created_at', { ascending: false })
          .limit(12);

        if (listingsError) throw listingsError;

        const featuredListings = listings || [];
        if (!featuredListings.length) {
          setBusinesses([]);
          return;
        }

        const { data: photos, error: photosError } = await supabase
          .from('business_photos')
          .select('business_id, photo_url')
          .in('business_id', featuredListings.map((business) => business.id))
          .order('id', { ascending: true })
          .limit(50);

        if (photosError) {
          console.error('Error loading featured business photos', photosError);
        }

        const firstPhotos = (photos || []).reduce((photoByBusiness, photo) => {
          if (!photoByBusiness[photo.business_id]) {
            photoByBusiness[photo.business_id] = photo.photo_url;
          }
          return photoByBusiness;
        }, {});

        setBusinesses(featuredListings.map((business) => ({
          ...business,
          first_photo_url: firstPhotos[business.id] || null,
        })));
      } catch (error) {
        console.error('Unable to load featured businesses', error);
        setLoadError('Impossible de charger les commerces et lieux à découvrir.');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedBusinesses();
  }, []);

  return (
    <section aria-labelledby="featured-businesses-title" className="mb-10">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">À la une de l'annuaire</p>
        <h2 id="featured-businesses-title" className="text-2xl sm:text-3xl font-bold text-gray-900">
          Commerces et lieux à découvrir
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Découvrez les dernières adresses ajoutées dans l'annuaire.
        </p>
      </div>

      {loading ? (
        <p className="rounded-2xl border bg-white p-5 text-sm text-gray-600" role="status">
          Chargement des adresses à découvrir…
        </p>
      ) : loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      ) : businesses.length ? (
        <div className="overflow-x-auto pb-3">
          <div className="flex min-w-max gap-4">
            {businesses.map((business) => (
              <Link
                key={business.id}
                to={`/shop/${business.id}`}
                className="group w-64 shrink-0 overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              >
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  {business.first_photo_url ? (
                    <img
                      src={business.first_photo_url}
                      alt={`Photo de ${business.business_name}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Aucune photo disponible
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-gray-900">
                    À découvrir
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold text-gray-900">{business.business_name}</h3>
                  <p className="mt-1 truncate text-sm text-gray-600">
                    {business.category || 'Commerce ou lieu'}
                  </p>
                  {(business.city || business.address) && (
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {[business.city, business.address].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {business.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{business.description}</p>
                  )}
                  <span className="mt-3 inline-block text-sm font-semibold text-green-700">
                    Voir la fiche →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border bg-white p-5 text-sm text-gray-600">
          Aucun commerce ou lieu n’est encore disponible dans l’annuaire.
        </p>
      )}
    </section>
  );
}
