package db

import (
	"fmt"
	"log"
	"os"

	"digital-evidence-room-backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}

	fmt.Println("Connected to Database!")

	// Auto Migrate the schema using GORM
	err = DB.AutoMigrate(&models.User{}, &models.Case{}, &models.Document{}, &models.DocumentChunk{})
	if err != nil {
		log.Fatal("Failed to auto-migrate database:", err)
	}
	fmt.Println("Database Migration Completed!")

	// Seed a dummy user for the Sandbox demo
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		DB.Create(&models.User{
			Email: "sandbox@demo.com",
			Name:  "Sandbox User",
		})
		fmt.Println("Seeded dummy user.")
	}
}
