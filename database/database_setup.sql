USE smartshelf_db;

CREATE TABLE Users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM('student', 'lecturer', 'librarian', 'admin')
        NOT NULL,

    student_id VARCHAR(50) UNIQUE,
    email_verified_at DATETIME NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    announcement_notifications_enabled
        BOOLEAN NOT NULL DEFAULT TRUE,

    created_by INT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by)
        REFERENCES Users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_student_id
        CHECK (
            (role = 'student' AND student_id IS NOT NULL)
            OR role <> 'student'
        )
) ENGINE=InnoDB;

CREATE TABLE Books (
    book_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    authors VARCHAR(500) NOT NULL,
    publisher VARCHAR(150),
    publication_year YEAR,
    edition VARCHAR(50),
    language VARCHAR(50),
    description TEXT,
    cover_image_url VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;

CREATE TABLE BookCopies (
    copy_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    book_id INT UNSIGNED NOT NULL,
    accession_number VARCHAR(50) NOT NULL UNIQUE,
    shelf_location VARCHAR(100),

    status ENUM(
        'available',
        'reserved',
        'borrowed',
        'damaged',
        'lost'
    ) NOT NULL DEFAULT 'available',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_copies_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE Subjects (
    subject_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_name VARCHAR(150) NOT NULL UNIQUE,
    subject_code VARCHAR(30) UNIQUE,
    description TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;

CREATE TABLE Topics (
    topic_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_id INT UNSIGNED NOT NULL,
    topic_name VARCHAR(150) NOT NULL,
    description TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_topic_subject
        UNIQUE (subject_id, topic_name),

    CONSTRAINT fk_topics_subject
        FOREIGN KEY (subject_id)
        REFERENCES Subjects(subject_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE BookTopics (
    book_id INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,

    relevance_description TEXT,

    PRIMARY KEY (book_id, topic_id),

    CONSTRAINT fk_booktopics_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_booktopics_topic
        FOREIGN KEY (topic_id)
        REFERENCES Topics(topic_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB;


CREATE TABLE LecturerRecommendations (
    recommendation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    lecturer_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,

    explanation TEXT NOT NULL,
    relevant_chapters TEXT,

    difficulty_level ENUM(
        'beginner',
        'intermediate',
        'advanced',
        'all_levels'
    ) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_recommendations_lecturer
        FOREIGN KEY (lecturer_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_recommendations_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_recommendations_topic
        FOREIGN KEY (topic_id)
        REFERENCES Topics(topic_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE BookRatings (
    rating_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,

    rating TINYINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_book_topic_rating
        UNIQUE (student_id, book_id, topic_id),

    CONSTRAINT chk_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_ratings_student
        FOREIGN KEY (student_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_ratings_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_ratings_topic
        FOREIGN KEY (topic_id)
        REFERENCES Topics(topic_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE BookReviews (
    review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,

    review_text TEXT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_student_book_topic_review
        UNIQUE (student_id, book_id, topic_id),

    CONSTRAINT fk_reviews_student
        FOREIGN KEY (student_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviews_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviews_topic
        FOREIGN KEY (topic_id)
        REFERENCES Topics(topic_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE Reservations (
    reservation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    copy_id INT UNSIGNED NULL,

    status ENUM(
        'pending',
        'waiting',
        'ready_for_pickup',
        'completed',
        'expired',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ready_at DATETIME NULL,
    pickup_deadline DATETIME NULL,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservations_student
        FOREIGN KEY (student_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reservations_book
        FOREIGN KEY (book_id)
        REFERENCES Books(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_reservations_copy
        FOREIGN KEY (copy_id)
        REFERENCES BookCopies(copy_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB;

CREATE TABLE Borrowings (
    borrowing_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id INT UNSIGNED NOT NULL,
    copy_id INT UNSIGNED NOT NULL,
    reservation_id INT UNSIGNED NULL,

    issued_by INT UNSIGNED NOT NULL,
    returned_by INT UNSIGNED NULL,

    borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    returned_at DATETIME NULL,

    renewal_count TINYINT UNSIGNED NOT NULL DEFAULT 0,

    status ENUM(
        'borrowed',
        'returned',
        'overdue',
        'lost'
    ) NOT NULL DEFAULT 'borrowed',

    incident_notes TEXT NULL,
    incident_recorded_by INT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_borrowings_reservation
        UNIQUE (reservation_id),

    CONSTRAINT fk_borrowings_student
        FOREIGN KEY (student_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_borrowings_copy
        FOREIGN KEY (copy_id)
        REFERENCES BookCopies(copy_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_borrowings_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES Reservations(reservation_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_borrowings_issued_by
        FOREIGN KEY (issued_by)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_borrowings_returned_by
        FOREIGN KEY (returned_by)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_borrowings_incident_recorded_by
        FOREIGN KEY (incident_recorded_by)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_borrowings_renewal_count
        CHECK (renewal_count <= 1),

    INDEX idx_borrowings_student_status (student_id, status),
    INDEX idx_borrowings_due_date (due_date)

) ENGINE=InnoDB;

CREATE TABLE Notifications (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    notification_type ENUM(
        'reservation',
        'borrowing',
        'return',
        'overdue',
        'announcement',
        'system'
    ) NOT NULL,

    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,

    related_type VARCHAR(50) NULL,
    related_id INT UNSIGNED NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_notifications_user_read (user_id, is_read),
    INDEX idx_notifications_created_at (created_at)

) ENGINE=InnoDB;

CREATE TABLE AIConversations (
    conversation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    conversation_title VARCHAR(200) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_conversations_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_ai_conversations_user (user_id)

) ENGINE=InnoDB;CREATE TABLE AIConversations (
    conversation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    conversation_title VARCHAR(200) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_conversations_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_ai_conversations_user (user_id)

) ENGINE=InnoDB;

CREATE TABLE AIChatMessages (
    message_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    conversation_id INT UNSIGNED NOT NULL,

    sender ENUM('user', 'assistant') NOT NULL,

    message_text TEXT NOT NULL,

    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_chat_messages_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES AIConversations(conversation_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_ai_chat_messages_conversation (conversation_id, sent_at)

) ENGINE=InnoDB;

CREATE TABLE Announcements (
    announcement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    librarian_id INT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    announcement_type ENUM(
        'general',
        'opening_hours',
        'closure',
        'new_arrivals',
        'event'
    ) NOT NULL DEFAULT 'general',

    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_announcements_librarian
        FOREIGN KEY (librarian_id)
        REFERENCES Users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_announcements_active (is_active, published_at)

) ENGINE=InnoDB;