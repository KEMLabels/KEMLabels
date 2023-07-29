import React from 'react'
import PageLayout from '../components/PageLayout'

function TermsAndConditions() {
    return (
        <PageLayout title="Terms and Conditions">
        <div style={{padding:'0 5em'}}>
            <h1>Effective Date: July 29, 2023</h1>

            <p>Welcome to LabelMaster! By using our website, mobile applications, and services, you agree to these Terms and Conditions. Please review them before using our services.</p>

            <h1>Use of Services:</h1>
            <ol>
                <li>Age Requirement: You must be at least 18 years old to use our services.</li>
                <li> Account: If needed, you may create an account. Keep your login details secure and do not share them.</li>
                <li>Respectful Use: Use our services responsibly and refrain from posting offensive or harmful content.</li>
            </ol>

            <h1>Content:</h1>
            <ol>
                <li>Your Content: By submitting content, you grant LabelMaster permission to use it for our services.</li>
                <li>Prohibited Content: Do not submit content that violates laws or others' rights.</li>
            </ol>

            <h1>Third-Party Links:</h1>
            <p>We are not responsible for third-party websites or services linked from our site.</p>

            <h1>Liability:</h1>

            <p>We strive to provide accurate and reliable services, but we cannot guarantee everything. LabelMaster is not liable for any damages resulting from using our services.</p>

            <h1>Indemnification:</h1>
            <p>You agree to hold LabelMaster harmless from any claims or losses due to your use of our services.</p>

            <h1>Governing Law:</h1>
            <p>These Terms are governed by the laws of Canada.</p>
            <br></br>
            <p>By using LabelMaster services, you accept these Terms and Conditions. If you have any questions, contact us at [contact email/phone number].</p>
        </div>
        </PageLayout>
    )
}

export default TermsAndConditions