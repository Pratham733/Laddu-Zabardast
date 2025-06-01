
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gradient">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-4">
          <p>
            <strong>Last Updated: {new Date().toLocaleDateString()}</strong>
          </p>
          <p>
            Welcome to LADDU ZABARDAST! We are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you visit our website. Please read this privacy policy carefully.
            If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>

          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email address, shipping address,
            and payment information when you make a purchase or register for an account. We may also
            collect non-personal information, such as browser type, operating system, and website usage data.
          </p>

          <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, manage your account, improve our website
            and services, communicate with you, and comply with legal obligations.
          </p>

          <h2 className="text-2xl font-semibold">Sharing Your Information</h2>
          <p>
            We do not sell or rent your personal information to third parties. We may share your information
            with trusted third-party service providers who assist us in operating our website, conducting our
            business, or servicing you, so long as those parties agree to keep this information confidential.
            We may also release your information when we believe release is appropriate to comply with the law,
            enforce our site policies, or protect ours or others' rights, property, or safety.
          </p>

          <h2 className="text-2xl font-semibold">Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information.
            However, no method of transmission over the Internet or method of electronic storage is 100% secure.
          </p>

          <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically
            for any changes.
          </p>

          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at ladduzab@gmail.com .
          </p>
          {/* Add more detailed sections as required by law and your business practices */}
        </CardContent>
      </Card>
    </main>
  );
}
