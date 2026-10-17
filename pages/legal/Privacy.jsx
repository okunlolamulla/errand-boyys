import LegalPage from '../../components/LegalPage';
import { EM, PHD } from '../../lib/config';

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>This policy explains what personal information Errand Boys collects, why, and the choices you have. We aim to handle personal data in line with the Nigeria Data Protection Act 2023.</p>
      <h3>1. What we collect</h3>
      <ul>
        <li><b>Request details:</b> your name, phone number, email (if you give one), addresses, the task, and your preferred time.</li>
        <li><b>Payment details:</b> confirmation that you paid, the amount and a payment reference. Payments are handled by our payment provider, and we do not store your card number.</li>
        <li><b>Messages:</b> what you send us on WhatsApp, email or phone.</li>
        <li><b>Prescriptions:</b> if you upload a prescription or doctor's order for a pharmacy pickup, we use it only to buy and deliver your medicine, share it only with the agent and pharmacy that need it, and keep it only as long as needed.</li>
        <li><b>Proof of work:</b> notes and photos our agents add when they complete an errand.</li>
        <li><b>On your device:</b> this site saves your Errand ID and request details in your browser so checkout can fill them in for you. You can clear them any time in your browser settings.</li>
      </ul>
      <h3>2. How we use it</h3>
      <ul>
        <li>To review your request, quote it, take payment and carry out the errand.</li>
        <li>To assign an agent and keep you updated.</li>
        <li>To prevent fraud and keep customers and agents safe.</li>
        <li>To answer questions and improve our service.</li>
      </ul>
      <h3>3. Who we share it with</h3>
      <ul>
        <li><b>Agents</b> get what they need to do your errand: the task, locations, time and how to reach you.</li>
        <li><b>Service providers</b> that help us run Errand Boys, such as payment, messaging and hosting providers.</li>
        <li><b>Authorities</b>, when the law requires it.</li>
      </ul>
      <p>We do not sell your personal information.</p>
      <h3>4. How long we keep it</h3>
      <p>We keep information only as long as we need it to provide the service, resolve disputes and meet legal and accounting duties. After that we delete it or make it anonymous.</p>
      <h3>5. Keeping it safe</h3>
      <p>We use reasonable technical and organisational measures to protect your information. No system is perfectly secure, so please keep your Errand ID private.</p>
      <h3>6. Your rights</h3>
      <p>You can ask us to see, correct or delete your information, to limit how we use it, or to object to certain uses. Contact us using the details below. You also have the right to complain to the Nigeria Data Protection Commission.</p>
      <h3>7. Children</h3>
      <p>Errand Boys is not meant for people under 18, and we do not knowingly collect their information.</p>
      <h3>8. Changes</h3>
      <p>We may update this policy. The date at the top shows the latest version.</p>
      <h3>9. Contact</h3>
      <p>Email <a href={`mailto:${EM}`}>{EM}</a> or call {PHD}.</p>
    </LegalPage>
  );
}
