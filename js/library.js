// Library Page Vue Application

const { createApp } = Vue;

createApp({
    data() {
        return {
            books: [],
            searchQuery: '',
            sortBy: 'dateAdded',
            viewMode: 'grid', // 'grid' or 'list'
            selectedBook: null,
            showConfirmDialog: false,
            confirmMessage: '',
            confirmSubtext: '',
            deleteTarget: null,
            deleteType: '' // 'single' or 'all'
        };
    },
    computed: {
        filteredBooks() {
            let filtered = [...this.books];

            // Search filter
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(book =>
                    book.name.toLowerCase().includes(query) ||
                    book.author.toLowerCase().includes(query)
                );
            }

            // Sort
            filtered.sort((a, b) => {
                switch (this.sortBy) {
                    case 'dateAdded':
                        return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
                    case 'dateAddedOld':
                        return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
                    case 'title':
                        return a.name.localeCompare(b.name);
                    case 'titleDesc':
                        return b.name.localeCompare(a.name);
                    case 'author':
                        return a.author.localeCompare(b.author);
                    default:
                        return 0;
                }
            });

            return filtered;
        }
    },
    mounted() {
        this.loadBooks();

        // Load saved view preference
        const savedView = StorageManager.getCookie('library_view_mode');
        if (savedView) {
            this.viewMode = savedView;
        }
    },
    watch: {
        viewMode(newMode) {
            // Save view preference
            StorageManager.setCookie('library_view_mode', newMode);
        }
    },
    methods: {
        loadBooks() {
            this.books = [];
            const allBooks = StorageManager.getAllBooks();

            allBooks.forEach((book) => {
                this.books.push({
                    index: book.index,
                    name: book.title || 'Unknown Title',
                    author: book.author || 'Unknown Author',
                    image: book.thumb || 'images/nocover.jpg',
                    genre: book.genre || 'Unknown',
                    publish: book.publish || 'Unknown',
                    dateAdded: book.dateAdded || null
                });
            });

            console.log(`Loaded ${this.books.length} books`);
        },
        showPopup(book) {
            this.selectedBook = book;
        },
        closePopup() {
            this.selectedBook = null;
        },
        formatDate(dateString) {
            if (!dateString) return 'Unknown';

            try {
                const date = new Date(dateString);
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                return date.toLocaleDateString('en-US', options);
            } catch (e) {
                return 'Unknown';
            }
        },
        confirmDelete(book) {
            this.deleteTarget = book;
            this.deleteType = 'single';
            this.confirmMessage = `Delete "${book.name}"?`;
            this.confirmSubtext = 'This action cannot be undone.';
            this.showConfirmDialog = true;
        },
        confirmDeleteAll() {
            if (this.books.length === 0) {
                alert('Your library is already empty!');
                return;
            }

            this.deleteType = 'all';
            this.confirmMessage = 'Delete All Books?';
            this.confirmSubtext = `This will permanently delete all ${this.books.length} books from your library. This action cannot be undone.`;
            this.showConfirmDialog = true;
        },
        executeDelete() {
            if (this.deleteType === 'single' && this.deleteTarget) {
                this.deleteSingleBook(this.deleteTarget);
            } else if (this.deleteType === 'all') {
                this.deleteAllBooks();
            }

            this.cancelDelete();
        },
        deleteSingleBook(book) {
            // Delete the book using StorageManager
            StorageManager.deleteBook(book.index);

            // Compact storage to remove gaps
            StorageManager.compactBooks();

            // Reload books
            this.loadBooks();

            // Close popup if it was open
            this.selectedBook = null;

            console.log(`Deleted book: ${book.name}`);
        },
        deleteAllBooks() {
            // Delete all books
            StorageManager.deleteAllBooks();

            // Reload books (will be empty)
            this.loadBooks();

            console.log('Deleted all books');
        },
        cancelDelete() {
            this.showConfirmDialog = false;
            this.deleteTarget = null;
            this.deleteType = '';
            this.confirmMessage = '';
            this.confirmSubtext = '';
        },
        exportToCSV() {
            if (this.books.length === 0) {
                alert('Your library is empty. Nothing to export!');
                return;
            }

            try {
                // Create CSV content
                const headers = ['Title', 'Author', 'Genre', 'Published', 'Image URL', 'Date Added'];
                const csvRows = [headers.join(',')];

                this.books.forEach(book => {
                    const row = [
                        this.escapeCSV(book.name),
                        this.escapeCSV(book.author),
                        this.escapeCSV(book.genre),
                        this.escapeCSV(book.publish),
                        this.escapeCSV(book.image),
                        this.escapeCSV(book.dateAdded || '')
                    ];
                    csvRows.push(row.join(','));
                });

                const csvContent = csvRows.join('\n');

                // Create download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                const filename = `my-library-${new Date().toISOString().split('T')[0]}.csv`;

                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log(`Exported ${this.books.length} books to ${filename}`);
                alert(`Successfully exported ${this.books.length} books!`);
            } catch (error) {
                console.error('Export error:', error);
                alert('Failed to export library. Please try again.');
            }
        },
        escapeCSV(value) {
            if (value === null || value === undefined) return '';

            const stringValue = String(value);

            // If the value contains comma, newline, or double quote, wrap it in quotes
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                // Escape double quotes by doubling them
                return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        },
        triggerImport() {
            // Trigger the hidden file input
            this.$refs.csvFileInput.click();
        },
        importFromCSV(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.name.endsWith('.csv')) {
                alert('Please select a valid CSV file.');
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const rows = content.split('\n').map(row => row.trim()).filter(row => row);

                    if (rows.length < 2) {
                        alert('CSV file is empty or invalid.');
                        return;
                    }

                    // Parse CSV
                    const headers = this.parseCSVRow(rows[0]);
                    const books = [];

                    for (let i = 1; i < rows.length; i++) {
                        const values = this.parseCSVRow(rows[i]);

                        if (values.length >= 4) { // At least title, author, genre, published
                            books.push({
                                title: values[0] || 'Unknown',
                                author: values[1] || 'Unknown',
                                genre: values[2] || 'Unknown',
                                publish: values[3] || 'Unknown',
                                thumb: values[4] || 'images/nocover.jpg',
                                dateAdded: values[5] || new Date().toISOString()
                            });
                        }
                    }

                    if (books.length === 0) {
                        alert('No valid books found in CSV file.');
                        return;
                    }

                    // Ask user about merge or replace
                    const action = this.books.length > 0
                        ? confirm(`You have ${this.books.length} books in your library.\n\nClick OK to MERGE (add ${books.length} new books)\nClick Cancel to REPLACE your entire library with ${books.length} imported books`)
                        : true;

                    if (action === false && this.books.length > 0) {
                        // Replace: Delete all existing books first
                        if (!confirm('Are you sure you want to REPLACE your entire library? This will delete all current books!')) {
                            return;
                        }
                        StorageManager.deleteAllBooks();
                    }

                    // Import books
                    let currentIndex = StorageManager.getBookCount();
                    let importedCount = 0;
                    let duplicateCount = 0;

                    books.forEach(book => {
                        // Check for duplicates
                        const isDuplicate = this.books.some(existingBook =>
                            existingBook.name === book.title && existingBook.author === book.author
                        );

                        if (!isDuplicate) {
                            currentIndex++;
                            StorageManager.setBook(currentIndex, book);
                            importedCount++;
                        } else {
                            duplicateCount++;
                        }
                    });

                    StorageManager.setBookCount(currentIndex);

                    // Reload books
                    this.loadBooks();

                    let message = `Successfully imported ${importedCount} books!`;
                    if (duplicateCount > 0) {
                        message += `\n${duplicateCount} duplicates were skipped.`;
                    }

                    alert(message);
                    console.log(`Imported ${importedCount} books, skipped ${duplicateCount} duplicates`);
                } catch (error) {
                    console.error('Import error:', error);
                    alert('Failed to import CSV file. Please check the file format and try again.');
                }
            };

            reader.onerror = () => {
                alert('Failed to read file. Please try again.');
            };

            reader.readAsText(file);

            // Reset file input
            event.target.value = '';
        },
        parseCSVRow(row) {
            const values = [];
            let currentValue = '';
            let insideQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                const nextChar = row[i + 1];

                if (char === '"') {
                    if (insideQuotes && nextChar === '"') {
                        // Escaped quote
                        currentValue += '"';
                        i++; // Skip next quote
                    } else {
                        // Toggle quote state
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    // End of value
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }

            // Add last value
            values.push(currentValue);

            return values;
        }
    }
}).mount('#app');
