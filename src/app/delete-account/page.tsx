export const metadata = { title: 'Delete your SALA account', robots: { index: true, follow: true } };

/** Public page required by app stores: explains how users delete their account and data. */
export default function DeleteAccount() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1>Delete your SALA account</h1>
      <p>You can delete your account and personal data at any time from inside the app:</p>
      <ol><li>Open the SALA app and go to <b>Profile</b>.</li><li>Tap <b>Delete account</b> and confirm.</li></ol>
      <h2>What is deleted</h2>
      <p>Your profile (name, age, phone number), reading progress, saved items, channel subscriptions and notification tokens are permanently deleted straight away.</p>
      <h2>What we keep</h2>
      <p>A minimal record that a deletion request occurred (without your personal details) may be kept for security and legal reasons.</p>
      <p className="help">Can&apos;t open the app? Contact the SALA support address published on our store listing and we will delete the account for you.</p>
    </main>
  );
}
