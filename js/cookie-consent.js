// Cookie Consent Banner
// Shows disclaimer about cookie usage and data storage

class CookieConsent {
    constructor() {
        this.consentGiven = StorageManager.hasAcceptedCookies();
        if (!this.consentGiven) {
            this.showBanner();
        } else {
            // If consent already given, perform migration if needed
            this.performMigration();
        }
    }

    showBanner() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'cookie-consent-overlay';
        overlay.innerHTML = `
            <div class="cookie-consent-modal">
                <div class="cookie-consent-header">
                    <h2>📚 Welcome to My Library!</h2>
                </div>
                <div class="cookie-consent-content">
                    <p><strong>Before you start building your library, please note:</strong></p>

                    <div class="consent-section">
                        <h3>🍪 How We Store Your Data</h3>
                        <p>This application stores your book library data using <strong>browser cookies</strong> that expire after <strong>1 year</strong>.</p>
                    </div>

                    <div class="consent-section">
                        <h3>⚠️ Important Information</h3>
                        <ul>
                            <li>Your data is stored <strong>locally on your device only</strong></li>
                            <li>We do not send your data to any servers or cloud storage</li>
                            <li>Clearing your browser cookies will <strong>delete all your library data</strong></li>
                            <li>Data is <strong>not automatically backed up</strong></li>
                            <li>Cookies expire after 1 year and will need to be refreshed</li>
                        </ul>
                    </div>

                    <div class="consent-section">
                        <h3>💾 Recommendation</h3>
                        <p>We recommend regularly <strong>exporting your library</strong> as a CSV file to keep a backup of your data.</p>
                    </div>

                    <div class="consent-section privacy-section">
                        <h3>🔒 Privacy</h3>
                        <p>We respect your privacy. No personal data is collected or transmitted. Your library stays with you.</p>
                    </div>
                </div>
                <div class="cookie-consent-footer">
                    <button id="accept-cookies" class="consent-button accept">
                        I Understand - Let's Build My Library
                    </button>
                    <button id="decline-cookies" class="consent-button decline">
                        No Thanks
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add event listeners
        document.getElementById('accept-cookies').addEventListener('click', () => {
            this.acceptConsent();
        });

        document.getElementById('decline-cookies').addEventListener('click', () => {
            this.declineConsent();
        });
    }

    acceptConsent() {
        StorageManager.acceptCookies();
        this.performMigration();
        this.removeBanner();
    }

    declineConsent() {
        alert('To use My Library, you must accept cookie storage. Your data will only be stored on your device.');
    }

    performMigration() {
        // Attempt migration from localStorage if there's old data
        const result = StorageManager.migrateFromLocalStorage();
        if (result.success && !result.alreadyMigrated && result.migratedCount > 0) {
            console.log(`Successfully migrated ${result.migratedCount} items from localStorage to cookies`);
        }
    }

    removeBanner() {
        const overlay = document.getElementById('cookie-consent-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new CookieConsent();
});
