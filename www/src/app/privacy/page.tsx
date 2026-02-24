import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - HomeMaid',
  description: 'Privacy Policy for HomeMaid family AI assistant application',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <p className="text-gray-600 mb-6">
              HomeMaid ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our family AI assistant application and website.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Name and email address</li>
              <li>Family member information (with consent)</li>
              <li>Profile information and preferences</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Family Data</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Family tasks and to-do lists</li>
              <li>Recipes and meal plans</li>
              <li>Grocery lists and shopping items</li>
              <li>Expense tracking and financial data</li>
              <li>Receipt images and data</li>
              <li>Holiday plans and family events</li>
              <li>Family calendars and schedules</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Usage patterns and app interactions</li>
              <li>Performance and diagnostic data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Provide and maintain our AI assistant services</li>
              <li>Process and analyze family data to provide personalized recommendations</li>
              <li>Generate meal plans, shopping lists, and task suggestions</li>
              <li>Facilitate family collaboration and communication</li>
              <li>Send important notifications and updates</li>
              <li>Improve our services and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Family Members</h3>
            <p className="text-gray-600 mb-6">
              Information you share within your family group is accessible to all family members 
              you have invited to join your HomeMaid family space.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Service Providers</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Firebase (for database and authentication)</li>
              <li>Google AI (for artificial intelligence processing)</li>
              <li>Resend (for email services)</li>
              <li>Vercel (for hosting services)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Legal Requirements</h3>
            <p className="text-gray-600 mb-6">
              We may disclose your information if required by law or to protect our rights, 
              property, or safety, or that of our users or the public.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure cloud storage with Firebase</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure development practices</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
            <p className="text-gray-600 mb-6">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of non-essential communications</li>
              <li>Request restriction of processing</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p className="text-gray-600 mb-6">
              We retain your information for as long as necessary to provide our services 
              and comply with legal obligations. You can request deletion of your account 
              and data at any time through your account settings or by contacting us.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-600 mb-6">
              HomeMaid is designed for family use and may be accessed by children under 13 
              with parental consent. We do not knowingly collect personal information from 
              children under 13 without verifiable parental consent.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. International Data Transfers</h2>
            <p className="text-gray-600 mb-6">
              Your information may be transferred to and processed in countries other than 
              your own. We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the effective date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-gray-700">
                <strong>Email:</strong> ashok@homemaid.jaiswals.live<br />
                <strong>Website:</strong> homemaid.jaiswals.live<br />
                <strong>Company:</strong> HomeMaid by Jaiswals Family
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
