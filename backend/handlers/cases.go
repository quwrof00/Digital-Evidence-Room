package handlers

import (
	"net/http"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/models"

	"github.com/gin-gonic/gin"
)

func GetCases(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var cases []models.Case
	if err := db.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cases"})
		return
	}

	c.JSON(http.StatusOK, cases)
}
