
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gradient">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-4">
          <p>
            <strong>Last Updated: {new Date().toLocaleDateString()}</strong>
          </p>
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the
            LADDU ZABARDAST website (the "Service") operated by LADDU ZABARDAST ("us", "we", or "our").
          </p>
          <p>
            Your access to and use of the Service is conditioned on your acceptance of and compliance with
            these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
          </p>
          <p>
            By accessing or using the Service you agree to be bound by these Terms. If you disagree with
            any part of the terms then you may not access the Service.
          </p>

          <h2 className="text-2xl font-semibold">Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete,
            and current at all times. Failure to do so constitutes a breach of the Terms, which may result
            in immediate termination of your account on our Service. You are responsible for safeguarding
            the password that you use to access the Service and for any activities or actions under your password.
          </p>

          <h2 className="text-2xl font-semibold">Purchases</h2>
          <p>
            If you wish to purchase any product or service made available through the Service ("Purchase"),
            you may be asked to supply certain information relevant to your Purchase including, without limitation,
            your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
          </p>

          <h2 className="text-2xl font-semibold">Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive
            property of LADDU ZABARDAST and its licensors.
          </p>

           <h2 className="text-2xl font-semibold">Links To Other Web Sites</h2>
            <p>
                Our Service may contain links to third-party web sites or services that are not owned or controlled by LADDU ZABARDAST.
                LADDU ZABARDAST has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that LADDU ZABARDAST shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
            </p>


          <h2 className="text-2xl font-semibold">Limitation Of Liability</h2>
          <p>
            In no event shall LADDU ZABARDAST, nor its directors, employees, partners, agents, suppliers, or affiliates,
            be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation,
            loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or
            inability to access or use the Service.
          </p>

           <h2 className="text-2xl font-semibold">Governing Law</h2>
           <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
           </p>


          <h2 className="text-2xl font-semibold">Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            What constitutes a material change will be determined at our sole discretion. By continuing to
            access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>

          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at ladduzab@gmail.com .
          </p>
          {/* Add more detailed sections as needed for your specific business */}
        </CardContent>
      </Card>
    </main>
  );
}
