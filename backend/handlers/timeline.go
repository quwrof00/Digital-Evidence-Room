package handlers

import (
	"fmt"
	"net/http"
	"sort"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/gin-gonic/gin"
)

type TimelineEvent struct {
	ID              string `json:"id"`
	Date            string `json:"date"`
	Description     string `json:"description"`
	IsContradiction bool   `json:"isContradiction,omitempty"`
	SourceText      string `json:"sourceText,omitempty"`
}

func GetTimeline(c *gin.Context) {
	var user models.User
	if err := db.DB.First(&user, "email = ?", "sandbox@demo.com").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Dummy user not found"})
		return
	}

	var chunks []models.DocumentChunk
	if err := db.DB.Joins("Document").Where("\"Document\".user_id = ?", user.ID).Find(&chunks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chunks"})
		return
	}

	events := make([]TimelineEvent, 0)
	for _, chunk := range chunks {
		if chunk.DetectedDate == nil || *chunk.DetectedDate == "" {
			continue
		}
		events = append(events, TimelineEvent{
			ID:              chunk.ID.String(),
			Date:            *chunk.DetectedDate,
			Description:     generateDescription(chunk.Content),
			IsContradiction: chunk.IsContradiction,
			SourceText:      fmt.Sprintf("%s - %s", chunk.SourceFile, chunk.Content),
		})
	}

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
