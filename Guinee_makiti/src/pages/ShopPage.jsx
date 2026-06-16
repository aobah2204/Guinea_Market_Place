import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPhone, FaWhatsapp } from 'react-icons/fa';
import supabase from '../lib/supabaseClient';

function formatDistance(meters) {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ShopPage({ setAccessMessage, setErrorMessage }) {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [geoMessage, setGeoMessage] = useState('');

  const showAccessMessage = (msg) => typeof setAccessMessage === 'function' && setAccessMessage(msg);
  const showErrorMessage = (msg) => typeof setErrorMessage === 'function' && setErrorMessage(msg);

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true);
      try {
        const { data: shopData, error: shopError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', shopId)
          .maybeSingle();

        if (shopError) {
          console.error('Shop load error', shopError);
          showErrorMessage('Impossible de charger la boutique.');
          setShop(null);
          setPhotos([]);
          return;
        }

        setShop(shopData || null);

        if (shopData) {
          const { data: photoData, error: photoError } = await supabase
            .from('business_photos')
            .select('photo_url')
            .eq('business_id', shopId)
            .order('id', { ascending: true });

          if (photoError) {
            console.error('Shop photo load error', photoError);
            setPhotos([]);
          } else {
            setPhotos(photoData || []);
          }
        }
      } catch (error) {
        console.error('Shop page error', error);
        showErrorMessage('Erreur lors du chargement de la boutique.');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      loadShop();
    } else {
      setLoading(false);
      setShop(null);
    }
  }, [shopId]);

  useEffect(() => {
    const requestPosition = () => {
      if (!navigator.geolocation) {
        setGeoMessage('Géolocalisation non supportée par votre navigateur.');
        return;
      }

      setGeoMessage('Recherche de votre position...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGeoMessage('Position trouvée.');
        },
        (error) => {
          console.error('Geolocation error', error);
          setGeoMessage('Impossible de récupérer votre position.');
          showErrorMessage('Géolocalisation désactivée ou non autorisée.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    requestPosition();
  }, []);

  const handleRefreshLocation = () => {
    setGeoMessage('Recherche de votre position...');
    setUserLocation(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGeoMessage('Position trouvée.');
        },
        (error) => {
          console.error('Geolocation refresh error', error);
          setGeoMessage('Impossible de récupérer votre position.');
          showErrorMessage('Géolocalisation désactivée ou non autorisée.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setGeoMessage('Géolocalisation non supportée par votre navigateur.');
    }
  };

  const mapQuery = shop ? encodeURIComponent(`${shop.business_name} ${shop.address || ''} ${shop.city || ''}`.trim()) : '';
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const whatsappNumber = shop?.whatsapp ? shop.whatsapp.replace(/[^0-9+]/g, '') : '';
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/^\+/, '')}` : '';
  const telLink = shop?.phone ? `tel:${shop.phone.replace(/[^0-9+]/g, '')}` : '';

  const hasCoordinates = shop?.latitude && shop?.longitude && userLocation;
  const distance = hasCoordinates
    ? formatDistance(getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude))
    : null;

  const handleScrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {photos.length > 0 && (
        <div
          className="rounded-3xl mb-6 overflow-hidden relative h-64 w-full bg-cover bg-center shadow-sm"
          style={{ backgroundImage: `url(${photos[0].photo_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute left-6 bottom-6 flex gap-3">
            <button
              onClick={handleScrollToContact}
              className="px-4 py-2 rounded-2xl bg-white/90 text-sm font-semibold text-gray-900 hover:bg-white transition"
            >
              Contacter
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-2xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              Localiser
            </a>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Détails de la boutique</h2>
          <p className="text-sm text-gray-600 mt-1">Consultez le profil de la boutique et votre position.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-2xl border bg-white text-sm text-gray-700 hover:bg-gray-50 transition">
            Retour
          </button>
          <button onClick={handleRefreshLocation} className="px-4 py-2 rounded-2xl bg-green-600 text-white text-sm hover:bg-green-700 transition">
            Actualiser ma position
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-gray-700">Chargement...</div>
      ) : !shop ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-gray-700">Boutique introuvable.</div>
      ) : (
        <div className="space-y-6">
          
          {photos.length > 0 && (
            <div className="rounded-3xl border bg-green-200 p-6 shadow-sm">
              <div className="mb-4">
                <div className="text-sm text-gray-500">{shop.category || 'Sans catégorie'}</div>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">{shop.business_name}</h3>
                <p className="text-sm text-gray-500 mt-2">{shop.city || 'Ville inconnue'} · {shop.address || 'Adresse inconnue'}</p>
              </div>

              <div className="text-sm uppercase tracking-wide text-gray-500 mb-4">Galerie de la boutique</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <img key={photo.photo_url} src={photo.photo_url} alt={`Photo boutique ${shop.business_name}`} className="h-44 w-full rounded-3xl object-cover" />
                ))}
              </div>
            </div>
              
          )}
          
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div id="contact-section" className="rounded-3xl border bg-blue-200 p-6 shadow-sm">
              <div className="mb-4">
                {/* <div className="text-sm text-gray-500">{shop.category || 'Sans catégorie'}</div> */}
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">Contact</h3>
                <p className="text-sm text-gray-500 mt-2">{shop.category || 'Sans catégorie'} - {shop.city || 'Ville inconnue'} · {shop.address || 'Adresse inconnue'}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border p-4 bg-slate-50">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Téléphone</div>
                  <div className="mt-2 text-base text-gray-800">{shop.phone || 'Non renseigné'}</div>
                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href={telLink}
                      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${shop.phone ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed opacity-60'}`}
                      aria-disabled={!shop.phone}
                    >
                      <FaPhone className="mr-2" />
                      Appeler
                    </a>
                    {/* WhatsApp peut être affiché même si le numéro n'est pas renseigné, mais le lien sera désactivé */}
                    <a
                      href={telLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${telLink ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-300 cursor-not-allowed opacity-60'}`}
                      aria-disabled={!telLink}
                    >
                      <FaWhatsapp className="mr-2" />
                      Envoyer un message
                    </a>
                    
                  </div>
                </div>
                <div className="rounded-3xl border p-4 bg-slate-50">
                  <div className="text-xs uppercase tracking-wide text-gray-500">WhatsApp</div>
                  <div className="mt-2 text-base text-gray-800">{shop.whatsapp || 'Non renseigné'}</div>
                  <div className="mt-4 flex flex-col gap-2">                    
                    <a
                      href={telLink}
                      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${shop.phone ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed opacity-60'}`}
                      aria-disabled={!shop.phone}
                    >
                      <FaPhone className="mr-2" />
                      Appeler
                    </a>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${whatsappLink ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-300 cursor-not-allowed opacity-60'}`}
                      aria-disabled={!whatsappLink}
                    >
                      <FaWhatsapp className="mr-2" />
                      Envoyer un message
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border p-5 bg-white">
                <div className="text-sm uppercase tracking-wide text-gray-500">À propos</div>
                <p className="mt-3 text-gray-700 leading-relaxed">{shop.description || 'Aucune description fournie pour cette boutique.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm uppercase tracking-wide text-gray-500">Votre position</div>
                    <p className="mt-2 text-gray-700">{geoMessage}</p>
                  </div>
                </div>
                {userLocation ? (
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>Latitude: {userLocation.latitude.toFixed(6)}</div>
                    <div>Longitude: {userLocation.longitude.toFixed(6)}</div>
                    {distance && <div>Distance approximative: {distance}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Activez la géolocalisation dans votre navigateur pour afficher votre position.</div>
                )}
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="text-sm uppercase tracking-wide text-gray-500 mb-3">Accès à la carte</div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  Ouvrir sur Google Maps
                </a>
                <p className="mt-3 text-xs text-gray-500">Votre position sera utilisée localement pour afficher des distances si disponible.</p>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </section>
  );
}
