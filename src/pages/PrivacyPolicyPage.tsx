const LAST_UPDATED = "July 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-white font-bold text-lg">{title}</h2>
    <div className="flex flex-col gap-2 text-white/50 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const PrivacyPolicyPage = () => (
  <div
    className="w-full min-h-screen text-white"
    style={{ background: "linear-gradient(to bottom, #0a0c10 0%, #080a0e 100%)" }}
  >
    <div className="max-w-[760px] mx-auto xsm:px-4 md:px-6 xsm:pt-10 xsm:pb-28 md:pt-16 md:pb-20 flex flex-col gap-10">

      {/* Header */}
      <div className="flex flex-col gap-2 pb-6 border-b border-white/[0.07]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Legal</p>
        <h1 className="text-white font-extrabold text-3xl md:text-4xl">Privacy Policy</h1>
        <p className="text-white/30 text-sm">Last updated: {LAST_UPDATED}</p>
        <div className="mt-2 px-4 py-3 rounded-xl border border-gold/25 bg-gold/5">
          <p className="text-gold/80 text-xs leading-relaxed">
            <span className="font-bold">Draft notice:</span> This policy is a working draft pending attorney review. It is provided in good faith and will be finalized before public launch.
          </p>
        </div>
      </div>

      {/* Intro */}
      <p className="text-white/50 text-sm leading-relaxed">
        Balisong Flipping Center ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information when you use balisongflippingcenter.com.
      </p>

      <Section title="1. Information We Collect">
        <p>We collect the following types of information when you use the Platform:</p>
        <p className="font-semibold text-white/70">Information you provide directly:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li>Email address (required for registration)</li>
          <li>Display name and identifier code</li>
          <li>Profile photo and banner image</li>
          <li>Bio / profile caption and social links</li>
          <li>Posts, comments, and other content you submit</li>
          <li>Knife collection entries and associated details</li>
        </ul>
        <p className="font-semibold text-white/70 mt-1">Information collected automatically:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li>Basic usage data (pages visited, features used)</li>
          <li>Device and browser type</li>
          <li>IP address</li>
        </ul>
        <p className="font-semibold text-white/70 mt-1">Third-party sign-in:</p>
        <p>If you sign in with Google, we receive basic profile information (name, email, profile photo) from Google as permitted by your Google account settings.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use collected information to:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li>Create and manage your account</li>
          <li>Display your profile and content to other users</li>
          <li>Operate and improve the Platform</li>
          <li>Respond to support requests</li>
          <li>Enforce our Terms of Service and community standards</li>
          <li>Send account-related notifications (e.g. email verification)</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
      </Section>

      <Section title="3. Data Storage">
        <p>Your data is stored on servers hosted on Amazon Web Services (AWS) infrastructure, including Amazon EC2 and Amazon S3 for media files. AWS maintains industry-standard security practices. Data is currently stored in the United States.</p>
      </Section>

      <Section title="4. Children's Privacy (COPPA)">
        <p className="font-semibold text-white/70">The Platform is intended for users 18 years of age and older and is not directed at children under 13.</p>
        <p>We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided personal information, we will delete it promptly. If you believe a child under 13 has registered, please contact us immediately.</p>
      </Section>

      <Section title="5. European Users (GDPR)">
        <p>If you are located in the European Economic Area, you have the following rights regarding your personal data:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li><span className="text-white/70 font-medium">Access</span> — request a copy of the data we hold about you</li>
          <li><span className="text-white/70 font-medium">Rectification</span> — correct inaccurate or incomplete data</li>
          <li><span className="text-white/70 font-medium">Erasure</span> — request deletion of your personal data</li>
          <li><span className="text-white/70 font-medium">Portability</span> — receive your data in a structured, machine-readable format</li>
          <li><span className="text-white/70 font-medium">Objection</span> — object to processing of your data in certain circumstances</li>
        </ul>
        <p>To exercise any of these rights, contact us via the About page or Discord.</p>
      </Section>

      <Section title="6. California Users (CCPA)">
        <p>If you are a California resident, you have the right to know what personal information we collect about you, request deletion of your personal information, and opt out of the sale of your personal information. We do not sell personal information.</p>
        <p>To submit a request, contact us via the About page or Discord.</p>
      </Section>

      <Section title="7. Cookies and Local Storage">
        <p>The Platform uses browser local storage to maintain your session, remember preferences (such as unit settings), and store recent search history. We do not currently use third-party advertising cookies.</p>
      </Section>

      <Section title="8. Third-Party Services">
        <p>The Platform integrates with the following third-party services, each subject to their own privacy policies:</p>
        <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2">
          <li><span className="text-white/70 font-medium">Google OAuth</span> — for optional Google sign-in</li>
          <li><span className="text-white/70 font-medium">Amazon Web Services</span> — for server infrastructure and media storage</li>
          <li><span className="text-white/70 font-medium">Discord</span> — for community support and bug reporting</li>
        </ul>
      </Section>

      <Section title="9. Data Retention">
        <p>We retain your personal information for as long as your account is active. If you delete your account, we will delete your personal data within a reasonable timeframe, except where retention is required by law or necessary to resolve disputes.</p>
      </Section>

      <Section title="10. Account Deletion">
        <p>You may request deletion of your account and associated data at any time through the Settings page or by contacting us directly. Publicly posted content (posts, comments) may be anonymized rather than deleted to preserve community context.</p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify users of significant changes and update the "Last updated" date at the top of this page. Continued use of the Platform after changes are posted constitutes acceptance of the revised policy.</p>
      </Section>

      <Section title="12. Contact">
        <p>For privacy-related questions, data requests, or to report a concern, contact us via the About page or through our Discord community.</p>
      </Section>

    </div>
  </div>
);

export default PrivacyPolicyPage;
