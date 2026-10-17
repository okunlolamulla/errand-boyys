import { slug } from '../lib/format';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${slug(status)}`}>{status}</span>;
}
