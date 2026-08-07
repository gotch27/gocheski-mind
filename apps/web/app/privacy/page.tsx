import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Gocheski Mind",
  description: "How Gocheski Mind and its Chrome extension handle saved content and account data."
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-document">
        <a className="auth-home-link" href="/">Gocheski</a>
        <p className="eyebrow">Last updated August 6, 2026</p>
        <h1>Gocheski Mind privacy policy</h1>
        <p className="privacy-lead">
          Gocheski Mind is a personal inspiration board. Its Chrome extension saves content only when you explicitly
          choose <strong>Save to Mind</strong> from the browser menu.
        </p>

        <section>
          <h2>Information we collect</h2>
          <p>
            When you sign in, we receive basic Google account information needed to identify your account, such as
            your name, email address, profile image, and authentication identifiers. When you save something, we may
            receive the page URL and title, a link URL, an image or image URL, selected text, and labels you provide.
          </p>
          <p>
            The extension stores its revocable access token and your optional default labels locally in Chrome. It
            does not continuously monitor browsing activity and has no persistent content script.
          </p>
          <p>
            When an operation fails, Mind may store a diagnostic log containing the error message, affected feature,
            timestamp, account identifier, and limited technical context needed to investigate the failure. Complete
            extension keys, authentication cookies, passwords, and other recognized secrets are redacted and are not
            intentionally written to diagnostic logs.
          </p>
        </section>

        <section>
          <h2>How information is used</h2>
          <p>
            Information is used only to authenticate you, save the content you request, organize and display your
            inspiration board, retrieve link metadata, prevent duplicate captures, and maintain the service. It is
            not sold or used for personalized advertising.
          </p>
        </section>

        <section>
          <h2>Storage and service providers</h2>
          <p>
            Account and inspiration records are stored with Neon Postgres. Uploaded or captured images may be stored
            with Vercel Blob. The application is hosted on Vercel and Google is used for sign-in. These providers
            process information only as needed to provide their services.
          </p>
        </section>

        <section>
          <h2>Sharing and human access</h2>
          <p>
            We do not sell user data or share it with advertisers. Information is disclosed only to service providers
            required to operate Mind, when required by law, for security and abuse prevention, or with your explicit
            consent. Saved content is not read by a person except when you explicitly request support involving that
            content or when access is required for security or legal reasons.
          </p>
        </section>

        <section>
          <h2>Retention and control</h2>
          <p>
            Inspirations remain in your account until you delete them. Extension access remains active until its key
            is revoked. You can delete inspirations from the board and revoke extension keys from the Extension panel.
            Diagnostic logs are retained only as long as reasonably needed to operate, secure, and troubleshoot the
            service. You may request deletion of your account data through the contact options at gocheski.com.
          </p>
        </section>

        <section>
          <h2>Security</h2>
          <p>
            Data is transmitted over HTTPS. Extension keys are stored as cryptographic hashes on the server and the
            complete key is shown only when it is created. No method of storage or transmission can guarantee absolute
            security.
          </p>
        </section>

        <section>
          <h2>Chrome Web Store limited use</h2>
          <p>
            Gocheski Mind&apos;s use and transfer of information received from Google APIs and the Chrome extension
            complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions and data requests can be submitted through the contact options on{
            " "}<a href="https://www.gocheski.com">gocheski.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
