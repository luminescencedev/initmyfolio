import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using InitMyFolio.",
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-primary/70 mb-3">
            Legal
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              1. Acceptance
            </h2>
            <p>
              By using InitMyFolio, you agree to these Terms. If you do not
              agree, do not use the service. These Terms apply to all visitors
              and registered users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              2. Description of service
            </h2>
            <p>
              InitMyFolio reads your public GitHub profile and repositories via
              GitHub OAuth and generates a public portfolio page on your behalf.
              The service is provided free of charge under the MIT License and
              may be self-hosted.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              3. Your account
            </h2>
            <p className="mb-3">
              You must have a valid GitHub account to use InitMyFolio. You are
              responsible for:
            </p>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>
                The accuracy of the information displayed on your portfolio,
                which mirrors your public GitHub profile
              </li>
              <li>
                Any content you add through portfolio settings (custom links,
                bio overrides, etc.)
              </li>
              <li>
                Keeping your GitHub account secure — InitMyFolio authentication
                is delegated to GitHub OAuth
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              4. Acceptable use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>
                Use the service to distribute illegal, harmful, or misleading
                content
              </li>
              <li>
                Attempt to reverse-engineer, scrape, or disrupt the platform
              </li>
              <li>
                Impersonate another person by misusing the portfolio URL
                structure
              </li>
              <li>Circumvent rate limits or abuse the GitHub sync endpoint</li>
            </ul>
            <p className="mt-4">
              We reserve the right to suspend accounts that violate these rules
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              5. Public portfolio
            </h2>
            <p>
              Your portfolio page is publicly accessible by anyone on the
              internet. By using the service, you consent to your public GitHub
              data being displayed at your portfolio URL. You can delete your
              account at any time to remove your portfolio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              6. Intellectual property
            </h2>
            <p>
              InitMyFolio is released under the{" "}
              <a
                href="https://github.com/luminescencedev/initmyfolio/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                MIT License
              </a>
              . The source code is publicly available. You retain full ownership
              of your GitHub content — InitMyFolio only displays it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              7. Disclaimers and limitation of liability
            </h2>
            <p className="mb-3">
              The service is provided{" "}
              <strong className="text-foreground font-medium">
                &quot;as is&quot;
              </strong>{" "}
              without warranties of any kind, express or implied. In no event
              shall InitMyFolio or its contributors be liable for:
            </p>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>Loss of data or service interruptions</li>
              <li>
                Inaccuracies in the GitHub data displayed on your portfolio
              </li>
              <li>
                Third-party services (GitHub, Neon, Render, Vercel) being
                unavailable
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              8. Changes to these Terms
            </h2>
            <p>
              We may update these Terms at any time. Significant changes will be
              announced in the{" "}
              <a
                href="https://github.com/luminescencedev/initmyfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                GitHub repository
              </a>
              . Continued use of the service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              9. Contact
            </h2>
            <p>
              Questions about these Terms? Open an issue on the{" "}
              <a
                href="https://github.com/luminescencedev/initmyfolio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
