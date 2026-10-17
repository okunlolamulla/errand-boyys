import LegalPage from '../../components/LegalPage';
import { EM, PHD } from '../../lib/config';

export default function Refunds() {
  return (
    <LegalPage title="Refund Policy">
      <p>We want you to be happy with every errand. This policy explains when you can get your money back. Please contact us with your Errand ID so we can help quickly.</p>
      <h3>1. Before you pay</h3>
      <p>Requesting an errand and receiving a quote is free. You only pay once you accept the price.</p>
      <h3>2. Cancelling before work starts</h3>
      <p>If you cancel after paying but before an agent has started your errand, you get a full refund.</p>
      <h3>3. Cancelling after work has started</h3>
      <p>If an agent is already on the way or working, we may keep the cost of work already done, for example travel or items already bought for you. We will tell you the amount and refund the rest.</p>
      <h3>4. If we cannot complete your errand</h3>
      <p>If we cannot complete your errand, we refund the part we did not deliver.</p>
      <h3>5. If something is wrong</h3>
      <p>If your errand was not done as agreed, or an item was wrong or damaged because of us, tell us within 48 hours of completion. We will put it right, with a redo, a partial refund or a full refund, depending on the problem.</p>
      <h3>6. What is not refundable</h3>
      <ul>
        <li>Changing your mind after the errand is completed as agreed.</li>
        <li>Problems caused by wrong details, such as the wrong address or an unreachable phone number.</li>
        <li>The cost of items bought exactly as you instructed, unless they were wrong or damaged because of us.</li>
      </ul>
      <h3>7. How refunds are paid</h3>
      <p>Refunds go back to the way you paid. Depending on your bank or payment provider, they can take several working days to show.</p>
      <h3>8. How to ask for a refund</h3>
      <p>Email <a href={`mailto:${EM}`}>{EM}</a> or message us on WhatsApp on {PHD} with your Errand ID and a short description. See also our <a href="#/terms">Terms of Use</a>.</p>
    </LegalPage>
  );
}
