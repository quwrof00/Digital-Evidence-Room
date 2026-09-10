package handlers

import (
	"fmt"
	"net/http"
	"sort"
	"strings"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/gin-gonic/gin"
)

// TimelineEvent represents what the frontend expects
type TimelineEvent struct {
	ID              string `json:"id"`
	Date            string `json:"date"`
	Description     string `json:"description"`
	IsContradiction bool   `json:"isContradiction,omitempty"`
	SourceText      string `json:"sourceText,omitempty"`
}

// GetTimeline fetches the chunks and builds the timeline
func GetTimeline(c *gin.Context) {
	// 1. Get the dummy user
	var user models.User
	if err := db.DB.First(&user, "email = ?", "sandbox@demo.com").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dummy user not found"})
		return
	}

	// 2. Fetch all DocumentChunks for this user's documents
	// In a real app, you would filter by a specific Case ID or Document IDs
	var chunks []models.DocumentChunk
	if err := db.DB.Joins("Document").Where("\"Document\".user_id = ?", user.ID).Find(&chunks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chunks"})
		return
	}

	// 3. Filter chunks that have a DetectedDate (since it's a timeline)
	var events []TimelineEvent
	
	// Mock logic: we will flag any event containing "never" or "didn't" as a contradiction
	// just so we have some visual flair on the frontend until we add a real LLM.
	
	for _, chunk := range chunks {
		if chunk.DetectedDate != nil && *chunk.DetectedDate != "" {
			
			desc := generateDescription(chunk.Content)
			isContradiction := detectContradiction(chunk.Content)

			events = append(events, TimelineEvent{
				ID:              chunk.ID.String(),
				Date:            *chunk.DetectedDate,
				Description:     desc,
				IsContradiction: isContradiction,
				SourceText:      fmt.Sprintf("%s - %s", chunk.SourceFile, chunk.Content),
			})
		}
	}

	// 4. Sort the events by Date (basic string sort for now)
	sort.Slice(events, func(i, j int) bool {
		return events[i].Date < events[j].Date
	})

	c.JSON(http.StatusOK, events)
}

func generateDescription(content string) string {
	if len(content) > 80 {
		return content[:77] + "..."
	}
	return content
}

func detectContradiction(content string) bool {
	lowerContent := strings.ToLower(content)
	return strings.Contains(lowerContent, "never") || 
	       strings.Contains(lowerContent, "didn't") || 
	       strings.Contains(lowerContent, "not")
}
