import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const terms = [
  {
    title: '1. Purpose and scope',
    body: 'These Terms and Conditions are a draft legal framework for the ANTABAY QC commuter application. They govern the use of the commuter interface, including route browsing, live tracking, notifications, trip saving, support submissions, profile preferences, and other information features available through the app. This draft is intended for future review and approval before public deployment or legal acceptance by the appropriate government authority or transport operator.',
  },
  {
    title: '2. Prototype status',
    body: 'The application is currently a prototype and demonstration platform. It is not a live QC Bus account system, official service portal, emergency response channel, or an approved government transaction platform. Information shown in the prototype, including bus activity, route status, trip history, schedules, and notifications, is illustrative and should not be relied upon as real-time operational advice or official government communication.',
  },
  {
    title: '3. Use of the app',
    body: 'Users may access route and timetable information, use tracking tools, save trips, view service updates, and submit support or feedback information for testing and design review. Commuters must use the app responsibly and only for legitimate informational and service-feedback purposes. Any misuse, abusive behavior, false reports, or attempts to interfere with the system or other users may be restricted or reported to the responsible administrator in a future production environment.',
  },
  {
    title: '4. Service information disclaimer',
    body: 'Route maps, stop information, trip schedules, bus status, live tracking data, and notifications provided by the app may be estimates or demo data. They are not guaranteed to reflect actual operations, service disruptions, vehicle positions, or official transit decisions in real time. The system should not be treated as a binding schedule, legal service guarantee, or operational directive. Users should verify any critical travel information with the relevant official public transport authority or service operator before relying on it.',
  },
  {
    title: '5. User-submitted reports and content',
    body: 'Users may submit lost-item reports, incident reports, feedback forms, and related attachments through the app. These submissions are intended for testing, issue tracking, and service improvement activities. Submissions may be stored for internal review, troubleshooting, reporting, or future product design. The app must not be used to send emergency or urgent safety notices to real-time dispatch or law enforcement unless a proper production channel is in place. In a future official deployment, legal and operational processes must be created to respond to reports and to manage data retention, privacy, and accountability.',
  },
  {
    title: '6. Account, profile, and settings',
    body: 'Profile fields, saved routes, notification settings, and local app preferences may be stored on the device or in browser storage. These settings are not a formal government identity account and do not create a legal obligation, enforceable service contract, or official service membership. In a production rollout, proper authentication, authorization, session management, and access control must be implemented before personal or account-related data is treated as official records.',
  },
  {
    title: '7. Data and privacy obligations',
    body: 'This draft acknowledges that users provide personal or operational information when using the app, including profile information, trip data, contact details, support submissions, and other usage information. The system should process this information only for clearly defined purposes, with necessary security safeguards, appropriate data minimization, and user notice. A final legal version should align with applicable privacy laws and local government data protection requirements. This draft does not replace formal privacy review or approval.',
  },
  {
    title: '8. Intellectual property and system ownership',
    body: 'The ANTABAY QC application, interface design, branding, content, route information, and related materials may be owned by the project team, local government agency, or another designated rights holder. Users are granted a limited right to use the app for personal, non-commercial, informational purposes. Users may not copy, reverse engineer, redistribute, republish, or misuse the app or its content outside the permitted use defined by the final production licensing terms.',
  },
  {
    title: '9. Third-party services and external links',
    body: 'The app may use external services, fonts, mapping components, hosting infrastructure, or communication tools in the future. Any third-party service used must be clearly disclosed, and the relevant service providers must be reviewed for privacy, security, and data handling compliance. Users should be aware that external resources may be governed by separate terms of use and privacy policies.',
  },
  {
    title: '10. Availability and no guarantee of service',
    body: 'The application is provided on an “as is” and “as available” basis for demonstration and review purposes. The project team does not guarantee uninterrupted availability, accuracy of all route or status information, completeness of data, or suitability for any particular purpose. Service interruptions, bugs, or data inaccuracies may occur during testing and should not be treated as an official transit failure or legal claim against the responsible public agency.',
  },
  {
    title: '11. Limitation of liability',
    body: 'To the maximum extent permitted by law, the responsible project team, operator, or public authority should not be liable for incidental, indirect, consequential, or special damages arising from use of the app, including loss of time, travel inconvenience, missed trips, service errors, or reliance on inaccurate information. This draft does not determine the final liability position and should be reviewed by qualified legal and administrative counsel before adoption.',
  },
  {
    title: '12. Dispute resolution and governing law',
    body: 'A final version of these Terms and Conditions should identify the governing law, dispute resolution process, and responsible office for handling complaints or legal claims. This draft is intended to support future review and should be updated to reflect applicable local law, administrative procedures, and competent jurisdiction before public use.',
  },
  {
    title: '13. Policy updates and future review',
    body: 'These terms may be revised as the app develops, additional features are added, or legal requirements change. Any significant change should be communicated clearly to users, with the latest version date and any effective date stated in the policy. Before public release, the responsible government office, transport authority, and legal reviewers should approve the final text.',
  },
  {
    title: '14. Contact and approval',
    body: 'This draft should be reviewed and approved by the responsible QC government office, transport operations unit, and legal representatives before any public launch. A final version should identify the designated contact point for questions, user complaints, and policy inquiries relating to app use, protection of personal data, and service operations.',
  },
]

export default function TermsConditions() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Terms & Conditions"
        description="Draft terms for the Antabay QC commuter prototype."
        actions={(
          <Link to="/commuter/settings" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:border-slate-200">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        )}
      />

      <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileText size={19} />
          </span>
          <h2 className="text-lg font-black text-navy">Terms & Conditions</h2>
        </div>

        <div className="space-y-4">
          {terms.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-slate-300 bg-white p-3 md:border-slate-200 md:bg-slate-50">
              <h3 className="text-sm font-bold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Prototype draft only. This is not an approved QC Government or QC Bus legal notice. Replace it with reviewed, organization-approved legal text before public use.
        </p>
      </section>
    </div>
  )
}
