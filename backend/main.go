package main

import (
	"log"

	"digital-evidence-room-backend/db"
	"digital-evidence-room-backend/handlers"
	"digital-evidence-room-backend/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file from the parent directory or current directory
	err := godotenv.Load("../.env", ".env")
	if err != nil {
		log.Println("Note: No .env file found, relying on system environment variables.")
	}

	// Initialize the database connection & Auto-Migrate schema
	db.Init()

	// Initialize the Gin router
	r := gin.Default()

	// Add CORS middleware to allow Next.js (port 3000) to hit our API
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Simple health check endpoint
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
			"status":  "Go Backend is running!",
		})
	})

	// File Upload Endpoint
	r.POST("/upload", handlers.UploadFile)

	// Start the WebSocket Hub
	go services.WsHub.Run()

	// WebSocket Endpoint
	r.GET("/ws", handlers.ServeWs)

	// Timeline Endpoint
	r.GET("/timeline", handlers.GetTimeline)

	// Run the server on port 8080
	log.Println("Starting server on :8080...")
	r.Run(":8080")
}
