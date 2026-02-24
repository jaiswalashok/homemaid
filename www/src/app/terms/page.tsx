import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - HomeMaid',
  description: 'Terms of Use for HomeMaid family AI assistant application',
};

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Use</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <p className="text-gray-600 mb-6">
              Welcome to HomeMaid! These Terms of Use ("Terms") govern your use of our 
              family AI assistant application and website operated by HomeMaid ("we," "our," or "us").
            </p>

            <p className="text-gray-600 mb-6">
              By accessing or using HomeMaid, you agree to be bound by these Terms. 
              If you disagree with any part of these terms, then you may not access the service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By creating an account, accessing our website, or using our mobile application, 
              you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-6">
              HomeMaid is a family AI assistant platform that helps families collaborate on:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Task management and to-do lists</li>
              <li>Recipe discovery and meal planning</li>
              <li>Grocery list management</li>
              <li>Expense tracking and budget management</li>
              <li>Receipt processing and organization</li>
              <li>Holiday planning and family events</li>
              <li>AI-powered recommendations and assistance</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Registration</h3>
            <p className="text-gray-600 mb-6">
              To use HomeMaid, you must create an account and provide accurate, complete, 
              and current information. You are responsible for maintaining the confidentiality 
              of your account credentials.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Family Groups</h3>
            <p className="text-gray-600 mb-6">
              You can create or join family groups to share information and collaborate with 
              family members. You are responsible for obtaining consent from family members 
              before adding them to your family group.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. User Responsibilities</h2>
            <p className="text-gray-600 mb-6">
              As a user of HomeMaid, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Provide accurate and truthful information</li>
              <li>Use the service for lawful purposes only</li>
              <li>Respect the privacy and rights of other family members</li>
              <li>Not share harmful, offensive, or inappropriate content</li>
              <li>Not attempt to harm or disrupt our service</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use the service for commercial purposes without permission</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Content and Data</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">User Content</h3>
            <p className="text-gray-600 mb-6">
              You retain ownership of all content you create, upload, or share through HomeMaid. 
              By using our service, you grant us a license to use, process, and store your 
              content solely to provide and improve our services.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">AI Processing</h3>
            <p className="text-gray-600 mb-6">
              We use artificial intelligence to analyze your data and provide personalized 
              recommendations. This processing may involve sending data to third-party AI services 
              under strict privacy and security controls.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Privacy</h2>
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also 
              governs your use of the service, to understand our practices.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              The service and its original content, features, and functionality are and will 
              remain the exclusive property of HomeMaid. You may not use our trademarks, 
              service marks, or logos without our prior written permission.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Service Availability</h2>
            <p className="text-gray-600 mb-6">
              We strive to maintain high service availability but cannot guarantee uninterrupted 
              access. We may temporarily suspend the service for maintenance, updates, or 
              other operational reasons.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Termination</h2>
            <p className="text-gray-600 mb-6">
              We may terminate or suspend your account immediately, without prior notice or 
              liability, for any reason whatsoever, including without limitation if you breach 
              the Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Disclaimers</h2>
            <p className="text-gray-600 mb-6">
              HomeMaid is provided on an "AS IS" and "AS AVAILABLE" basis. We make no 
              warranties, expressed or implied, and hereby disclaim all other warranties including, 
              without limitation, implied warranties of merchantability, fitness for a particular 
              purpose, or non-infringement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              In no event shall HomeMaid, our directors, employees, partners, agents, suppliers, 
              or affiliates be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, 
              goodwill, or other intangible losses.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Indemnification</h2>
            <p className="text-gray-600 mb-6">
              You agree to defend, indemnify, and hold harmless HomeMaid and our licensee and 
              licensors, and their employees, contractors, agents, officers and directors, from 
              and against any and all claims, damages, obligations, losses, liabilities, costs 
              or debt, and expenses.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
            <p className="text-gray-600 mb-6">
              These Terms shall be interpreted and governed by the laws of the jurisdiction 
              in which HomeMaid operates, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to modify these Terms at any time. If we make material 
              changes, we will notify you by email or by posting a notice on our site prior 
              to the change becoming effective.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-gray-700">
                <strong>Email:</strong> ashok@homemaid.jaiswals.live<br />
                <strong>Website:</strong> homemaid.jaiswals.live<br />
                <strong>Company:</strong> HomeMaid by Jaiswals Family
              </p>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}<br />
                By using HomeMaid, you acknowledge that you have read and understood these 
                Terms of Use and agree to be bound by them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
