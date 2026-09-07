package handlers

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/gin-gonic/gin"
)

// UploadFile handles receiving a file via multipart form
func UploadFile(c *gin.Context) {
	// 1. Parse the uploaded file from the "file" field
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	filename := header.Filename
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(filename), "."))

	// 2. Validate file type (Only PDF, CSV, TXT)
	if ext != "pdf" && ext != "csv" && ext != "txt" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only PDF, CSV, and TXT files are allowed"})
		return
	}

	// 3. Read the file into memory (limit to 10MB for safety during this demo)
	content, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// 4. Find our dummy Sandbox user
	var user models.User
	if err := db.DB.First(&user, "email = ?", "sandbox@demo.com").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dummy user not found"})
		return
	}

	// 5. Save the metadata to the PostgreSQL database via GORM
	doc := models.Document{
		UserID:   user.ID,
		Filename: filename,
		FileType: ext,
		Status:   "uploading",
		Progress: 0,
	}

	if err := db.DB.Create(&doc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save document metadata to DB"})
		return
	}

	// 6. Spin up a background "Goroutine" to process/chunk the file without blocking the response
	go simulateChunking(doc.ID, string(content))

	// 7. Immediately return the Document ID to the frontend
	c.JSON(http.StatusOK, gin.H{
		"message":     fmt.Sprintf("Successfully started processing %s", filename),
		"document_id": doc.ID,
	})
}

// simulateChunking simulates breaking a file into vector chunks for the database
func simulateChunking(docID interface{}, content string) {
	// Simulate the file being chunked over several seconds
	for i := 10; i <= 90; i += 20 {
		db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
			"status":   "chunking",
			"progress": i,
		})
		time.Sleep(1 * time.Second) // Pause for 1 second to simulate heavy lifting
	}
	
	// Mark as completed
	db.DB.Model(&models.Document{}).Where("id = ?", docID).Updates(map[string]interface{}{
		"status":   "completed",
		"progress": 100,
	})
	
	fmt.Printf("Finished processing document ID: %v\n", docID)
}
