import { useState, useEffect } from 'react';
import supabase from '../lib/supabaseClient';

export default function MerchantPage({ user, onCreateBoutique, currentUserId: propCurrentUserId }) {
  const [businesses, setBusinesses] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(propCurrentUserId || null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ business_name: '', category: '', address: '', city: '', phone: '', whatsapp: '', description: '' });
  const [businessPhotos, setBusinessPhotos] = useState({});
  const [photoForm, setPhotoForm] = useState({ business_id: null, url: '', file: null });
  const [photoModeOpen, setPhotoModeOpen] = useState(null);

  const loadPhotos = async (businessIds = []) => {
    if (!businessIds.length) {
      setBusinessPhotos({});
      return;
    }

    try {
      const { data, error } = await supabase.from('business_photos').select('*').in('business_id', businessIds);
      if (error) {
        console.error('Error loading photos', error);
        return;
      }
      const grouped = data.reduce((acc, photo) => {
        if (!acc[photo.business_id]) acc[photo.business_id] = [];
        acc[photo.business_id].push(photo);
        return acc;
      }, {});
      setBusinessPhotos(grouped);
    } catch (e) {
      console.error('Error loading business photos', e);
    }
  };

  const load = async () => {
    try {
      // prefer propCurrentUserId when provided, otherwise get session
      let userId = propCurrentUserId || currentUserId;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id;
        setCurrentUserId(userId || null);
      }

      let query = supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(100);
      if (userId) query = query.eq('owner_id', userId);

      const { data } = await query;
      const businessesData = data || [];
      setBusinesses(businessesData);
      await loadPhotos(businessesData.map((b) => b.id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (b) => {
    if (!currentUserId || b.owner_id !== currentUserId) {
      alert('Vous n\'êtes pas autorisé à modifier cette boutique.');
      return;
    }
    setEditingId(b.id);
    setEditForm({
      business_name: b.business_name || '',
      category: b.category || '',
      address: b.address || '',
      city: b.city || '',
      phone: b.phone || '',
      whatsapp: b.whatsapp || '',
      description: b.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ business_name: '', category: '', address: '', city: '', phone: '', whatsapp: '', description: '' });
  };

  const startPhotoUpload = (b) => {
    if (!currentUserId || b.owner_id !== currentUserId) {
      alert('Vous n\'êtes pas autorisé à ajouter des photos à cette boutique.');
      return;
    }
    setPhotoModeOpen(b.id);
    setPhotoForm({ business_id: b.id, url: '', file: null });
  };

  const handlePhotoFormChange = (e) => {
    const { name, value, files } = e.target;
    setPhotoForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const uploadPhoto = async (photoUrl) => {
    // include owner_id to satisfy common RLS policies that check auth.uid() = owner_id
    let owner_id = currentUserId;
    if (!owner_id) {
      const { data } = await supabase.auth.getSession();
      owner_id = data?.session?.user?.id;
    }

    const insertPayload = { business_id: photoForm.business_id, photo_url: photoUrl };
    if (owner_id) insertPayload.owner_id = owner_id;

    const { error } = await supabase.from('business_photos').insert([insertPayload]);
    if (error) {
      if ((error.message || '').toLowerCase().includes('row-level')) {
        throw new Error('RLS error: ' + error.message + '. Vérifiez la policy INSERT de la table `business_photos` (auth.uid() doit correspondre au propriétaire ou utilisez une policy liée à `business_id`).');
      }
      throw error;
    }
  };

  const submitPhoto = async (e) => {
    e.preventDefault();
    try {
      if (!photoForm.business_id) throw new Error('Aucune boutique sélectionnée.');
      const existingPhotos = businessPhotos[photoForm.business_id] || [];
      if (existingPhotos.length >= 6) {
        alert('Maximum de 6 photos atteints pour cette boutique.');
        return;
      }

      let photoUrl = photoForm.url?.trim();
      if (photoForm.file) {
        const file = photoForm.file;
        const filePath = `business_photos/${photoForm.business_id}/${Date.now()}_${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('business_photos').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) {
          throw new Error('Erreur de téléchargement du fichier : ' + uploadError.message);
        }
        const { data: publicData, error: publicError } = supabase.storage.from('business_photos').getPublicUrl(data.path);
        if (publicError) {
          throw new Error('Impossible de récupérer l\'URL publique : ' + publicError.message);
        }
        photoUrl = publicData.publicUrl;
      }

      if (!photoUrl) {
        throw new Error('Fournissez une URL de photo ou chargez un fichier.');
      }

      await uploadPhoto(photoUrl);
      await load();
      setPhotoModeOpen(null);
    } catch (err) {
      console.error('Photo upload error', err);
      const msg = (err?.message || String(err)).toLowerCase();
      if (msg.includes('row-level') || msg.includes('rls') || msg.includes('policy') || msg.includes('new row violates')) {
        alert("Impossible d'ajouter la photo à cause d'une règle de sécurité (RLS). Vérifiez la policy INSERT de la table 'business_photos' ou assurez-vous que 'owner_id' correspond à votre utilisateur. Voir la console pour plus de détails.");
      } else {
        alert('Erreur lors de l\'ajout de la photo : ' + (err.message || err));
      }
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette photo ?')) return;
    try {
      const { error } = await supabase.from('business_photos').delete().eq('id', photoId);
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('Delete photo error', err);
      alert('Erreur lors de la suppression de la photo : ' + (err.message || err));
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('businesses').update({
        business_name: editForm.business_name,
        category: editForm.category,
        address: editForm.address,
        city: editForm.city,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        description: editForm.description,
      }).eq('id', editingId);

      if (error) throw error;
      await load();
      cancelEdit();
    } catch (err) {
      console.error('Update error', err);
      alert('Erreur lors de la mise à jour: ' + (err.message || err));
    }
  };

  const deleteBusiness = async (id, ownerId) => {
    if (!currentUserId || ownerId !== currentUserId) {
      alert('Vous n\'êtes pas autorisé à supprimer cette boutique.');
      return;
    }
    if (!confirm('Voulez-vous vraiment supprimer cette boutique ? Cette action est irréversible.')) return;
    try {
      const { error } = await supabase.from('businesses').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (err) {
      console.error('Delete error', err);
      alert('Erreur lors de la suppression: ' + (err.message || err));
    }
  };

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
                {editingId === b.id ? (
                  <form onSubmit={submitEdit} className="space-y-2">
                    <input className="w-full border rounded px-2 py-1" value={editForm.business_name} onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))} />
                    <div className="flex gap-2">
                      <input className="flex-1 border rounded px-2 py-1" value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))} />
                      <input className="flex-1 border rounded px-2 py-1" value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} />
                    </div>
                    <textarea className="w-full border rounded px-2 py-1" value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Enregistrer</button>
                      <button type="button" onClick={cancelEdit} className="border px-3 py-1 rounded">Annuler</button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="font-semibold">{b.business_name}</div>
                    <div className="text-sm text-gray-600">{b.city} — {b.category}</div>

                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Galerie ({(businessPhotos[b.id] || []).length}/6)</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(businessPhotos[b.id] || []).map((photo) => (
                          <div key={photo.id} className="relative rounded overflow-hidden border">
                            <img src={photo.photo_url} alt="Photo boutique" className="h-20 w-full object-cover" />
                            {currentUserId && b.owner_id === currentUserId && (
                              <button onClick={() => deletePhoto(photo.id)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded">x</button>
                            )}
                          </div>
                        ))}
                        {!(businessPhotos[b.id] || []).length && (
                          <div className="col-span-3 text-sm text-gray-500 italic">Aucune photo ajoutée.</div>
                        )}
                      </div>
                    </div>

                    {currentUserId && b.owner_id === currentUserId && (
                      <div className="mt-3">
                        <button onClick={() => startPhotoUpload(b)} className="border px-3 py-1 rounded">Ajouter une photo</button>
                      </div>
                    )}

                    {photoModeOpen === b.id && (
                      <form onSubmit={submitPhoto} className="mt-3 space-y-2 border p-3 rounded bg-slate-50">
                        <div className="text-sm text-gray-700">Chargez un fichier ou collez un lien d'image</div>
                        <input type="url" name="url" placeholder="URL de l'image" value={photoForm.url} onChange={handlePhotoFormChange} className="w-full border rounded px-2 py-1" />
                        <input type="file" name="file" accept="image/*" onChange={handlePhotoFormChange} className="w-full" />
                        <div className="flex gap-2">
                          <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Ajouter</button>
                          <button type="button" onClick={() => setPhotoModeOpen(null)} className="border px-3 py-1 rounded">Annuler</button>
                        </div>
                        <div className="text-xs text-gray-500">Si votre bucket de stockage Supabase n'est pas configuré, ajoutez un lien d'image externe.</div>
                      </form>
                    )}

                    <div className="mt-2 flex gap-2">
                      {currentUserId && b.owner_id === currentUserId ? (
                        <>
                          <button onClick={() => startEdit(b)} className="border px-3 py-1 rounded">Modifier</button>
                          <button onClick={() => deleteBusiness(b.id, b.owner_id)} className="bg-red-600 text-white px-3 py-1 rounded">Supprimer</button>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 italic">Vous n'êtes pas le propriétaire</div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-semibold mb-2">Actions</h3>
          <button onClick={onCreateBoutique} className="bg-green-600 text-white px-4 py-2 rounded-2xl">Créer une boutique</button>
          <div className="mt-4 text-sm text-gray-600">CRUD articles et gestion de stock à implémenter ici.</div>
        </div>
      </div>
    </section>
  );
}
