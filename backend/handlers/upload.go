package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"
	"digital-evidence-room-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadFile handles receiving multiple files via multipart form
func UploadFile(c *gin.Context) {
	// 1. Parse the multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	// 2. Get the files from the "files" field
	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	userID := c.PostForm("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	caseIDStr := c.PostForm("case_id")
	var caseRecord models.Case

	if caseIDStr != "" {
		// Append to existing case
		if err := db.DB.First(&caseRecord, "id = ? AND user_id = ?", caseIDStr, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
	} else {
		// Create new case
		caseRecord = models.Case{
			UserID: userID,
			Name:   "New Case",
		}
		if err := db.DB.Create(&caseRecord).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create case"})
			return
		}
	}

	var documentIDs []uuid.UUID
	var processedFiles []string
	var errors []string

	// 3. Process each file
	for _, fileHeader := range files {
		docID, err := processSingleFile(fileHeader, caseRecord.ID)
		if err != nil {
			errors = append(errors, err.Error())
			continue
		}

		documentIDs = append(documentIDs, docID)
		processedFiles = append(processedFiles, fileHeader.Filename)
	}

	// Return the results
	c.JSON(http.StatusOK, gin.H{
		"message":      fmt.Sprintf("Successfully started processing %d files", len(processedFiles)),
		"case_id":      caseRecord.ID,
		"document_ids": documentIDs,
		"errors":       errors,
	})
}

// processSingleFile validates the file, saves metadata to DB, and starts the chunking goroutine.
func processSingleFile(fileHeader *multipart.FileHeader, caseID uuid.UUID) (uuid.UUID, error) {
	filename := fileHeader.Filename
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(filename), "."))

	// Validate file type
	if ext != "pdf" && ext != "csv" && ext != "txt" {
		return uuid.Nil, fmt.Errorf("%s: Only PDF, CSV, and TXT files are allowed", filename)
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: Failed to open file", filename)
	}
	defer file.Close()

	// Read the file into memory
	content, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: Failed to read file", filename)
	}

	// Save the metadata to the PostgreSQL database
	doc := models.Document{
		CaseID:   caseID,
		Filename: filename,
		FileType: ext,
		Status:   "uploading",
		Progress: 0,
	}

	if err := db.DB.Create(&doc).Error; err != nil {
		return uuid.Nil, fmt.Errorf("%s: Failed to save metadata", filename)
	}

	// Spin up a background "Goroutine" for the heavy lifting parsing
	go services.ParseDocument(doc.ID, caseID, filename, ext, content)

	return doc.ID, nil
}
