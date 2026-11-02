import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const privacySections = [
  {
    title: '1. Introduction and purpose',
    body: 'This Privacy Policy is a draft policy for the ANTABAY QC commuter application, designed to explain how personal information may be collected, used, stored, and protected when commuters use route information, live tracking, notifications, trip history, support forms, and account-related features. This draft is intended for future review and implementation before public release and should be validated by the responsible QC local government or transport office before launch.',
  },
  {
    title: '2. Scope of this draft policy',
    body: 'This version applies to the commuter-facing features of the ANTABAY QC system, including profile setup, route browsing, trip tracking, service notifications, lost-item reports, incident reports, feedback submissions, and settings. It covers information collected directly from commuters through the app, information stored locally in the browser, and information processed on the server or administrative side in a future production implementation.',
  },
  {
    title: '3. Information we may collect',
    body: 'The prototype may collect and process commuter profile information such as name, email address, phone number, preferred route or trip details, saved trip records, support request details, feedback text, attachments uploaded with incident or lost-item reports, timestamps, alert preferences, device-related metadata, and session information necessary for authentication and app use. In a production environment, this information should be limited to what is necessary for the stated purposes and reviewed for lawful basis and retention requirements.',
  },
  {
    title: '4. How information is used',
    body: 'Information is used to provide route visibility, service notifications, trip planning, account access, support workflows, lost-item coordination, safety reporting, route feedback analysis, and system administration. The information may also be used to improve service operations, detect disruptions, respond to commuter concerns, track recurring issues, and support compliance, security, and operational reporting. Personal data should not be used for unrelated purposes without clear notice and lawful basis.',
  },
  {
    title: '5. Local browser storage and device data',
    body: 'This prototype stores selected commuter profile fields and preferences in the browser using local storage and session storage. This may include name, email, route preferences, notification settings, session mode, and UI state. The app does not store passwords in browser storage, and sign-in credentials should be handled through a secure authentication system in production. If a commuter clears browser data, saved local preferences may be removed and the user may need to sign in again.',
  },
  {
    title: '6. Forms, attachments, and submitted content',
    body: 'Support forms such as lost-item reports, incident reports, and feedback may include written descriptions, screenshots, selected files, route or stop references, and related metadata. These materials may be used to investigate reported issues or improve service quality. Uploaded attachments should be restricted to approved file types, scanned for malware, and retained only for the period necessary for the support process or legal compliance. A system should also provide a clear way for commuters to request correction or deletion of their submitted information where required.',
  },
  {
    title: '7. Location and tracking information',
    body: 'This prototype does not currently request continuous device location access. If location-based features are added in the future, the app should explain precisely what location data is being used, whether it is processed on-device or sent to a server, whether it is optional or required, and how long it is retained. Any future location feature must be clearly consent-based and should avoid collecting more location information than necessary.',
  },
  {
    title: '8. Notifications and communication',
    body: 'Notifications may be delivered to commuters about service disruptions, route updates, safety alerts, account activity, and support follow-ups. The system may use contact details such as email or in-app alerts to notify commuters. Communication preferences should be configurable and should allow users to choose which alerts they wish to receive. Users should also be able to opt out of non-essential notifications where legally and operationally feasible.',
  },
  {
    title: '9. Data sharing and disclosure',
    body: 'In a production system, personal data should only be shared with authorized QC officials, transport operations staff, support personnel, or system administrators who need it to perform their duties. Information should not be sold or used for unrelated marketing purposes. Any sharing with third-party service providers, analytics tools, hosting providers, or cloud vendors should be clearly disclosed, subject to contractual safeguards, and limited to the minimum necessary for service delivery.',
  },
  {
    title: '10. Data retention and deletion',
    body: 'This prototype does not yet define final retention periods. A future production policy should set clear rules for how long submitted support information, notification logs, account records, and trip history will be kept. Retention should depend on operational need, audit obligations, legal requirements, and the purpose for which the data was collected. Deleted data should be removed securely and the system should allow lawful requests to correct or erase personal information where applicable.',
  },
  {
    title: '11. Security measures',
    body: 'ANTABAY QC should implement reasonable technical and organizational safeguards to protect commuter information from unauthorized access, disclosure, alteration, or loss. These may include encrypted storage and transmission, role-based access control, secure authentication, monitoring for suspicious activity, restricted employee access, data minimization, and regular reviews of system security. This prototype is not a complete production security implementation and should be reviewed further before deployment.',
  },
  {
    title: '12. Children and vulnerable persons',
    body: 'The system should avoid collecting unnecessary personal information from minors or other vulnerable users unless there is a clear and lawful basis for doing so. If the service is later used by young commuters or vulnerable riders, additional safeguards should be introduced regarding consent, parental or guardian involvement, and access to personal data where required by law.',
  },
  {
    title: '13. Your rights and choices',
    body: 'Commuters should have a clear way to review, update, or remove their profile details, manage notification preferences, request access to stored information, and ask for correction or deletion where appropriate. A future production app should include a process for handling data access requests, complaints, or concerns about privacy practices and should respond within a defined time period in line with local law and policy requirements.',
  },
  {
    title: '14. Cookies, analytics, and third-party services',
    body: 'This prototype does not currently use advertising cookies or analytics trackers. If analytics, crash reporting, or other third-party services are added later, they should be disclosed in this policy, configured to collect only necessary data, and managed in line with approved vendor contracts and privacy risk assessments.',
  },
  {
    title: '15. Policy updates',
    body: 'This draft policy may be updated as the system evolves, new features are added, or legal or administrative requirements change. Any material change should be communicated to commuters in advance, and the app should provide a visible record of the latest policy version and effective date.',
  },
  {
    title: '16. Contact and oversight',
    body: 'The responsible office or data owner for this system should be clearly identified in a final public version of this policy, together with a designated privacy contact or complaint channel. The office responsible for operations, records, and data protection should review this draft periodically to ensure compliance with laws, operational responsibilities, and public accountability standards.',
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Privacy"
        description="What the commuter prototype stores and sends."
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
            <ShieldCheck size={19} />
          </span>
          <h2 className="text-lg font-black text-navy">Privacy</h2>
        </div>

        <div className="space-y-4">
          {privacySections.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-slate-300 bg-white p-3 md:border-slate-200 md:bg-slate-50">
              <h3 className="text-sm font-bold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Prototype information only. This is not an approved QC Government or QC Bus privacy notice. Have the responsible office review and replace it before public use.
        </p>
      </section>
    </div>
  )
}
