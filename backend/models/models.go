package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system.
type User struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key"`
	Email     string     `gorm:"uniqueIndex;not null"`
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// BeforeCreate sets a UUID for User.
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

// Document represents an uploaded file.
type Document struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	User      User      `gorm:"foreignKey:UserID"`
	Filename  string    `gorm:"not null"`
	FileType  string    `gorm:"not null"` // e.g. 'pdf', 'csv', 'txt'
	Status    string    `gorm:"not null;default:'pending'"` // e.g. 'pending', 'uploading', 'chunking', 'completed', 'error'
	Progress  int       `gorm:"default:0"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// BeforeCreate sets a UUID for Document.
func (d *Document) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return
}

// DocumentChunk represents a chunk of the parsed document for later search/RAG.
type DocumentChunk struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key"`
	DocumentID       uuid.UUID `gorm:"type:uuid;not null"`
	Document         Document  `gorm:"foreignKey:DocumentID"`
	ChunkIndex       int       `gorm:"not null"`
	SourceFile       string    `gorm:"not null"`
	FileType         string    `gorm:"not null"`
	PageOrLineNumber *int      // Optional
	DetectedDate     *string   // Optional
	Content          string
	CreatedAt        time.Time
}

// BeforeCreate sets a UUID for DocumentChunk.
func (c *DocumentChunk) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
