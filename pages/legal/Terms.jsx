import LegalPage from '../../components/LegalPage';
import { EM, PHD } from '../../lib/config';

export default function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <h3>1. Using Errand Boys</h3>
      <p>These terms apply when you use this website or ask Errand Boys to run an errand for you. By sending a request or paying a quote, you agree to them. If you do not agree, please do not use the service.</p>
      <h3>2. What we do</h3>
      <p>Errand Boys connects you with agents who carry out errands for you, such as grocery shopping, pharmacy pickups, office errands, moving, house hunting, errand verification, car servicing and custom errands. The services shown on the site are examples. Availability depends on your location, the task and the time.</p>
      <h3>3. Requests, quotes and payment</h3>
      <ul>
        <li>A request is not a booking. We review it, then send you a quote. You see the price before you pay.</li>
        <li>Your quote says what is included. If items must be bought on your behalf, we will explain how their cost is handled before you pay.</li>
        <li>You pay through a secure payment link or checkout code we send you. Work starts once we confirm your payment.</li>
        <li>Your Errand ID identifies your request. Keep it private: anyone who has it can see the progress of your errand.</li>
      </ul>
      <h3>4. Your responsibilities</h3>
      <p>Give accurate details (the task, addresses, your phone number and the time). Be reachable while the errand is in progress, and treat our agents with respect. We may stop an errand if the details are wrong or an agent would not be safe.</p>
      <h3>5. Errands we will not do</h3>
      <ul>
        <li>Anything illegal or against Nigerian law.</li>
        <li>Weapons, illegal drugs, or controlled medicines without a valid prescription.</li>
        <li>Tasks meant to harass, stalk or harm someone.</li>
        <li>Anything that puts an agent at unreasonable risk.</li>
      </ul>
      <p>We may refuse or cancel any errand. Refunds are covered in our <a href="#/refunds">Refund Policy</a>.</p>
      <h3>6. Timing</h3>
      <p>Times we give are estimates, not guarantees. Traffic, weather, queues and other things outside our control can cause delays. We will keep you updated.</p>
      <h3>7. Verification and house-hunting reports</h3>
      <p>For verification errands and house hunting, agents report what they see and photograph during their visit. A report is not legal advice, a valuation, or a guarantee that a seller, property or document is genuine. Please do not rely on it as your only check before making a large payment.</p>
      <h3>8. If something goes wrong</h3>
      <p>Tell us as soon as possible, with your Errand ID, and we will work to put it right. To the extent the law allows, we are not responsible for indirect or consequential losses, and our responsibility for any errand is limited to the amount you paid us for it. Nothing in these terms limits rights you have by law that cannot be excluded.</p>
      <h3>9. Your information</h3>
      <p>How we handle your information is explained in our <a href="#/privacy">Privacy Policy</a>.</p>
      <h3>10. Changes</h3>
      <p>We may update these terms or the service. The date at the top shows the latest version. If you keep using Errand Boys after a change, you accept the new terms.</p>
      <h3>11. Governing law</h3>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
      <h3>12. Contact</h3>
      <p>Questions about these terms? Email <a href={`mailto:${EM}`}>{EM}</a> or call {PHD}.</p>
    </LegalPage>
  );
}
