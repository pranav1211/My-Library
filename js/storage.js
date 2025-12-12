// Storage utility for managing cookies with 1-year expiration
// This replaces localStorage with cookies for better data persistence

const StorageManager = {
    // Cookie expiration: 1 year from now
    EXPIRATION_DAYS: 365,

    // Get expiration date string
    getExpirationDate() {
        const date = new Date();
        date.setTime(date.getTime() + (this.EXPIRATION_DAYS * 24 * 60 * 60 * 1000));
        return date.toUTCString();
    },

    // Set a cookie
    setCookie(name, value) {
        const expires = this.getExpirationDate();
        // Encode the value to handle special characters
        const encodedValue = encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : value);
        document.cookie = `${name}=${encodedValue}; expires=${expires}; path=/; SameSite=Strict`;
    },

    // Get a cookie by name
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
                // Try to parse as JSON, otherwise return as string
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
        }
        return null;
    },

    // Delete a cookie
    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },

    // Get all cookies with a specific prefix
    getAllCookiesWithPrefix(prefix) {
        const cookies = {};
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(prefix) === 0) {
                const equalIndex = c.indexOf('=');
                if (equalIndex > 0) {
                    const name = c.substring(0, equalIndex);
                    const value = this.getCookie(name);
                    cookies[name] = value;
                }
            }
        }
        return cookies;
    },

    // Migration function: Move data from localStorage to cookies
    migrateFromLocalStorage() {
        try {
            // Check if migration has already been done
            if (this.getCookie('migration_complete')) {
                return { success: true, alreadyMigrated: true };
            }

            let migratedCount = 0;

            // Migrate all localStorage items
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);

                // Store in cookie
                this.setCookie(key, value);
                migratedCount++;
            }

            // Mark migration as complete
            this.setCookie('migration_complete', 'true');

            // Clear localStorage after successful migration
            localStorage.clear();

            return { success: true, migratedCount, alreadyMigrated: false };
        } catch (error) {
            console.error('Migration failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if user has accepted cookie policy
    hasAcceptedCookies() {
        return this.getCookie('cookie_consent') === 'accepted';
    },

    // Set cookie consent
    acceptCookies() {
        this.setCookie('cookie_consent', 'accepted');
    },

    // Get number of books
    getBookCount() {
        const count = this.getCookie('noofbooks');
        return count ? parseInt(count) : 0;
    },

    // Set number of books
    setBookCount(count) {
        this.setCookie('noofbooks', count.toString());
    },

    // Get a specific book
    getBook(index) {
        return this.getCookie(`book${index}`);
    },

    // Set a specific book
    setBook(index, bookData) {
        this.setCookie(`book${index}`, bookData);
    },

    // Delete a specific book
    deleteBook(index) {
        this.deleteCookie(`book${index}`);
    },

    // Get all books
    getAllBooks() {
        const bookCount = this.getBookCount();
        const books = [];
        for (let i = 1; i <= bookCount; i++) {
            const book = this.getBook(i);
            if (book) {
                books.push({ ...book, index: i });
            }
        }
        return books;
    },

    // Delete all books
    deleteAllBooks() {
        const bookCount = this.getBookCount();
        for (let i = 1; i <= bookCount; i++) {
            this.deleteBook(i);
        }
        this.setBookCount(0);
    },

    // Compact book storage (remove gaps in numbering)
    compactBooks() {
        const books = this.getAllBooks();
        // Delete all current books
        const oldCount = this.getBookCount();
        for (let i = 1; i <= oldCount; i++) {
            this.deleteBook(i);
        }

        // Re-add books with sequential numbering
        books.forEach((book, index) => {
            const bookData = { ...book };
            delete bookData.index; // Remove index property
            this.setBook(index + 1, bookData);
        });

        this.setBookCount(books.length);
        return books.length;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
