const LAST_UPDATED = "July 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-white font-bold text-lg">{title}</h2>
    <div className="flex flex-col gap-2 text-white/50 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const TermsOfServicePage = () => (
  <div
    className="w-full min-h-screen text-white"
    style={{ background: "linear-gradient(to bottom, #0a0c10 0%, #080a0e 100%)" }}
  >
    <div className="max-w-[760px] mx-auto xsm:px-4 md:px-6 xsm:pt-10 xsm:pb-28 md:pt-16 md:pb-20 flex flex-col gap-10">

      {/* Header */}
      <div className="flex flex-col gap-2 pb-6 border-b border-white/[0.07]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Legal</p>
        <h1 className="text-white font-extrabold text-3xl md:text-4xl">Terms of Service</h1>
        <p className="text-white/30 text-sm">Last updated: {LAST_UPDATED}</p>
        <div className="mt-2 px-4 py-3 rounded-xl border border-gold/25 bg-gold/5">
          <p className="text-gold/80 text-xs leading-relaxed">
            <span className="font-bold">Draft notice:</span> These terms are a working draft pending attorney review. They are provided in good faith and will be finalized before public launch.
          </p>
        </div>
      </div>

      {/* Intro */}
      <p className="text-white/50 text-sm leading-relaxed">
        Welcome to Balisong Flipping Center ("the Platform", "we", "us", or "our"). By accessing or using balisongflippingcenter.com, you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
      </p>

      <Section title="1. Eligibility">
        <p>You must be at least 18 years of age to create an account or use the Platform. By registering, you represent and warrant that you are 18 or older.</p>
        <p>You are solely responsible for ensuring that your use of the Platform — including viewing, discussing, buying, selling, or trading balisong knives — complies with all applicable laws in your jurisdiction. Balisong knives are restricted or prohibited in certain U.S. states and countries. We make no representation that the content or transactions facilitated through this Platform are legal in your location.</p>
      </Section>

      <Section title="2. User Accounts">
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or otherwise harm the Platform or its users.</p>
      </Section>

      <Section title="3. User-Generated Content">
        <p>You retain ownership of the content you post on the Platform. By posting content, you grant Balisong Flipping Center a non-exclusive, royalty-free, worldwide license to display, reproduce, and distribute your content in connection with operating and promoting the Platform.</p>
        <p>You are solely responsible for the content you post. You agree not to post content that is illegal, harassing, fraudulent, or that violates the rights of any third party.</p>
      </Section>

      <Section title="4. Buy / Sell and Trade Listings">
        <p className="font-semibold text-white/70">All transactions facilitated through Buy/Sell and Trade posts occur entirely off-platform. Balisong Flipping Center is not a party to any sale, purchase, or exchange between users and assumes no responsibility for any off-platform transaction, including but not limited to disputes, fraud, loss, or damage arising from such transactions.</p>
        <p>You are solely responsible for verifying the legitimacy of any buyer, seller, or item before completing a transaction. We strongly recommend using established payment methods with buyer protection.</p>
        <p>You are responsible for ensuring that any sale, purchase, or trade of a balisong knife is lawful in both your jurisdiction and the jurisdiction of the other party. Listing an item for sale or trade does not guarantee its legal transfer is permitted.</p>
      </Section>

      <Section title="5. Tutorial and Trick Content — Assumption of Risk">
        <p className="font-semibold text-white/70">Balisong flipping involves the use of a bladed instrument and carries a significant risk of serious physical injury, including cuts, lacerations, and other harm. By accessing tutorial, trick, or combo content on this Platform, you acknowledge and accept these risks.</p>
        <p>Always use appropriate safety equipment, including cut-resistant gloves, when practicing. Begin with a trainer knife. Never attempt tricks beyond your current skill level.</p>
        <p>Balisong Flipping Center does not endorse any specific technique or training method. Tutorial content is user-generated and has not been verified for safety by the Platform. We are not liable for any injury resulting from attempting any trick, technique, or maneuver shown on the Platform.</p>
      </Section>

      <Section title="6. Prohibited Conduct">
        <p>You agree not to use the Platform to:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li>Post or facilitate any transaction that is illegal under applicable law</li>
          <li>Harass, threaten, or harm other users</li>
          <li>Post fraudulent listings or misrepresent items for sale or trade</li>
          <li>Impersonate any person or entity</li>
          <li>Scrape, crawl, or otherwise extract data from the Platform without permission</li>
          <li>Attempt to gain unauthorized access to any part of the Platform</li>
          <li>Post content that infringes any third-party intellectual property rights</li>
        </ul>
      </Section>

      <Section title="7. Intellectual Property">
        <p>All Platform content not submitted by users — including the name "Balisong Flipping Center", design, logos, and code — is the property of the Platform and may not be reproduced or used without written permission.</p>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <p>The Platform is provided "as is" and "as available" without warranty of any kind, express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.</p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>To the fullest extent permitted by law, Balisong Flipping Center and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to damages arising from off-platform transactions, physical injury from techniques viewed on the Platform, or loss of data.</p>
      </Section>

      <Section title="10. Changes to These Terms">
        <p>We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. We will make reasonable efforts to notify users of significant changes.</p>
      </Section>

      <Section title="11. Contact">
        <p>Questions about these Terms can be directed to us via the Contact page or through our Discord community.</p>
      </Section>

    </div>
  </div>
);

export default TermsOfServicePage;
