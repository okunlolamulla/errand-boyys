import LegalPage from '../../components/LegalPage';
import { EM, PHD } from '../../lib/config';

export default function Compliance() {
  return (
    <LegalPage title="Compliance">
      <p>This page explains the rules we follow and expect from everyone who uses Errand Boys.</p>
      <h3>1. Protecting your data</h3>
      <p>We aim to handle personal data in line with the Nigeria Data Protection Act 2023. Read more in our <a href="#/privacy">Privacy Policy</a>.</p>
      <h3>2. Payments</h3>
      <p>Payments are made through a secure payment provider using a link or checkout code from us. We never ask you to share your card PIN or OTP, and we do not store your card number. If someone asks for your PIN or OTP in our name, do not share it and tell us.</p>
      <h3>3. Errands we do not accept</h3>
      <p>We do not accept illegal errands, weapons, illegal drugs, or controlled medicines without a valid prescription, or tasks meant to harass or harm anyone. See our <a href="#/terms">Terms of Use</a>.</p>
      <h3>4. How our agents work</h3>
      <ul>
        <li>Agents carry out only the errands assigned to them.</li>
        <li>They treat customers and their property with respect and keep customer details private.</li>
        <li>They report their progress and add notes or photos as proof when they finish.</li>
      </ul>
      <h3>5. Fraud and misuse</h3>
      <p>We may refuse or stop errands that look like fraud or misuse, and report them to the authorities where the law requires. If something looks suspicious, tell us straight away.</p>
      <h3>6. Complaints</h3>
      <p>If you are unhappy with any errand or with how we handled it, email <a href={`mailto:${EM}`}>{EM}</a> or message us on WhatsApp on {PHD} with your Errand ID. We will look into it and reply.</p>
      <h3>7. Business details</h3>
      <p>Registered business name and registration number: to be added.</p>
    </LegalPage>
  );
}
