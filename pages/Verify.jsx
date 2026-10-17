import { RequestShell } from './Request';

export default function VerifyPage() {
  return (
    <RequestShell title="Verification errand" blurb="Not sure a seller, property or address is real? An agent visits and sends you evidence and a report." initialSel={6} locked pic="/assets/img/verify-excited.jpg" picAlt="A delighted woman reading good news on her phone" />
  );
}
