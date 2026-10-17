'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import { shrinkImage } from '../lib/image';

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Completion proof: a text note and/or photos/PDF. Submitting marks the errand as finished (Proof Uploaded).
export default function ProofModal({ job, request, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  async function pick(e) {
    setError('');
    const picked = await Promise.all([...e.target.files].map((f) => shrinkImage(f)));
    e.target.value = ''; // lets the same photo be chosen again
    const next = [...files, ...picked];
    if (next.length > MAX_FILES) return setError(`You can attach up to ${MAX_FILES} files.`);
    const bad = picked.find((f) => !TYPES.includes(f.type));
    if (bad) return setError(`"${bad.name}" is not a photo or PDF.`);
    const big = picked.find((f) => f.size > MAX_BYTES);
    if (big) return setError(`"${big.name}" is larger than 5 MB.`);
    setFiles(next);
  }

  async function submit(e) {
    e.preventDefault();
    if (!note.trim() && files.length === 0) { setError('Add a note or at least one photo as proof.'); return; }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('status', 'Proof Uploaded');
      if (note.trim()) form.append('proof_notes', note.trim());
      files.forEach((f) => form.append('proof', f));
      await request(`/agent/errands/${job.errand_id}/status`, { method: 'PUT', body: form });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Proof for ${job.errand_id}`} onClose={onClose}>
      <p className="muted">Add a photo (receipt, delivered item, signed note) and/or a short note. The office will confirm it.</p>
      <form onSubmit={submit}>
        <label>Note
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivered to the customer at the gate, received by Mrs Ade" maxLength={2000} />
        </label>
        <label>Photos or PDF
          <input type="file" accept="image/*,application/pdf" multiple onChange={pick} />
        </label>
        {files.length > 0 && (
          <ul className="thumbs">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                {previews[i] ? <img src={previews[i]} alt={f.name} /> : <span className="pdf">PDF</span>}
                <button type="button" className="btn ghost" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>✕</button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Uploading…' : 'Submit proof & finish'}</button>
        </div>
      </form>
    </Modal>
  );
}
