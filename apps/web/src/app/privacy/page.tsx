import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How InitMyFolio collects and uses your data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              1. overview
            </h2>
            <p>
              InitMyFolio is an open-source tool that generates a public
              portfolio from your GitHub profile. We collect only what is
              strictly necessary to provide the service, and we never sell your
              data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              2. What we collect
            </h2>
            <p className="mb-4">
              When you sign in with GitHub OAuth, we request{" "}
              <strong className="text-foreground font-medium">
                read-only access to your public profile and repositories
              </strong>
              . We store:
            </p>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>
                Your GitHub username, display name, avatar URL, bio, location,
                and website
              </li>
              <li>
                Your public repositories: name, description, stars, forks,
                language, topics, and homepage URL
              </li>
              <li>
                Aggregate language statistics computed from your top
                repositories
              </li>
              <li>
                The timestamp of your last sync and your portfolio settings
                (theme, layout, pinned repos, etc.)
              </li>
            </ul>
            <p className="mt-4">
              We do <strong className="text-foreground font-medium">not</strong>{" "}
              access private repositories, emails (unless public), SSH keys, or
              any write-capable GitHub scope.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              3. How we use it
            </h2>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>To render your public portfolio page</li>
              <li>
                To refresh your GitHub data automatically every 8 hours so your
                portfolio stays up to date
              </li>
              <li>
                To remember your display preferences (theme, layout, etc.)
              </li>
            </ul>
            <p className="mt-4">
              Your GitHub access token is used only during the OAuth callback to
              seed your profile. It is{" "}
              <strong className="text-foreground font-medium">
                not stored
              </strong>{" "}
              in our database. Subsequent syncs use the GitHub public API with a
              server-side token that has no access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              4. Public data
            </h2>
            <p>
              Your portfolio page is{" "}
              <strong className="text-foreground font-medium">
                publicly accessible by anyone
              </strong>{" "}
              at your portfolio URL. It contains only the GitHub data you have
              chosen to make public on GitHub itself. If you update your GitHub
              privacy settings, the change will be reflected after your next
              sync.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              5. Data retention and deletion
            </h2>
            <p>
              Your data is stored in a PostgreSQL database for as long as your
              account exists. To request deletion of your account and all
              associated data, contact us at the address below. We will process
              your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              6. Third-party services
            </h2>
            <ul className="space-y-2 pl-4 border-l border-border">
              <li>
                <strong className="text-foreground font-medium">
                  GitHub OAuth
                </strong>{" "}
                — authentication and public profile data. Subject to{" "}
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:no-underline"
                >
                  GitHub&apos;s Privacy Statement
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground font-medium">
                  Neon (PostgreSQL)
                </strong>{" "}
                — database hosting. Your data is stored in the region selected
                during setup.
              </li>
              <li>
                <strong className="text-foreground font-medium">Vercel</strong>{" "}
                — frontend hosting and edge delivery.
              </li>
              <li>
                <strong className="text-foreground font-medium">Render</strong>{" "}
                — API hosting.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              7. Cookies and local storage
            </h2>
            <p>
              We do not use tracking cookies. We store your authentication JWT
              in{" "}
              <code className="text-foreground bg-secondary px-1.5 py-0.5 rounded-md font-mono text-xs">
                localStorage
              </code>{" "}
              in your browser for session management. This token expires after
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">
              8. Contact
            </h2>
            <p>
              For any privacy-related request, open an issue on the{" "}
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
